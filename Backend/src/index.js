import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import { registerNotificationHandlers } from "./socket/notifications.js";
import { registerChatHandlers } from "./socket/chat.js";
import { registerSignallingHandlers } from "./socket/signalling.js";
import aiRouter from "./routes/ai.js";
import notifyRouter from "./routes/notify.js";
import authRouter from "./auth/authRoutes.js";
import profileRouter from "./users/profileRoutes.js";
import walletRouter from "./wallet/walletRoutes.js";
import paymentRouter from "./payments/paymentRoutes.js";
import loanRouter from "./loans/loanRoutes.js";
import merchantRouter from "./merchant/merchantRoutes.js";
import splitRouter from "./split/splitRoutes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  credentials: true
};

const io = new Server(httpServer, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/ai", aiRouter);
app.use("/api/notify", notifyRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/loan", loanRouter);
app.use("/api/merchant", merchantRouter);
app.use("/api/split", splitRouter);
app.use("/api/payments", paymentRouter);

app.get("/", (req, res) => {
  res.json({ status: "FlowFi Realtime Server is running 🚀" });
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  registerChatHandlers(io, socket);
  registerNotificationHandlers(io, socket);
  registerSignallingHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };