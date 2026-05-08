import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthSessionChange(callback: (session: Session | null) => void) {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (data.user) await ensureProfile(data.user).catch(() => undefined);
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.user) await ensureProfile(data.user).catch(() => undefined);
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function ensureProfile(user: User) {
  if (!supabase) return;
  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: user.email?.split("@")[0] ?? null,
    updated_at: new Date().toISOString(),
  });
}
