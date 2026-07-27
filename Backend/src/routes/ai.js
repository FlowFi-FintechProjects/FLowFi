import { Router } from "express";
import { askGroq } from "../ai/proxy.js";

const router = Router();

router.post("/ask", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    const reply = await askGroq(message);
    res.json({ reply });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
