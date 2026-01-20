import { supabase } from "./supabase.js";

export async function requireRole(allowed) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "login" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !allowed.includes(profile.role)) {
    return { ok: false, reason: "role" };
  }

  return { ok: true, role: profile.role };
}
