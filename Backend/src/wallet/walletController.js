import { supabase } from "../config/supabase.js";

export async function getWallet(req, res) {
  try {
    let { data: wallet, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    // Auto-create wallet if user doesn't have one yet
    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert([{ user_id: req.user.id, balance: 0 }])
        .select()
        .single();

      if (createError) throw createError;
      wallet = newWallet;
    }

    return res.status(200).json({ wallet });
  } catch (error) {
    console.error("Get Wallet Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function deposit(req, res) {
  try {
    const { amount } = req.body;
    if (amount === undefined || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    let { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (walletError) throw walletError;

    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert([{ user_id: req.user.id, balance: 0 }])
        .select()
        .single();

      if (createError) throw createError;
      wallet = newWallet;
    }

    const newBalance = (wallet.balance || 0) + Number(amount);

    const { error: updateError } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("user_id", req.user.id);

    if (updateError) throw updateError;

    const { error: txnError } = await supabase
      .from("transactions")
      .insert([{
        sender_id: req.user.id,
        receiver_id: req.user.id,
        amount,
        type: "deposit",
        status: "success",
        note: "Wallet deposit"
      }]);

    if (txnError) throw txnError;

    return res.status(200).json({ message: "Deposit successful", balance: newBalance });
  } catch (error) {
    console.error("Deposit Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function withdraw(req, res) {
  try {
    const { amount } = req.body;
    if (amount === undefined || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (walletError) throw walletError;
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const newBalance = wallet.balance - amount;

    const { error: updateError } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("user_id", req.user.id);

    if (updateError) throw updateError;

    const { error: txnError } = await supabase
      .from("transactions")
      .insert([{
        sender_id: req.user.id,
        receiver_id: req.user.id,
        amount,
        type: "withdrawal",
        status: "success",
        note: "Wallet withdrawal"
      }]);

    if (txnError) throw txnError;

    return res.status(200).json({ message: "Withdrawal successful", balance: newBalance });
  } catch (error) {
    console.error("Withdraw Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}