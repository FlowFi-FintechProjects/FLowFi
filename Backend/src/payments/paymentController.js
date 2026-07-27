import { supabase } from "../config/supabase.js";

export async function sendMoney(req, res) {
  try {
    const { receiverEmail, amount, note } = req.body;
    if (!receiverEmail || amount === undefined || amount <= 0) {
      return res.status(400).json({ error: "Invalid request" });
    }

    if (receiverEmail === req.user.email) {
      return res.status(400).json({ error: "Cannot send money to yourself" });
    }

    // 1. Get sender's wallet (auto-create if missing)
    let { data: senderWallet, error: senderWalletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (senderWalletError) throw senderWalletError;
    if (!senderWallet) {
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert([{ user_id: req.user.id, balance: 0 }])
        .select()
        .single();
      if (createError) throw createError;
      senderWallet = newWallet;
    }

    if (senderWallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // 2. Find receiver user ID
    const { data: receiver, error: receiverError } = await supabase
      .from("users")
      .select("id")
      .eq("email", receiverEmail)
      .maybeSingle();

    if (receiverError) throw receiverError;
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    // 3. Get receiver's wallet (auto-create if missing so transfers never fail with 404)
    let { data: receiverWallet, error: receiverWalletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", receiver.id)
      .maybeSingle();

    if (receiverWalletError) throw receiverWalletError;
    if (!receiverWallet) {
      const { data: newReceiverWallet, error: createReceiverWalletError } = await supabase
        .from("wallets")
        .insert([{ user_id: receiver.id, balance: 0 }])
        .select()
        .single();
      if (createReceiverWalletError) throw createReceiverWalletError;
      receiverWallet = newReceiverWallet;
    }

    // 4. Calculate new balances
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
      .eq("user_id", receiver.id);

    if (updateReceiverError) throw updateReceiverError;

    // 5. Record transaction
    const { error: txnError } = await supabase
      .from("transactions")
      .insert([{
        sender_id: req.user.id,
        receiver_id: receiver.id,
        amount,
        type: "transfer",
        status: "success",
        note: note || "Money transfer"
      }]);

    if (txnError) throw txnError;

    return res.status(200).json({ message: "Transfer successful" });
  } catch (error) {
    console.error("Send Money Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function requestMoney(req, res) {
  try {
    const { fromEmail, amount, note } = req.body;
    if (!fromEmail || amount === undefined || amount <= 0) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { data: targetUser, error: targetError } = await supabase
      .from("users")
      .select("id")
      .eq("email", fromEmail)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { error: txnError } = await supabase
      .from("transactions")
      .insert([{
        sender_id: targetUser.id,
        receiver_id: req.user.id,
        amount,
        type: "request",
        status: "pending",
        note: note || "Money request"
      }]);

    if (txnError) throw txnError;

    return res.status(201).json({ message: "Money request sent" });
  } catch (error) {
    console.error("Request Money Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getTransactions(req, res) {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Return multiple structural formats so whatever your frontend service expects, it works
    return res.status(200).json({ 
      transactions, 
      data: transactions 
    });
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}