import { useState } from "react";
import { X } from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabase";
import { signInWithEmail, signUpWithEmail } from "../services/authService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSignedUp?: () => void;
};

export function AuthModal({ open, onClose, onSignedUp }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (mode === "login") {
        await signInWithEmail(email.trim(), password);
        onClose();
      } else {
        await signUpWithEmail(email.trim(), password);
        setMessage("Conta criada. Se o Supabase pedir confirmação, confira seu email antes de entrar.");
        onSignedUp?.();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="cute-card-elevated w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-0 shadow-2xl">
        <div className="cute-modal-header flex items-start justify-between gap-4 border-b border-zinc-800 p-5">
          <div>
            <p className="cute-eyebrow">Conta</p>
            <h2 className="mt-1 text-2xl font-black text-zinc-50">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
            <p className="mt-2 text-sm text-zinc-400">Salve seus dados e mantenha o treino sincronizado.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">
          {!isSupabaseConfigured && <p className="mb-4 rounded-2xl bg-amber-950/50 p-3 text-sm font-bold text-amber-200 ring-1 ring-amber-800">Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar login.</p>}
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold text-zinc-300">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="cute-input" required /></label>
            <label className="grid gap-1 text-sm font-bold text-zinc-300">Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="cute-input" required minLength={6} /></label>
          </div>
          {message && <p className="mt-4 rounded-2xl bg-zinc-950 p-3 text-sm text-zinc-300 ring-1 ring-zinc-800">{message}</p>}
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="cute-button cute-button-secondary">{mode === "login" ? "Criar conta" : "Já tenho conta"}</button>
            <button disabled={loading || !isSupabaseConfigured} className="cute-button cute-button-primary disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500">{loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
