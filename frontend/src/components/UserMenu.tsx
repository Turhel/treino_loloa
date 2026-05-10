import type { User } from "@supabase/supabase-js";
import { LogOut, RefreshCcw, UserCircle } from "lucide-react";

type SyncStatus = "Local" | "Sincronizado" | "Sincronizando" | "Erro ao sincronizar";

type Props = {
  user: User | null;
  syncStatus: SyncStatus;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onSyncNow: () => void;
};

export function UserMenu({ user, syncStatus, onOpenAuth, onSignOut, onSyncNow }: Props) {
  const statusClass = syncStatus === "Sincronizado" ? "text-emerald-200 ring-emerald-800 bg-emerald-950/40" : syncStatus === "Sincronizando" ? "text-blue-200 ring-blue-800 bg-blue-950/40" : syncStatus === "Erro ao sincronizar" ? "text-rose-200 ring-rose-800 bg-rose-950/40" : "text-zinc-300 ring-zinc-700 bg-zinc-950";
  return (
    <div className="relative flex items-center gap-2">
      <span title={syncStatus} className={`cute-badge hidden md:inline-flex ${statusClass}`}>{syncStatus}</span>
      <span title={syncStatus} className={`inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-zinc-950 md:hidden ${syncStatus === "Sincronizado" ? "bg-emerald-400" : syncStatus === "Sincronizando" ? "bg-blue-400" : syncStatus === "Erro ao sincronizar" ? "bg-rose-400" : "bg-zinc-500"}`} />
      {user ? (
        <details className="group relative">
          <summary className="list-none">
            <span className="cute-pop inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 text-sm font-black text-zinc-200 transition hover:bg-zinc-800">
              <UserCircle className="h-4 w-4" />
              <span className="hidden max-w-[150px] truncate lg:inline">{user.email}</span>
            </span>
          </summary>
          <div className="cute-card-elevated absolute right-0 z-50 mt-3 w-64 rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-black/50">
            <p className="truncate px-3 py-2 text-xs font-bold text-zinc-500">{user.email}</p>
            <button onClick={onSyncNow} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-900"><RefreshCcw className="h-4 w-4" /> Sincronizar agora</button>
            <button onClick={onSignOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-900"><LogOut className="h-4 w-4" /> Sair</button>
          </div>
        </details>
      ) : (
        <button onClick={onOpenAuth} className="cute-button cute-button-primary h-11 px-3"><UserCircle className="h-4 w-4" /><span className="hidden sm:inline">Entrar / Criar conta</span><span className="sm:hidden">Entrar</span></button>
      )}
    </div>
  );
}
