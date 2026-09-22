"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, isAdminLoggedIn } from "@/lib/adminApi";
import AdminShell from "@/components/AdminShell";

type LegalAcceptance = { slug: string; version: string; acceptedAt: string; ipAddress?: string };
type Trade = { externalId?: string; pair: string; amountUsd: number; status: string; openedAt: string };

type ClientDetail = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  createdAt: string;
  plan: string;
  subscriptionStatus: string;
  subscriptionRenewsAt?: string;
  mt5Connected: boolean;
  brokerServer?: string;
  accountMasked?: string;
  robotStatus: "active" | "paused" | "safety_stop" | "not_connected";
  robotStatusMessage?: string;
  riskLevel: number;
  lot: number;
  maxPositions: number;
  balanceUsd: number;
  weekChangePct: number;
  openTrades: number;
  legalAcceptances: LegalAcceptance[];
  recentTrades: Trade[];
};

const RISK_LABELS = ["Prudent", "Modéré", "Agressif"];
const ROBOT_LABEL: Record<ClientDetail["robotStatus"], string> = {
  active: "Actif",
  paused: "En pause",
  safety_stop: "Arrêt de sécurité",
  not_connected: "Non connecté",
};
const DOC_TITLES: Record<string, string> = {
  cgu: "Conditions générales",
  risques: "Avertissement sur les risques",
  "autorisation-mt5": "Autorisation de trading MT5",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminClientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [c, setC] = useState<ClientDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    adminApi<ClientDetail>(`/admin/clients/${params.id}`)
      .then(setC)
      .catch((err: any) => {
        setError(err.message);
        if (err.message?.includes("Session")) router.replace("/admin/login");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (error) {
    return (
      <AdminShell>
        <p className="text-[#9C2F1B] text-sm">{error}</p>
        <Link href="/admin/clients" className="text-[#5B6270] text-sm underline">
          Retour à la liste
        </Link>
      </AdminShell>
    );
  }

  if (!c) {
    return (
      <AdminShell>
        <p className="text-[#5B6270] text-sm">Chargement…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="text-[#5B6270] text-[13px] mb-3">
        <Link href="/admin/clients" className="underline">
          Clients
        </Link>{" "}
        / {c.fullName}
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="w-14 h-14 rounded-full bg-[#ECE8DF] text-[#4A5160] font-bold text-lg flex items-center justify-center">
          {c.fullName
            .split(" ")
            .map((p) => p[0])
            .join("")}
        </div>
        <div>
          <h1 className="text-[28px] font-bold m-0" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            {c.fullName}
          </h1>
          <div className="text-[#5B6270] text-sm mt-0.5">
            {c.phone} · inscrit le {fmtDate(c.createdAt)}
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#E4ECF8] text-[#1F4E8C]">
          {c.plan === "premium" ? "Premium" : "Classique"}
        </span>
        {c.robotStatus === "safety_stop" && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#FBE7E2] text-[#9C2F1B]">
            Arrêt de sécurité
          </span>
        )}
      </div>

      {c.robotStatus === "safety_stop" && (
        <div className="bg-[#FBE7E2] border border-[#E3B8AE] rounded-2xl px-5 py-4 mb-6">
          <div className="font-bold text-[#9C2F1B]">Le robot est en arrêt de sécurité</div>
          <div className="text-[#6E2314] mt-1 text-sm">
            {c.robotStatusMessage || "Une baisse trop importante a mis le robot en pause sur ce compte."}
          </div>
          <div className="text-[#6E2314] mt-2 text-[12.5px]">
            La remise en route se fait pour l'instant directement sur le serveur du bridge (bientôt un bouton ici).
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#E4DED2] rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <h2 className="text-[15px] font-bold m-0">Compte MT5</h2>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                  c.mt5Connected ? "bg-[#E3F3EA] text-[#14633B]" : "bg-[#ECE8DF] text-[#4A5160]"
                }`}
              >
                {c.mt5Connected ? "Connecté" : "Non connecté"}
              </span>
            </div>
            <dl className="grid grid-cols-[150px_1fr] gap-y-2.5 mt-3.5 text-sm">
              <dt className="text-[#5B6270]">Serveur</dt>
              <dd className="font-semibold m-0">{c.brokerServer ?? "—"}</dd>
              <dt className="text-[#5B6270]">Compte</dt>
              <dd className="font-semibold m-0">{c.accountMasked ?? "—"}</dd>
              <dt className="text-[#5B6270]">Solde</dt>
              <dd className="font-semibold m-0">${c.balanceUsd.toFixed(2)}</dd>
              <dt className="text-[#5B6270]">Variation 7 j</dt>
              <dd className={`font-semibold m-0 ${c.weekChangePct < 0 ? "text-[#9C2F1B]" : "text-[#14633B]"}`}>
                {c.weekChangePct >= 0 ? "+" : ""}
                {c.weekChangePct}%
              </dd>
              <dt className="text-[#5B6270]">Trades ouverts</dt>
              <dd className="font-semibold m-0">{c.openTrades}</dd>
            </dl>
          </div>

          <div className="bg-white border border-[#E4DED2] rounded-2xl p-5">
            <h2 className="text-[15px] font-bold m-0">Réglages du robot</h2>
            <dl className="grid grid-cols-[150px_1fr] gap-y-2.5 mt-3.5 text-sm">
              <dt className="text-[#5B6270]">Statut</dt>
              <dd className="font-semibold m-0">{ROBOT_LABEL[c.robotStatus]}</dd>
              <dt className="text-[#5B6270]">Niveau de risque</dt>
              <dd className="font-semibold m-0">{RISK_LABELS[c.riskLevel] ?? c.riskLevel}</dd>
              <dt className="text-[#5B6270]">Lot maximum</dt>
              <dd className="font-semibold m-0">{c.lot}</dd>
              <dt className="text-[#5B6270]">Positions max</dt>
              <dd className="font-semibold m-0">{c.maxPositions}</dd>
            </dl>
          </div>

          <div className="bg-white border border-[#E4DED2] rounded-2xl p-5">
            <h2 className="text-[15px] font-bold m-0 mb-3">Trades du robot · 30 derniers jours</h2>
            {c.recentTrades.length === 0 && <p className="text-[#5B6270] text-sm m-0">Aucun trade pour l'instant.</p>}
            {c.recentTrades.map((t, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 border-t border-[#EFE9DD] first:border-t-0 text-sm">
                <span className="text-[#5B6270]">{fmtDate(t.openedAt)}</span>
                <span>{t.pair}</span>
                <span
                  className={`font-semibold ${
                    t.status === "open" ? "text-[#5B6270]" : t.amountUsd >= 0 ? "text-[#14633B]" : "text-[#9C2F1B]"
                  }`}
                >
                  {t.status === "open" ? "En cours" : `${t.amountUsd >= 0 ? "+" : ""}$${t.amountUsd.toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#E4DED2] rounded-2xl p-5">
            <h2 className="text-[15px] font-bold m-0">Abonnement</h2>
            <dl className="grid grid-cols-[150px_1fr] gap-y-2.5 mt-3.5 text-sm">
              <dt className="text-[#5B6270]">Statut</dt>
              <dd className="font-semibold m-0">{c.subscriptionStatus}</dd>
              <dt className="text-[#5B6270]">Renouvellement</dt>
              <dd className="font-semibold m-0">{c.subscriptionRenewsAt ? fmtDate(c.subscriptionRenewsAt) : "—"}</dd>
              <dt className="text-[#5B6270]">E-mail</dt>
              <dd className="font-semibold m-0">{c.email || "—"}</dd>
              <dt className="text-[#5B6270]">Ville</dt>
              <dd className="font-semibold m-0">{c.city || "—"}</dd>
            </dl>
          </div>

          <div className="bg-white border border-[#E4DED2] rounded-2xl p-5">
            <h2 className="text-[15px] font-bold m-0 mb-3">Contrats acceptés</h2>
            {c.legalAcceptances.length === 0 && (
              <p className="text-[#5B6270] text-sm m-0">Aucun document accepté pour l'instant.</p>
            )}
            {c.legalAcceptances.map((a, i) => (
              <div key={i} className="py-2.5 border-t border-[#EFE9DD] first:border-t-0">
                <div className="font-semibold text-sm">
                  {DOC_TITLES[a.slug] ?? a.slug} · v{a.version}
                </div>
                <div className="text-[#5B6270] text-[12.5px] mt-0.5">
                  {fmtDate(a.acceptedAt)}
                  {a.ipAddress ? ` · IP ${a.ipAddress}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
