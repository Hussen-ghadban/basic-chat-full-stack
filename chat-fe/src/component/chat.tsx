import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import {
 generateAESKey,
 encryptWithAES,
 encryptAESKeyWithRSA,
 base64ToArrayBuffer,
 isValidBase64,
 cleanBase64,
} from "../utils/encryption";
import { decryptAESKeyWithRSA, decryptWithAES } from "../utils/encryption";

const socket: Socket = io("http://localhost:5000");

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  senderEncryptedKey?: string;
  receiverEncryptedKey?: string;
}

const ChatComponent: React.FC = () => {
  const { receiverId } = useParams<{receiverId: string }>();
  const senderId=(localStorage.getItem("userId"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Join room for current user
  useEffect(() => {
    if (senderId) socket.emit("join", senderId);
  }, [senderId]);

  // Fetch chat history on load
useEffect(() => {
  axios
    .get<Message[]>(`http://localhost:5000/messages/${senderId}/${receiverId}`)
    .then(async (res) => {
      const decrypted = await Promise.all(
        res.data.map(async (msg) => ({
          ...msg,
          content: await decryptMessage(msg), // Pass the entire message object
        }))
      );
      setMessages(decrypted);
    })
    .catch((err) => console.error("Failed to fetch messages:", err));
}, [senderId, receiverId]);

  // Listen for new messages
useEffect(() => {
  socket.on("receive_message", async (message: Message) => {
    const decryptedContent = await decryptMessage(message); // Pass the entire message object
    setMessages((prev) => [...prev, { ...message, content: decryptedContent }]);
  });

  return () => {
    socket.off("receive_message");
  };
}, []);

// Fixed decrypt helper - now accepts Message object
const decryptMessage = async (msg: Message): Promise<string> => {
  const privateKeyBase64 = localStorage.getItem("privateKey");
  if (!privateKeyBase64) return "[No private key found]";

  if (!isValidBase64(privateKeyBase64)) {
    console.error("Invalid private key format in localStorage");
    return "[Corrupted private key]";
  }

  try {
    const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0)).buffer;
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );

    const encryptedKey = senderId === msg.senderId
      ? msg.senderEncryptedKey
      : msg.receiverEncryptedKey;

    if (!encryptedKey) {
      return "[No encrypted key found]";
    }

    if (!isValidBase64(encryptedKey)) {
      console.error("Invalid encrypted key format");
      return "[Corrupted encrypted key]";
    }

    const aesKey = await decryptAESKeyWithRSA(encryptedKey, privateKey);
    const [iv, ciphertext] = msg.content.split(":");
    
    if (!iv || !ciphertext) {
      return "[Invalid message format]";
    }
    
    if (!isValidBase64(iv) || !isValidBase64(ciphertext)) {
      console.error("Invalid message content format");
      return "[Corrupted message content]";
    }
    
    return await decryptWithAES(aesKey, ciphertext, iv);
  } catch (e) {
    console.error("Decryption error:", e);
    return "[Failed to decrypt]";
  }
};

const sendMessage = async () => {
  if (!newMessage.trim()) return;

  try {
    const senderPublicKeyBase64 = localStorage.getItem("publicKey");
    const senderPrivateKeyBase64 = localStorage.getItem("privateKey");

    if (!senderPublicKeyBase64 || !senderPrivateKeyBase64) {
      console.error("Missing sender keys");
      return;
    }

    // Validate base64 strings before using them
    if (!isValidBase64(senderPublicKeyBase64)) {
      console.error("Invalid sender public key format");
      alert("Your public key is corrupted. Please sign up again.");
      return;
    }

    const { data: receiver } = await axios.get(`http://localhost:5000/auth/users/${receiverId}`);
    console.log("tftyf",receiver.data.publicKey)
    const receiverPublicKeyBase64 = receiver.data.publicKey;

    console.log("Receiver public key:", receiverPublicKeyBase64);
    console.log("Receiver public key length:", receiverPublicKeyBase64?.length);
    console.log("Receiver public key type:", typeof receiverPublicKeyBase64);

    if (!receiverPublicKeyBase64) {
      console.error("No receiver public key found");
      alert("Receiver has no public key. They need to sign up again.");
      return;
    }

    // Try to clean and validate the receiver's public key
    let cleanedReceiverKey;
    try {
      cleanedReceiverKey = cleanBase64(receiverPublicKeyBase64);
      console.log("Cleaned receiver key length:", cleanedReceiverKey.length);
    } catch (error) {
      console.error("Failed to clean receiver public key:", error);
      alert("Receiver's public key format is invalid. They need to sign up again.");
      return;
    }

    if (!isValidBase64(cleanedReceiverKey)) {
      console.error("Invalid receiver public key format after cleaning");
      alert("Receiver's public key is corrupted even after cleaning.");
      return;
    }

    // Convert keys with better error handling
    const importKey = async (base64: string, type: "spki" | "pkcs8") => {
      try {
        const keyBuffer = base64ToArrayBuffer(base64);
        return await window.crypto.subtle.importKey(
          type,
          keyBuffer,
          { name: "RSA-OAEP", hash: "SHA-256" },
          true,
          type === "spki" ? ["encrypt"] : ["decrypt"]
        );
      } catch (error) {
        console.error(`Failed to import ${type} key:`, error);
        throw new Error(`Invalid ${type} key format`);
      }
    };

    console.log("Importing sender public key...");
    const senderPublicKey = await importKey(senderPublicKeyBase64, "spki");
    
    console.log("Importing receiver public key...");
    const receiverPublicKey = await importKey(cleanedReceiverKey, "spki");

    // 🔐 Encrypt message using AES
    console.log("Generating AES key...");
    const aesKey = await generateAESKey();
    const { iv, ciphertext } = await encryptWithAES(aesKey, newMessage);

    // 🔐 Encrypt AES key for both users
    console.log("Encrypting AES key for both users...");
    const senderEncryptedKey = await encryptAESKeyWithRSA(aesKey, senderPublicKey);
    const receiverEncryptedKey = await encryptAESKeyWithRSA(aesKey, receiverPublicKey);

    // Send message to backend
    console.log("Sending message to backend...");
    const { data: savedMessage } = await axios.post("http://localhost:5000/messages", {
      senderId,
      receiverId,
      content: `${iv}:${ciphertext}`,
      senderEncryptedKey,
      receiverEncryptedKey,
    });

    setMessages((prev) => [...prev, { ...savedMessage, content: newMessage }]);
    setNewMessage("");
    console.log("Message sent successfully!");
  } catch (error) {
    console.error("Failed to send message:", error);
    alert(`Failed to send message: ${error}`);
  }
};

  return (
    <div className="p-4">
      <div className="border p-4 h-96 overflow-y-scroll">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.senderId === senderId ? "text-right" : "text-left"}>
            <span className="block">{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          className="border p-2 flex-1"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="bg-blue-500 text-white px-4" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;