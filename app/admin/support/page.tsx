"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, isAdminLoggedIn } from "@/lib/adminApi";
import AdminShell from "@/components/AdminShell";

type Ticket = {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  updatedAt: string;
  lastMessage?: string;
  lastSenderType?: string;
};

const STATUS_LABEL: Record<Ticket["status"], string> = {
  open: "En attente",
  in_progress: "En cours",
  resolved: "Résolu",
};

function chipClass(status: Ticket["status"]) {
  const base = "inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap";
  if (status === "resolved") return `${base} bg-[#E3F3EA] text-[#14633B]`;
  if (status === "in_progress") return `${base} bg-[#FBF0D7] text-[#7A5200]`;
  return `${base} bg-[#E4ECF8] text-[#1F4E8C]`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [filter, setFilter] = useState<"all" | Ticket["status"]>("all");
  const [error, setError] = useState("");

  function load() {
    const qs = filter === "all" ? "" : `?status=${filter}`;
    adminApi<{ tickets: Ticket[] }>(`/admin/support${qs}`)
      .then((r) => setTickets(r.tickets))
      .catch((err: any) => {
        setError(err.message);
        if (err.message?.includes("Session")) router.replace("/admin/login");
      });
  }

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <AdminShell>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold m-0" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Support
          </h1>
          <p className="text-[#5B6270] text-sm mt-1.5 m-0">Les messages envoyés par tes clients depuis l'app.</p>
        </div>
        <div className="flex gap-2">
          {(["all", "open", "in_progress", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`min-h-[40px] px-4 rounded-full text-[13px] font-semibold border ${
                filter === f ? "bg-[#1B1F27] text-white border-[#1B1F27]" : "bg-white border-[#CFC7B6]"
              }`}
            >
              {f === "all" ? "Tous" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-[#9C2F1B] text-sm mb-4">{error}</p>}

      <div className="bg-white border border-[#E4DED2] rounded-2xl overflow-hidden">
        {tickets?.map((t) => (
          <Link
            key={t.id}
            href={`/admin/support/${t.id}`}
            className="flex items-start gap-4 px-5 py-4 border-t border-[#EFE9DD] first:border-t-0 hover:bg-[#FAF7F0]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{t.clientName}</span>
                <span className="text-[#5B6270] text-[12px] whitespace-nowrap">{fmtDate(t.updatedAt)}</span>
              </div>
              <div className="font-medium text-[14px] mt-0.5">{t.subject}</div>
              {t.lastMessage && (
                <div className="text-[#5B6270] text-[13px] mt-0.5 truncate">
                  {t.lastSenderType === "admin" ? "Toi : " : ""}
                  {t.lastMessage}
                </div>
              )}
            </div>
            <span className={chipClass(t.status)}>{STATUS_LABEL[t.status]}</span>
          </Link>
        ))}
        {tickets?.length === 0 && (
          <div className="px-5 py-10 text-center text-[#5B6270] text-sm">Aucun message dans cette catégorie.</div>
        )}
      </div>
    </AdminShell>
  );
}
