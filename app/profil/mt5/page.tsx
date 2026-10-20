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
  bridgeStatus?: string;
  bridgeError?: string;
};

const BRIDGE_LABEL: Record<string, { text: string; tone: "green" | "gold" | "dim" }> = {
  running: { text: "Robot actif sur ce compte", tone: "green" },
  pending: { text: "Mise en route en cours…", tone: "gold" },
  safety_stop: { text: "Arrêt de sécurité", tone: "dim" },
  error: { text: "Problème de connexion", tone: "dim" },
  disconnected: { text: "Non connecté", tone: "dim" },
};

export default function MT5StatusPage() {
  const toast = useToast();
  const router = useRouter();
  const [m, setM] = useState<MT5Status | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // silent = true : rafraîchissement automatique, sans message d'erreur en cas de coupure réseau
  function load(silent = false) {
    api<MT5Status>("/mt5")
      .then(setM)
      .catch((err) => {
        if (!silent) toast(err.message);
      });
  }

  useEffect(() => {
    load();
    // L'état change tout seul (mise en route, erreur corrigée, arrêt de sécurité) : on le
    // rafraîchit toutes les 10 s
    const timer = setInterval(() => load(true), 10000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const bridge = m?.connected ? BRIDGE_LABEL[m.bridgeStatus || "pending"] : BRIDGE_LABEL.disconnected;
  const isSafetyStop = m?.connected && m.bridgeStatus === "safety_stop";
  const hasError = m?.connected && (m.bridgeStatus === "error" || isSafetyStop);
  const isPending = m?.connected && (m.bridgeStatus === "pending" || !m.bridgeStatus);

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
          <Chip tone={bridge.tone}>{bridge.text}</Chip>
        </div>

        {isPending && (
          <p className="text-dim text-[12.5px] leading-relaxed">
            Ton compte est en cours de connexion. Cela peut prendre quelques minutes : cette page se met à
            jour toute seule.
          </p>
        )}

        {isSafetyStop && (
          <p className="text-red text-[12.5px] leading-relaxed">
            {m?.bridgeError ||
              "Le robot s'est arrêté automatiquement après une baisse trop importante depuis son plus haut. Contacte le support pour le relancer."}
          </p>
        )}

        {hasError && !isSafetyStop && m?.bridgeError && (
          <p className="text-red text-[12.5px] leading-relaxed">{m.bridgeError}</p>
        )}

        <Button variant="ghost" onClick={() => router.push("/mt5-connect")}>
          {hasError && !isSafetyStop ? "Corriger mes identifiants" : "Reconnecter un compte"}
        </Button>
        {m?.connected && (
          <Button variant="dangerText" onClick={disconnect}>
            Déconnecter ce compte
          </Button>
        )}

        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-dimmer text-[12.5px] mt-2 text-left"
        >
          {showAdvanced ? "Masquer les options avancées" : "Options avancées"}
        </button>
        {showAdvanced && (
          <div>
            <label className="block text-[12.5px] text-dim mb-[7px]">
              Code de synchronisation personnel
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
              Réservé à un usage avancé (robot auto-hébergé sur ton propre terminal MT5). Dans le
              fonctionnement normal de Lotabot, tu n'as pas besoin de ce code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
