import { supabase } from "./supabase.js";

export async function requireAuth(allowedRoles = []) {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return { ok: false, reason: "login" };
  }

  const user = sessionData.session.user;

  if (allowedRoles.length === 0) {
    return { ok: true, user };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || !allowedRoles.includes(profile.role)) {
    return { ok: false, reason: "role" };
  }

  return { ok: true, user, role: profile.role };
}
