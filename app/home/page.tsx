"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useToast } from "@/components/Toast";

type Dashboard = {
  fullName: string;
  plan: string;
  balance: number;
  balanceUsd: number;
  weekChangePct: number;
  robotActive: boolean;
  mt5Connected: boolean;
  pair: string;
  dayGain: number;
  dayGainUsd: number;
  openTrades: number;
  profileComplete: boolean;
  subscriptionStatus: string;
  robotStatus: "active" | "paused" | "safety_stop" | "not_connected";
  robotStatusMessage?: string | null;
};

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function fmtUsd(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ROBOT_LABEL: Record<Dashboard["robotStatus"], string> = {
  active: "Actif",
  paused: "En pause",
  safety_stop: "Arrêt de sécurité",
  not_connected: "Aucun compte MT5 connecté",
};

export default function HomePage() {
  const toast = useToast();
  const [d, setD] = useState<Dashboard | null>(null);

  async function load() {
    try {
      const data = await api<Dashboard>("/trades/dashboard");
      setD(data);
    } catch (err: any) {
      toast(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleRobot() {
    if (!d || d.robotStatus === "safety_stop") return; // se relance depuis le support, pas ce bouton
    try {
      const r = await api<{ active: boolean }>("/robot/toggle", { method: "PUT" });
      setD((prev) => (prev ? { ...prev, robotActive: r.active } : prev));
      await load(); // recalcule robotStatus côté serveur (paused/active) plutôt que le deviner ici
    } catch (err: any) {
      toast(err.message);
    }
  }

  const status = d?.robotStatus ?? "not_connected";
  const icon = status === "safety_stop" ? "⛔" : status === "active" ? "🤖" : "⏸️";

  return (
    <AppShell>
      <div className="pt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-dim text-sm">Bonjour</div>
            <div className="heading-font text-lg font-bold">{d?.fullName ?? "…"}</div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-[10px] py-1 rounded-full bg-[rgba(201,154,75,0.15)] text-goldbright">
              {d?.plan === "premium" ? "Premium" : "Classique"}
            </span>
            <Link
              href="/notifications-center"
              className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center flex-none"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 8a6 6 0 1112 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M9.5 18a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </div>

        {d && d.subscriptionStatus === "expired" && (
          <Link
            href="/profil/abonnement"
            className="flex items-center gap-2.5 bg-redbg border border-[rgba(192,86,59,0.35)] rounded-md2 px-4 py-3 mb-3.5"
          >
            <span className="text-lg flex-none">⏳</span>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-red">Essai terminé, robot en pause</div>
              <div className="text-[12px] text-dim">Active ton abonnement pour reprendre</div>
            </div>
            <span className="text-red text-[12px]">›</span>
          </Link>
        )}

        {d && d.robotStatus === "safety_stop" && (
          <div className="flex items-start gap-2.5 bg-redbg border border-[rgba(192,86,59,0.35)] rounded-md2 px-4 py-3 mb-3.5">
            <span className="text-lg flex-none">⛔</span>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-red">Robot en arrêt de sécurité</div>
              <div className="text-[12px] text-dim leading-relaxed mt-0.5">
                {d.robotStatusMessage || "Une baisse trop importante a mis le robot en pause sur ce compte."}
              </div>
            </div>
          </div>
        )}

        {d && (!d.profileComplete || !d.mt5Connected) && (
          <StartupPill profileComplete={d.profileComplete} mt5Connected={d.mt5Connected} />
        )}

        <div className="bg-surface border border-border rounded-lg2 p-5">
          <div className="text-dim text-[12.5px] mb-1">Solde estimé</div>
          <div className="flex items-baseline gap-2">
            <div className="text-[34px] font-bold tabular-nums">{d ? fmt(d.balance) : "—"} F</div>
            {d && <div className="text-dimmer text-[12px]">≈ ${fmtUsd(d.balanceUsd)}</div>}
          </div>
          <div
            className={`text-[13.5px] font-semibold flex items-center gap-1 mt-1.5 ${
              d && d.weekChangePct < 0 ? "text-red" : "text-green"
            }`}
          >
            {d && d.weekChangePct >= 0 ? "↗ +" : "↘ "}
            {d?.weekChangePct ?? 0}% cette semaine
          </div>
        </div>

        <div
          className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px] mt-3.5 cursor-pointer"
          onClick={toggleRobot}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-none ${
                status === "safety_stop" ? "bg-redbg text-red" : "bg-greenbg text-green"
              }`}
            >
              {icon}
            </div>
            <div>
              <div className="font-semibold text-[14.5px]">Robot {ROBOT_LABEL[status]}</div>
              <div className="text-[12.5px] text-dim">
                {status === "not_connected" ? "Aucun compte MT5 connecté" : d?.pair ?? "XAUUSD"}
              </div>
            </div>
          </div>
          {status !== "safety_stop" && (
            <div
              className={`w-[46px] h-[27px] rounded-full relative flex-none transition-colors ${
                d?.robotActive ? "bg-green" : "bg-surface3"
              }`}
            >
              <div
                className={`absolute top-[3px] w-[21px] h-[21px] rounded-full bg-white transition-all ${
                  d?.robotActive ? "left-[22px]" : "left-[3px]"
                }`}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3.5">
          <div className="bg-surface border border-border rounded-md2 p-4">
            <div className="text-dim text-[12.5px] mb-1.5">Gain du jour</div>
            <div
              className={`text-xl font-bold tabular-nums ${
                d && d.dayGain < 0 ? "text-red" : "text-green"
              }`}
            >
              {d ? (d.dayGain >= 0 ? "+" : "") + fmt(d.dayGain) : "—"} F
            </div>
            {d && (
              <div className="text-dimmer text-[11px] mt-0.5">
                {d.dayGainUsd >= 0 ? "+" : ""}${fmtUsd(d.dayGainUsd)}
              </div>
            )}
          </div>
          <div className="bg-surface border border-border rounded-md2 p-4">
            <div className="text-dim text-[12.5px] mb-1.5">Trades ouverts</div>
            <div className="text-xl font-bold tabular-nums">{d?.openTrades ?? "—"}</div>
          </div>
        </div>

        <Link
          href="/parrainage"
          className="block bg-gradient-to-br from-[rgba(201,154,75,0.16)] to-[rgba(201,154,75,0.06)] border border-[rgba(201,154,75,0.25)] rounded-md2 px-4 py-[15px] font-semibold text-[14.5px] text-goldbright mt-3.5"
        >
          Parraine un ami, gagne un mois offert ↗
        </Link>

        <Link
          href="/formation"
          className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px] mt-3.5"
        >
          <div>
            <div className="font-semibold text-[14.5px]">Formation du mois</div>
            <div className="text-[12.5px] text-dim">Gestion du risque - 12 min</div>
          </div>
          <span className="text-dim">›</span>
        </Link>
      </div>
    </AppShell>
  );
}

function StartupPill({ profileComplete, mt5Connected }: { profileComplete: boolean; mt5Connected: boolean }) {
  const done = (profileComplete ? 1 : 0) + (mt5Connected ? 1 : 0);
  const nextHref = !profileComplete ? "/profil/infos" : "/mt5-connect";
  const nextLabel = !profileComplete ? "Compléter ton profil" : "Connecter ton compte MT5";

  return (
    <Link
      href={nextHref}
      className="flex items-center gap-2.5 bg-[rgba(201,154,75,0.1)] border border-[rgba(201,154,75,0.25)] rounded-full pl-3.5 pr-2.5 py-2 mb-3.5"
    >
      <span className="text-goldbright text-[13px] flex-none">🚀</span>
      <span className="text-[12.5px] text-goldbright font-medium flex-1 truncate">{nextLabel}</span>
      <span className="text-dimmer text-[11px] flex-none">{done}/2</span>
      <span className="text-goldbright text-[12px] flex-none">›</span>
    </Link>
  );
}
