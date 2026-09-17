"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { BackHeader, Button, Chip } from "@/components/ui";
import { useToast } from "@/components/Toast";

type MT5Status = { connected: boolean; brokerServer?: string; accountNumber?: string };

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
