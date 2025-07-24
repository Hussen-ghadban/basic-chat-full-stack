import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import authRoutes from "./features/auth/auth.routes";

const prisma = new PrismaClient();
const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/auth",authRoutes);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

// WebSocket events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// REST endpoint to send a message
app.post("/messages", async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    // Validate users exist
    const [senderExists, receiverExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId } }),
      prisma.user.findUnique({ where: { id: receiverId } }),
    ]);

    if (!senderExists || !receiverExists) {
      return res.status(404).json({ error: "Sender or receiver not found" });
    }

    // Save message
    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
    });

    // Emit message to the receiver (real-time)
    io.to(receiverId).emit("receive_message", message);

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Endpoint to fetch chat history
app.get("/messages/:senderId/:receiverId", async (req, res) => {
  const { senderId, receiverId } = req.params;
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

httpServer.listen(5000, () => console.log("Server running on port 5000"));
