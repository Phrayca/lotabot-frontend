"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { BackHeader, Button, Chip } from "@/components/ui";
import { useToast } from "@/components/Toast";

type MT5Status = {
  connected: boolean;
  brokerServer?: string;
  accountNumber?: string;
  syncToken?: string;
};

export default function MT5StatusPage() {
  const toast = useToast();
  const router = useRouter();
  const [m, setM] = useState<MT5Status | null>(null);

  function load() {
    api<MT5Status>("/mt5")
      .then(setM)
      .catch((err) => toast(err.message));
  }
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function disconnect() {
    try {
      await api("/mt5/disconnect", { method: "POST" });
      toast("Compte MT5 déconnecté");
      load();
    } catch (err: any) {
      toast(err.message);
    }
  }

  function copyToken() {
    if (m?.syncToken && navigator.clipboard) {
      navigator.clipboard.writeText(m.syncToken).catch(() => {});
    }
    toast("Code copié");
  }

  return (
    <div className="min-h-screen max-w-md mx-auto pb-10">
      <BackHeader title="Compte MT5" backHref="/profil" />
      <div className="px-5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px]">
          <div className="flex items-center gap-3">
            <span>🔗</span>
            <div>
              <div className="font-semibold text-[14.5px]">{m?.brokerServer ?? "Aucun compte"}</div>
              <div className="text-[12.5px] text-dim">
                {m?.accountNumber ? `Compte •••• ${m.accountNumber.slice(-4)}` : "—"}
              </div>
            </div>
          </div>
          <Chip tone={m?.connected ? "green" : "dim"}>{m?.connected ? "Connecté" : "Déconnecté"}</Chip>
        </div>

        <div>
          <label className="block text-[12.5px] text-dim mb-[7px]">
            Ton code de synchronisation personnel
          </label>
          <div
            onClick={copyToken}
            className="flex items-center justify-between bg-surface2 border border-border rounded-md2 px-4 py-[15px] cursor-pointer"
          >
            <span className="font-mono text-[13px] break-all pr-3">{m?.syncToken ?? "…"}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-none text-dim">
              <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>
          <p className="text-dimmer text-[12px] mt-2 leading-relaxed">
            Colle ce code dans le paramètre "Code Lotabot" de ton robot (EA) — il permet au robot de
            transmettre tes trades uniquement sur ton propre compte, jamais sur celui d'un autre client.
            Ne le partage à personne.
          </p>
        </div>

        <Button variant="ghost" onClick={() => router.push("/mt5-connect")}>
          Reconnecter un compte
        </Button>
        {m?.connected && (
          <Button variant="dangerText" onClick={disconnect}>
            Déconnecter ce compte
          </Button>
        )}
      </div>
    </div>
  );
}
