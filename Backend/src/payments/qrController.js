import { supabase } from "../config/supabase.js";
import QRCode from "qrcode";

export async function generateQR(req, res) {
  try {
    const { amount } = req.body;
    if (amount === undefined || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const payload = { userId: req.user.id, email: req.user.email, amount };
    const payloadString = JSON.stringify(payload);
    const dataUrl = await QRCode.toDataURL(payloadString);

    return res.status(200).json({ qr: dataUrl, payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function payViaQR(req, res) {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ error: "Missing QR data" });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid QR data" });
    }

    const { userId: receiverId, amount } = parsedData;

    if (receiverId === req.user.id) {
      return res.status(400).json({ error: "Cannot pay yourself" });
    }

    const { data: senderWallet, error: senderWalletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (senderWalletError) throw senderWalletError;
    if (!senderWallet) {
      return res.status(404).json({ error: "Sender wallet not found" });
    }

    if (senderWallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const { data: receiverWallet, error: receiverWalletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", receiverId)
      .maybeSingle();

    if (receiverWalletError) throw receiverWalletError;
    if (!receiverWallet) {
      return res.status(404).json({ error: "Receiver wallet not found" });
    }

    const newSenderBalance = senderWallet.balance - amount;
    const newReceiverBalance = receiverWallet.balance + amount;

    const { error: updateSenderError } = await supabase
      .from("wallets")
      .update({ balance: newSenderBalance })
      .eq("user_id", req.user.id);

    if (updateSenderError) throw updateSenderError;

    const { error: updateReceiverError } = await supabase
      .from("wallets")
      .update({ balance: newReceiverBalance })
      .eq("user_id", receiverId);

    if (updateReceiverError) throw updateReceiverError;

    const { error: txnError } = await supabase
      .from("transactions")
      .insert([{
        sender_id: req.user.id,
        receiver_id: receiverId,
        amount,
        type: "qr_payment",
        status: "success",
        note: "QR Payment"
      }]);

    if (txnError) throw txnError;

    return res.status(200).json({ message: "QR Payment successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
