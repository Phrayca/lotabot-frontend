"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useToast } from "@/components/Toast";

type Trade = { pair: string; time: string; amount: number; amountUsd: number };
type Group = { label: string; trades: Trade[] };

export default function HistoriquePage() {
  const toast = useToast();
  const [groups, setGroups] = useState<Group[] | null>(null);

  useEffect(() => {
    api<{ groups: Group[] }>("/trades/history")
      .then((d) => setGroups(d.groups))
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <h1 className="heading-font text-lg font-bold pt-4 pb-3">Historique</h1>
      {groups === null && <p className="text-dim text-[13.5px]">Chargement…</p>}
      {groups !== null && groups.length === 0 && (
        <p className="text-dim text-[13.5px]">Aucun trade enregistré pour le moment.</p>
      )}
      {groups?.map((g) => (
        <div key={g.label}>
          <div className="text-[12.5px] text-dimmer mt-5 mb-2 first:mt-1">{g.label}</div>
          {g.trades.map((t, i) => {
            const positive = t.amount >= 0;
            return (
              <div key={i} className="flex items-center justify-between py-3.5 border-b border-border last:border-none">
                <div>
                  <div className="font-semibold text-[14.5px]">{t.pair}</div>
                  <div className="text-[12.5px] text-dim mt-0.5">{t.time}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold tabular-nums ${positive ? "text-green" : "text-red"}`}>
                    {positive ? "+" : ""}
                    {Math.round(t.amount).toLocaleString("fr-FR")} F
                  </div>
                  <div className="text-dimmer text-[11px] mt-0.5">
                    {positive ? "+" : ""}${t.amountUsd.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </AppShell>
  );
}
