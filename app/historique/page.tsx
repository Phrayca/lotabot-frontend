"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useToast } from "@/components/Toast";

type Trade = {
  pair: string;
  time: string;
  amount: number;
  amountUsd: number;
  status: "open" | "closed";
  openPrice?: number | null;
  closePrice?: number | null;
  lots?: number | null;
  sl?: number | null;
  tp?: number | null;
  openedAt?: string | null;
  closedAt?: string | null;
};
type Group = { label: string; trades: Trade[] };
type Summary = { balanceUsd: number; totalProfitUsd: number; totalLossUsd: number; totalNetUsd: number };
type HistoryResponse = { groups: Group[]; summary: Summary };

type Range = "today" | "yesterday" | "week" | "month" | "all";
const RANGE_LABELS: Record<Range, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Semaine",
  month: "Mois",
  all: "Tout",
};

function fmtFcfa(n: number) {
  return (n >= 0 ? "+" : "") + Math.round(n).toLocaleString("fr-FR") + " F";
}
function fmtUsd(n: number) {
  return (n >= 0 ? "+" : "") + "$" + n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPrice(n?: number | null) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 5 });
}
function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function HistoriquePage() {
  const toast = useToast();
  const [range, setRange] = useState<Range>("all");
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [openTrade, setOpenTrade] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    const qs = range === "all" ? "" : `?range=${range}`;
    api<HistoryResponse>(`/trades/history${qs}`)
      .then(setData)
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const groups = data?.groups ?? null;
  const summary = data?.summary;

  return (
    <AppShell>
      <h1 className="heading-font text-lg font-bold pt-4 pb-3">Historique</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-none min-h-[36px] px-3.5 rounded-full text-[13px] font-semibold border ${
              range === r ? "bg-goldbright text-bg border-goldbright" : "bg-surface2 text-dim border-border"
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <div className="bg-surface border border-border rounded-md2 px-3.5 py-3">
            <div className="text-dimmer text-[11.5px]">Solde</div>
            <div className="font-bold text-[15px] tabular-nums mt-0.5">${summary.balanceUsd.toFixed(2)}</div>
          </div>
          <div className="bg-surface border border-border rounded-md2 px-3.5 py-3">
            <div className="text-dimmer text-[11.5px]">Total</div>
            <div className={`font-bold text-[15px] tabular-nums mt-0.5 ${summary.totalNetUsd >= 0 ? "text-green" : "text-red"}`}>
              {fmtUsd(summary.totalNetUsd)}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-md2 px-3.5 py-3">
            <div className="text-dimmer text-[11.5px]">Profit</div>
            <div className="font-bold text-[15px] tabular-nums mt-0.5 text-green">{fmtUsd(summary.totalProfitUsd)}</div>
          </div>
          <div className="bg-surface border border-border rounded-md2 px-3.5 py-3">
            <div className="text-dimmer text-[11.5px]">Perte</div>
            <div className="font-bold text-[15px] tabular-nums mt-0.5 text-red">{fmtUsd(summary.totalLossUsd)}</div>
          </div>
        </div>
      )}

      {groups === null && <p className="text-dim text-[13.5px] mt-5">Chargement…</p>}
      {groups !== null && groups.length === 0 && (
        <p className="text-dim text-[13.5px] mt-5">Aucun trade enregistré pour cette période.</p>
      )}
      {groups?.map((g) => (
        <div key={g.label}>
          <div className="text-[12.5px] text-dimmer mt-5 mb-2 first:mt-5">{g.label}</div>
          {g.trades.map((t, i) => {
            const positive = t.amount >= 0;
            const key = `${g.label}-${i}`;
            const expanded = openTrade === key;
            const hasDetail = t.openPrice != null || t.closePrice != null || t.lots != null;
            return (
              <div key={key} className="border-b border-border last:border-none">
                <button
                  onClick={() => hasDetail && setOpenTrade(expanded ? null : key)}
                  className="w-full flex items-center justify-between py-3.5 text-left"
                >
                  <div>
                    <div className="font-semibold text-[14.5px] flex items-center gap-1.5">
                      {t.pair}
                      {t.status === "open" && (
                        <span className="text-[10.5px] font-semibold text-goldbright bg-[rgba(201,154,75,0.15)] px-1.5 py-[1px] rounded-full">
                          en cours
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-dim mt-0.5">{t.time}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className={`font-bold tabular-nums ${positive ? "text-green" : "text-red"}`}>
                        {fmtFcfa(t.amount)}
                      </div>
                      <div className="text-dimmer text-[11px] mt-0.5">{fmtUsd(t.amountUsd)}</div>
                    </div>
                    {hasDetail && <span className={`text-dimmer text-[11px] transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>}
                  </div>
                </button>
                {expanded && hasDetail && (
                  <div className="bg-surface2 border border-border rounded-md2 px-4 py-3 mb-3.5 grid grid-cols-2 gap-y-2 text-[12.5px]">
                    <span className="text-dim">Lot</span>
                    <span className="text-right font-medium">{t.lots ?? "—"}</span>
                    <span className="text-dim">Prix d'ouverture</span>
                    <span className="text-right font-medium tabular-nums">{fmtPrice(t.openPrice)}</span>
                    <span className="text-dim">Prix de fermeture</span>
                    <span className="text-right font-medium tabular-nums">{fmtPrice(t.closePrice)}</span>
                    <span className="text-dim">Stop loss</span>
                    <span className="text-right font-medium tabular-nums">{fmtPrice(t.sl)}</span>
                    <span className="text-dim">Take profit</span>
                    <span className="text-right font-medium tabular-nums">{fmtPrice(t.tp)}</span>
                    <span className="text-dim">Ouvert le</span>
                    <span className="text-right font-medium">{fmtDateTime(t.openedAt)}</span>
                    <span className="text-dim">Fermé le</span>
                    <span className="text-right font-medium">{fmtDateTime(t.closedAt)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </AppShell>
  );
}
