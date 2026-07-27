import { supabase } from "../config/supabase.js";

export async function getProfile(req, res) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role, is_email_verified, created_at")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, phone } = req.body;
    const updates = {};
    
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", req.user.id);

    if (error) throw error;

    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
