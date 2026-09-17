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
  weekChangePct: number;
  robotActive: boolean;
  mt5Connected: boolean;
  pair: string;
  dayGain: number;
  openTrades: number;
};

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

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
    try {
      const r = await api<{ active: boolean }>("/robot/toggle", { method: "PUT" });
      setD((prev) => (prev ? { ...prev, robotActive: r.active } : prev));
      toast(r.active ? "Robot activé" : "Robot mis en pause");
    } catch (err: any) {
      toast(err.message);
    }
  }

  return (
    <AppShell>
      <div className="pt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-dim text-sm">Bonjour</div>
            <div className="heading-font text-lg font-bold">{d?.fullName ?? "…"}</div>
          </div>
          <span className="text-xs font-bold px-[10px] py-1 rounded-full bg-[rgba(201,154,75,0.15)] text-goldbright">
            {d?.plan === "premium" ? "Premium" : "Classique"}
          </span>
        </div>

        <div className="bg-surface border border-border rounded-lg2 p-5">
          <div className="text-dim text-[12.5px] mb-1">Solde estimé</div>
          <div className="text-[34px] font-bold tabular-nums">{d ? fmt(d.balance) : "—"} F</div>
          <div className="text-green text-[13.5px] font-semibold flex items-center gap-1 mt-1.5">
            {d && d.weekChangePct >= 0 ? "↗ +" : "↘ "}
            {d?.weekChangePct ?? 0}% cette semaine
          </div>
        </div>

        <div
          className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px] mt-3.5 cursor-pointer"
          onClick={toggleRobot}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-greenbg text-green flex items-center justify-center flex-none">🤖</div>
            <div>
              <div className="font-semibold text-[14.5px]">Robot actif</div>
              <div className="text-[12.5px] text-dim">
                {d?.mt5Connected ? (d?.robotActive ? `${d.pair} - copie auto` : "En pause") : "Aucun compte MT5 connecté"}
              </div>
            </div>
          </div>
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
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3.5">
          <div className="bg-surface border border-border rounded-md2 p-4">
            <div className="text-dim text-[12.5px] mb-1.5">Gain du jour</div>
            <div className="text-xl font-bold tabular-nums text-green">
              {d ? (d.dayGain >= 0 ? "+" : "") + fmt(d.dayGain) : "—"} F
            </div>
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
