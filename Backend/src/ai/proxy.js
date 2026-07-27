import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function askGroq(userMessage) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful fintech assistant for FlowFi. Help users with payments, loans, wallets and transactions."
      },
      {
        role: "user",
        content: userMessage
      }
    ],
    model: "llama-3.3-70b-versatile",
  });

  return completion.choices[0]?.message?.content || "";
}
