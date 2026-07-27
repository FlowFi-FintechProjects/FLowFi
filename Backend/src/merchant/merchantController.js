import { supabase } from "../config/supabase.js";

export async function getStats(req, res) {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`);

    if (error) throw error;

    const success = transactions.filter(t => t.status === "success");
    const pending = transactions.filter(t => t.status === "pending");

    const totalRevenue = success.reduce((sum, t) => sum + Number(t.amount), 0);
    const pendingSettlements = pending.reduce((sum, t) => sum + Number(t.amount), 0);
    const successRate = transactions.length
      ? Math.round((success.length / transactions.length) * 100)
      : 0;

    return res.status(200).json({
      data: {
        totalRevenue,
        revenueChange: 0,
        totalOrders: transactions.length,
        ordersChange: 0,
        pendingSettlements,
        successRate,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getTransactions(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: transactions, error, count } = await supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = transactions.map(t => ({
      id: t.id,
      orderId: t.id.slice(0, 8).toUpperCase(),
      description: t.note || t.type,
      createdAt: t.created_at,
      status: t.status,
      fee: 0,
      netAmount: Number(t.amount),
      currency: "INR",
      settlementStatus: t.status === "success" ? "settled" : "pending",
    }));

    return res.status(200).json({ data: { data: mapped, total: count } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getRevenueChart(req, res) {
  try {
    const period = req.query.period || "week";
    const days = period === "week" ? 7 : period === "month" ? 30 : 365;

    const from = new Date();
    from.setDate(from.getDate() - days);

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("amount, created_at")
      .eq("status", "success")
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    const map = new Map();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      map.set(label, 0);
    }

    for (const t of transactions) {
      const label = new Date(t.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      if (map.has(label)) map.set(label, map.get(label) + Number(t.amount));
    }

    return res.status(200).json({
      data: {
        labels: [...map.keys()],
        values: [...map.values()],
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}