"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, isAdminLoggedIn } from "@/lib/adminApi";
import AdminShell from "@/components/AdminShell";

type Client = {
  id: string;
  fullName: string;
  phone: string;
  plan: string;
  subscriptionStatus: string;
  mt5Connected: boolean;
  brokerServer?: string;
  accountMasked?: string;
  robotStatus: "active" | "paused" | "safety_stop" | "admin_disabled" | "not_connected";
  legalUpToDate: boolean;
  balanceUsd: number;
};

const ROBOT_LABEL: Record<Client["robotStatus"], string> = {
  active: "Actif",
  paused: "En pause",
  safety_stop: "Arrêt de sécurité",
  admin_disabled: "Désactivé",
  not_connected: "Non connecté",
};

function chipClass(kind: "ok" | "warn" | "err" | "neutral") {
  const base = "inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap";
  const tones: Record<string, string> = {
    ok: "bg-[#E3F3EA] text-[#14633B]",
    warn: "bg-[#FBF0D7] text-[#7A5200]",
    err: "bg-[#FBE7E2] text-[#9C2F1B]",
    neutral: "bg-[#ECE8DF] text-[#4A5160]",
  };
  return `${base} ${tones[kind]}`;
}

function robotChipKind(status: Client["robotStatus"]): "ok" | "warn" | "err" | "neutral" {
  if (status === "active") return "ok";
  if (status === "safety_stop" || status === "admin_disabled") return "err";
  if (status === "paused") return "warn";
  return "neutral";
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: "ok" | "err" }) {
  return (
    <div className="bg-white border border-[#E4DED2] rounded-2xl p-5">
      <div className="text-[#5B6270] font-medium">{label}</div>
      <div
        className="mt-1.5"
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontWeight: 600,
          fontSize: 34,
          color: tone === "err" ? "#9C2F1B" : tone === "ok" ? "#14633B" : "#1B1F27",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    adminApi<{ clients: Client[] }>("/admin/clients")
      .then((r) => setClients(r.clients))
      .catch((err: any) => {
        setError(err.message);
        if (err.message?.includes("Session")) router.replace("/admin/login");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = clients?.length ?? 0;
  const robotsActifs = clients?.filter((c) => c.robotStatus === "active").length ?? 0;
  const robotsArretes = total - robotsActifs;
  const abonnementsActifs = clients?.filter((c) => c.subscriptionStatus === "active").length ?? 0;
  const aSurveiller =
    clients?.filter(
      (c) => c.robotStatus === "safety_stop" || c.robotStatus === "admin_disabled" || (c.mt5Connected && !c.legalUpToDate)
    ) ?? [];

  return (
    <AdminShell>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold m-0" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Tableau de bord
          </h1>
          <p className="text-[#5B6270] text-sm mt-1.5 m-0">Vue d'ensemble de tes clients et du robot.</p>
        </div>
        <Link
          href="/admin/clients"
          className="min-h-[40px] px-4 rounded-[10px] border border-[#CFC7B6] bg-white text-[13.5px] font-semibold text-[#1B1F27] inline-flex items-center"
        >
          Voir tous les clients
        </Link>
      </div>

      {error && <p className="text-[#9C2F1B] text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Clients" value={clients === null ? "…" : total} />
        <StatCard label="Robots actifs" value={clients === null ? "…" : robotsActifs} tone="ok" />
        <StatCard label="Robots arrêtés" value={clients === null ? "…" : robotsArretes} />
        <StatCard label="Abonnements actifs" value={clients === null ? "…" : abonnementsActifs} tone="ok" />
      </div>

      <div className="bg-white border border-[#E4DED2] rounded-2xl overflow-hidden">
        <div className="flex items-center px-5 py-4 border-b border-[#E4DED2]">
          <h2 className="text-[15px] font-bold m-0">À surveiller</h2>
          {aSurveiller.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-[#FBE7E2] text-[#9C2F1B]">
              {aSurveiller.length}
            </span>
          )}
        </div>
        <div className="grid grid-cols-[2fr_1.7fr_1.3fr_1fr] gap-3 px-5 min-h-[40px] items-center bg-[#FAF7F0] border-b border-[#E4DED2] text-[12px] font-semibold text-[#5B6270] uppercase tracking-wide">
          <span>Client</span>
          <span>Compte MT5</span>
          <span>Robot</span>
          <span>Solde</span>
        </div>
        {clients === null && <div className="px-5 py-8 text-[#5B6270] text-sm">Chargement…</div>}
        {aSurveiller.map((c) => (
          <Link
            key={c.id}
            href={`/admin/clients/${c.id}`}
            className="grid grid-cols-[2fr_1.7fr_1.3fr_1fr] gap-3 px-5 min-h-[60px] items-center border-t border-[#EFE9DD] hover:bg-[#FAF7F0]"
          >
            <div>
              <div className="font-semibold">{c.fullName}</div>
              <div className="text-[#5B6270] text-[12px]">{c.phone}</div>
            </div>
            <div>
              <div className="font-medium">
                {c.brokerServer ?? "—"} <span className="text-[#5B6270]">{c.accountMasked}</span>
              </div>
              {!c.legalUpToDate && c.mt5Connected && (
                <span className={chipClass("warn")}>Contrat à signer</span>
              )}
            </div>
            <span className={chipClass(robotChipKind(c.robotStatus))}>{ROBOT_LABEL[c.robotStatus]}</span>
            <span className="font-semibold tabular-nums">${c.balanceUsd.toFixed(2)}</span>
          </Link>
        ))}
        {clients !== null && aSurveiller.length === 0 && (
          <div className="px-5 py-8 text-center text-[#5B6270] text-sm">Rien à signaler pour l'instant.</div>
        )}
      </div>
    </AdminShell>
  );
}
