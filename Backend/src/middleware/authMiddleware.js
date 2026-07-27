import { supabase } from "../config/supabase.js";

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or malformed authorization header" });
    }

    const token = authHeader.split(" ")[1];

    // 1. Validate token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // 2. Self-healing: Ensure a matching row exists in public.users to satisfy foreign keys
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingUser) {
      await supabase.from("users").insert([
        {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split("@")[0],
          role: "user"
        }
      ]);
    }

    // 3. Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || "user"
    };

    next();
  } catch (err) {
    console.error("Auth middleware critical error:", err);
    return res.status(401).json({ error: "Authentication failed" });
  }
}