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

function TradeRow({ t, id, openId, setOpenId }: { t: Trade; id: string; openId: string | null; setOpenId: (id: string | null) => void }) {
  const positive = t.amount >= 0;
  const expanded = openId === id;
  const hasDetail = t.openPrice != null || t.closePrice != null || t.lots != null;
  return (
    <div className="border-b border-border last:border-none">
      <button
        onClick={() => hasDetail && setOpenId(expanded ? null : id)}
        className="w-full flex items-center justify-between py-3.5 text-left"
      >
        <div>
          <div className="font-semibold text-[14.5px] flex items-center gap-1.5">
            {t.pair}
            {t.status === "open" && (
              <span className="text-[10.5px] font-semibold text-goldbright bg-[rgba(0,179,164,0.15)] px-1.5 py-[1px] rounded-full">
                en cours
              </span>
            )}
          </div>
          <div className="text-[12.5px] text-dim mt-0.5">{t.time}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className={`font-bold tabular-nums ${positive ? "text-green" : "text-red"}`}>{fmtFcfa(t.amount)}</div>
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
}

export default function PositionsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<"current" | "history">("current");
  const [range, setRange] = useState<Range>("all");
  const [allData, setAllData] = useState<HistoryResponse | null>(null);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // Charge une fois, sans filtre : sert a trouver les positions en cours, qui n'ont pas de
  // "periode" a proprement parler et doivent rester visibles quel que soit le filtre choisi
  // dans l'onglet Recap.
  useEffect(() => {
    api<HistoryResponse>("/trades/history")
      .then(setAllData)
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab !== "history") return;
    setData(null);
    const qs = range === "all" ? "" : `?range=${range}`;
    api<HistoryResponse>(`/trades/history${qs}`)
      .then(setData)
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, tab]);

  const openTrades = allData?.groups.flatMap((g) => g.trades.filter((t) => t.status === "open")) ?? null;
  // L'onglet Recap se concentre sur les trades clotures : les positions en cours ont deja
  // leur propre onglet dedie, pas la peine de les montrer deux fois.
  const historyGroups =
    data?.groups
      .map((g) => ({ ...g, trades: g.trades.filter((t) => t.status === "closed") }))
      .filter((g) => g.trades.length > 0) ?? null;
  const summary = data?.summary;

  return (
    <AppShell>
      <h1 className="heading-font text-lg font-bold pt-4 pb-3">Positions</h1>

      <div className="flex bg-surface2 border border-border rounded-[10px] p-[3px] mb-4">
        {([
          ["current", "En cours"],
          ["history", "Récap & historique"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-[8px] text-[13px] font-semibold ${
              tab === key ? "bg-goldbright text-bg" : "text-dim"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "current" && (
        <>
          {openTrades === null && <p className="text-dim text-[13.5px] mt-2">Chargement…</p>}
          {openTrades !== null && openTrades.length === 0 && (
            <p className="text-dim text-[13.5px] mt-2">Aucune position en cours pour le moment.</p>
          )}
          {openTrades?.map((t, i) => (
            <TradeRow key={i} t={t} id={`cur-${i}`} openId={openId} setOpenId={setOpenId} />
          ))}
        </>
      )}

      {tab === "history" && (
        <>
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

          {historyGroups === null && <p className="text-dim text-[13.5px] mt-5">Chargement…</p>}
          {historyGroups !== null && historyGroups.length === 0 && (
            <p className="text-dim text-[13.5px] mt-5">Aucun trade clôturé pour cette période.</p>
          )}
          {historyGroups?.map((g) => (
            <div key={g.label}>
              <div className="text-[12.5px] text-dimmer mt-5 mb-2 first:mt-5">{g.label}</div>
              {g.trades.map((t, i) => (
                <TradeRow key={i} t={t} id={`${g.label}-${i}`} openId={openId} setOpenId={setOpenId} />
              ))}
            </div>
          ))}
        </>
      )}
    </AppShell>
  );
}
