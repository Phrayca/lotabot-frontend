"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, isLoggedIn } from "@/lib/api";
import { BackHeader, Button, FieldLabel } from "@/components/ui";
import { useToast } from "@/components/Toast";

type Ticket = {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  updatedAt: string;
  lastMessage?: string;
};

const STATUS_LABEL: Record<Ticket["status"], string> = {
  open: "En attente",
  in_progress: "En cours",
  resolved: "Résolu",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function SupportListPage() {
  const router = useRouter();
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  function load() {
    api<{ tickets: Ticket[] }>("/support")
      .then((r) => setTickets(r.tickets))
      .catch((err: any) => toast(err.message));
  }

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    if (!subject.trim() || !body.trim()) {
      toast("Le sujet et le message sont requis.");
      return;
    }
    setSending(true);
    try {
      const t = await api<{ id: string }>("/support", { method: "POST", body: { subject, body } });
      router.push(`/profil/support/${t.id}`);
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto pb-10">
      <BackHeader title="Support" backHref="/profil" />
      <div className="px-5 flex flex-col gap-3.5">
        {!showNew && (
          <Button onClick={() => setShowNew(true)}>Nouveau message</Button>
        )}

        {showNew && (
          <div className="bg-surface border border-border rounded-md2 p-4 flex flex-col gap-3">
            <div>
              <FieldLabel>Sujet</FieldLabel>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Message</FieldLabel>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md2 border border-border bg-surface2 text-[14px] resize-none"
              />
            </div>
            <div className="flex gap-2.5">
              <Button onClick={send} disabled={sending}>
                {sending ? "Envoi…" : "Envoyer"}
              </Button>
              <Button variant="ghost" onClick={() => setShowNew(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        {tickets === null && <p className="text-dim text-sm">Chargement…</p>}
        {tickets?.length === 0 && !showNew && (
          <p className="text-dim text-sm">Aucun message pour l'instant.</p>
        )}
        {tickets?.map((t) => (
          <Link
            key={t.id}
            href={`/profil/support/${t.id}`}
            className="bg-surface border border-border rounded-md2 px-4 py-3.5 flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[14.5px]">{t.subject}</span>
              <span className="text-dimmer text-[11.5px]">{fmtDate(t.updatedAt)}</span>
            </div>
            {t.lastMessage && (
              <p className="text-dim text-[12.5px] truncate m-0">{t.lastMessage}</p>
            )}
            <span
              className={`text-[11.5px] font-semibold self-start px-2 py-0.5 rounded-full mt-1 ${
                t.status === "resolved"
                  ? "bg-greenbg text-green"
                  : t.status === "in_progress"
                  ? "bg-[rgba(201,154,75,0.15)] text-goldbright"
                  : "bg-surface2 text-dim"
              }`}
            >
              {STATUS_LABEL[t.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
