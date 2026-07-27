import { Router } from "express";
import { sendNotification } from "../socket/notifications.js";

const router = Router();

// io is injected after server starts to avoid circular import with index.js
let _io = null;
export function setIO(ioInstance) {
  _io = ioInstance;
}

router.post("/payment-sent", (req, res) => {
  const { userId, amount, recipient } = req.body;
  sendNotification(_io, userId, {
    title: "Payment Sent",
    message: `You sent ₹${amount} to ${recipient}`,
    type: "payment",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

router.post("/payment-received", (req, res) => {
  const { userId, amount, sender } = req.body;
  sendNotification(_io, userId, {
    title: "Payment Received",
    message: `You received ₹${amount} from ${sender}`,
    type: "payment",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

router.post("/payment-request", (req, res) => {
  const { userId, amount, requester } = req.body;
  sendNotification(_io, userId, {
    title: "Payment Request",
    message: `${requester} requested ₹${amount} from you`,
    type: "request",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

router.post("/loan-applied", (req, res) => {
  const { userId } = req.body;
  sendNotification(_io, userId, {
    title: "Loan Application",
    message: "Your loan application has been received",
    type: "loan",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

router.post("/loan-status", (req, res) => {
  const { userId, status } = req.body;
  sendNotification(_io, userId, {
    title: "Loan Update",
    message: `Your loan has been ${status}`,
    type: "loan",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

router.post("/welcome", (req, res) => {
  const { userId, name } = req.body;
  sendNotification(_io, userId, {
    title: "Welcome to FlowFi 🎉",
    message: `Hey ${name}, your account is ready!`,
    type: "auth",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

router.post("/email-verified", (req, res) => {
  const { userId } = req.body;
  sendNotification(_io, userId, {
    title: "Email Verified",
    message: "Your email has been verified successfully",
    type: "auth",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

router.post("/wallet-deposit", (req, res) => {
  const { userId, amount } = req.body;
  sendNotification(_io, userId, {
    title: "Wallet Credited",
    message: `₹${amount} has been added to your wallet`,
    type: "wallet",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

router.post("/wallet-withdraw", (req, res) => {
  const { userId, amount } = req.body;
  sendNotification(_io, userId, {
    title: "Wallet Debited",
    message: `₹${amount} has been withdrawn from your wallet`,
    type: "wallet",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

router.post("/wallet-transfer", (req, res) => {
  const { userId, amount, recipient } = req.body;
  sendNotification(_io, userId, {
    title: "Transfer Successful",
    message: `₹${amount} transferred to ${recipient}`,
    type: "wallet",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

router.post("/2fa-login", (req, res) => {
  const { userId } = req.body;
  sendNotification(_io, userId, {
    title: "2FA Login",
    message: "New login verified with 2FA",
    type: "auth",
  });
  res.status(200).json({ success: true, message: "Notification sent" });
});

export default router;