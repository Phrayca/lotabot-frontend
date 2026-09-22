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
  robotStatus: "active" | "paused" | "safety_stop" | "not_connected";
  robotStatusMessage?: string;
  legalUpToDate: boolean;
  balanceUsd: number;
  createdAt: string;
};

const ROBOT_LABEL: Record<Client["robotStatus"], string> = {
  active: "Actif",
  paused: "En pause",
  safety_stop: "Arrêt de sécurité",
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
  if (status === "safety_stop") return "err";
  if (status === "paused") return "warn";
  return "neutral";
}

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "issues">("all");

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

  const issuesCount =
    clients?.filter((c) => c.robotStatus === "safety_stop" || (c.mt5Connected && !c.legalUpToDate)).length ?? 0;

  const visible =
    filter === "issues"
      ? clients?.filter((c) => c.robotStatus === "safety_stop" || (c.mt5Connected && !c.legalUpToDate))
      : clients;

  return (
    <AdminShell>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold m-0" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Clients
          </h1>
          <p className="text-[#5B6270] text-sm mt-1.5 m-0">
            {clients ? `${clients.length} client${clients.length > 1 ? "s" : ""}` : "Chargement…"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`min-h-[40px] px-4 rounded-full text-[13px] font-semibold border ${
              filter === "all" ? "bg-[#1B1F27] text-white border-[#1B1F27]" : "bg-white border-[#CFC7B6]"
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter("issues")}
            className={`min-h-[40px] px-4 rounded-full text-[13px] font-semibold border ${
              filter === "issues" ? "bg-[#9C2F1B] text-white border-[#9C2F1B]" : "bg-[#FBE7E2] text-[#9C2F1B] border-[#E3B8AE]"
            }`}
          >
            À surveiller · {issuesCount}
          </button>
        </div>
      </div>

      {error && <p className="text-[#9C2F1B] text-sm mb-4">{error}</p>}

      <div className="bg-white border border-[#E4DED2] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1.7fr_1.3fr_1fr_1fr] gap-3 px-5 min-h-[44px] items-center bg-[#FAF7F0] border-b border-[#E4DED2] text-[12px] font-semibold text-[#5B6270] uppercase tracking-wide">
          <span>Client</span>
          <span>Formule</span>
          <span>Compte MT5</span>
          <span>Robot</span>
          <span>Contrats</span>
          <span>Solde</span>
        </div>
        {visible?.map((c) => (
          <Link
            key={c.id}
            href={`/admin/clients/${c.id}`}
            className="grid grid-cols-[2fr_1fr_1.7fr_1.3fr_1fr_1fr] gap-3 px-5 min-h-[64px] items-center border-t border-[#EFE9DD] hover:bg-[#FAF7F0]"
          >
            <div>
              <div className="font-semibold">{c.fullName}</div>
              <div className="text-[#5B6270] text-[12px]">{c.phone}</div>
            </div>
            <span>{c.plan === "premium" ? "Premium" : "Classique"}</span>
            <div>
              <div className="font-medium">
                {c.brokerServer ?? "—"} <span className="text-[#5B6270]">{c.accountMasked}</span>
              </div>
              <span className={chipClass(c.mt5Connected ? "ok" : "neutral")}>
                {c.mt5Connected ? "Connecté" : "Non connecté"}
              </span>
            </div>
            <span className={chipClass(robotChipKind(c.robotStatus))}>{ROBOT_LABEL[c.robotStatus]}</span>
            <span className={chipClass(c.legalUpToDate ? "ok" : "warn")}>
              {c.legalUpToDate ? "À jour" : "À signer"}
            </span>
            <span className="font-semibold tabular-nums">${c.balanceUsd.toFixed(2)}</span>
          </Link>
        ))}
        {visible?.length === 0 && (
          <div className="px-5 py-10 text-center text-[#5B6270] text-sm">Aucun client dans cette liste.</div>
        )}
      </div>
    </AdminShell>
  );
}
