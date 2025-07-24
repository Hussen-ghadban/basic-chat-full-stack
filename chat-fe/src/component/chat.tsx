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
  const { senderId, receiverId } = useParams<{ senderId: string; receiverId: string }>();
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
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Failed to fetch messages:", err));
  }, [senderId, receiverId]);

  // Listen for new messages
  useEffect(() => {
    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  // Send message using REST
  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    try {
      const response = await axios.post<Message>("http://localhost:5000/messages", {
        senderId,
        receiverId,
        content: newMessage,
      });
      setMessages((prev) => [...prev, response.data]); // Add sent message
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
