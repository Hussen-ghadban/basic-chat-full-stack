import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import axios from "axios";

const socket: Socket = io("http://localhost:5000");

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
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
          content: await decryptMessage(msg.content),
        }))
      );
      setMessages(decrypted);
    })
    .catch((err) => console.error("Failed to fetch messages:", err));
}, [senderId, receiverId]);

  // Listen for new messages
useEffect(() => {
  socket.on("receive_message", async (message: Message) => {
    const decryptedContent = await decryptMessage(message.content);
    setMessages((prev) => [...prev, { ...message, content: decryptedContent }]);
  });

  return () => {
    socket.off("receive_message");
  };
}, []);

// Decrypt helper
const decryptMessage = async (base64: string): Promise<string> => {
  const privateKeyBase64 = localStorage.getItem("privateKey");
  console.log("Private Key in storage:", privateKeyBase64?.slice(0, 50)); // Debug

  if (!privateKeyBase64) return "[No private key found]";

  const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0)).buffer;
  const privateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );

  const encryptedBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedBuffer);
    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    return "[Failed to decrypt]";
  }
};

  // Send message using REST
  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    try {
      const { data: receiver } = await axios.get(`http://localhost:5000/auth/users/${receiverId}`);
      // console.log("Receiver Public Key:", receiver.data.publicKey);
    const publicKeyBase64 = receiver.data.publicKey;
 // 2. Decode base64 -> ArrayBuffer -> CryptoKey
    const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0)).buffer;
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    );

    // 3. Encrypt the message
    const encodedMessage = new TextEncoder().encode(newMessage);
    const encryptedBuffer = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encodedMessage);
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));




const response = await axios.post<Message>("http://localhost:5000/messages", {
  senderId,
  receiverId,
  content: encryptedBase64,
});

// ✅ Decrypt message locally before adding to state
const decryptedContent = await decryptMessage(encryptedBase64);
const decryptedMessage = { ...response.data, content: decryptedContent };
setMessages((prev) => [...prev, decryptedMessage]);
      setNewMessage("");
      
    } catch (err) {
      console.error("Failed to send message:", err);
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
