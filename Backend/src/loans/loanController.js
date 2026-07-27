import { supabase } from "../config/supabase.js";

export async function applyLoan(req, res) {
  try {
    const { amount, emi_months } = req.body;
    if (amount === undefined || emi_months === undefined || amount <= 0 || emi_months <= 0) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const emi_amount = Math.ceil(amount / emi_months);

    const { data: loan, error } = await supabase
      .from("loans")
      .insert([{
        user_id: req.user.id,
        amount,
        status: "pending",
        emi_months,
        emi_amount
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ message: "Loan application submitted", loanId: loan.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function updateLoanStatus(req, res) {
  try {
    const { loanId, status } = req.body;
    if (!loanId || !status) {
      return res.status(400).json({ error: "Invalid request" });
    }

    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { error } = await supabase
      .from("loans")
      .update({ status })
      .eq("id", loanId);

    if (error) throw error;

    return res.status(200).json({ message: "Loan status updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getEMISchedule(req, res) {
  try {
    const loanId = req.params.id;
    
    const { data: loan, error } = await supabase
      .from("loans")
      .select("*")
      .eq("id", loanId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    const schedule = [];
    const today = new Date();

    for (let i = 0; i < loan.emi_months; i++) {
      const dueDate = new Date(today.getFullYear(), today.getMonth() + i, today.getDate());
      const formattedDate = dueDate.toISOString().split("T")[0];
      
      schedule.push({
        month: i + 1,
        amount: loan.emi_amount,
        due_date: formattedDate
      });
    }

    return res.status(200).json({ loan, schedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
