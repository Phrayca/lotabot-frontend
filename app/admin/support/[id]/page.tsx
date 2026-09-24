"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, isAdminLoggedIn } from "@/lib/adminApi";
import AdminShell from "@/components/AdminShell";

type Message = {
  id: string;
  senderType: "client" | "admin";
  senderLabel?: string;
  body: string;
  attachmentData?: string;
  attachmentName?: string;
  attachmentIsImage?: boolean;
  createdAt: string;
};
type TicketDetail = { id: string; subject: string; status: "open" | "in_progress" | "resolved"; messages: Message[] };

const STATUS_LABEL: Record<TicketDetail["status"], string> = {
  open: "En attente",
  in_progress: "En cours",
  resolved: "Résolu",
};

const QUICK_REPLIES = [
  "Merci pour ton message, je regarde ça et je reviens vers toi.",
  "Vérifie que le nom du serveur est exactement JustMarkets-Demo (sans espace, sans « MT5 »).",
  "Le capital minimum pour que le robot puisse trader normalement est d'environ 600 $.",
];

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Impossible de lire ce fichier"));
    reader.readAsDataURL(file);
  });
}

export default function AdminSupportThreadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [t, setT] = useState<TicketDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<{ data: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load(scroll = false) {
    return adminApi<TicketDetail>(`/admin/support/${params.id}`)
      .then((data) => {
        setT(data);
        if (scroll) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
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
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError("Ce fichier dépasse 5 Mo, choisis-en un plus léger.");
      return;
    }
    try {
      const data = await readFileAsDataUrl(file);
      setAttachment({ data, name: file.name });
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function send() {
    if (!draft.trim() && !attachment) return;
    setBusy(true);
    try {
      await adminApi(`/admin/support/${params.id}/reply`, {
        method: "POST",
        body: { body: draft.trim(), attachmentData: attachment?.data, attachmentName: attachment?.name },
      });
      setDraft("");
      setAttachment(null);
      await load(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: TicketDetail["status"]) {
    setBusy(true);
    try {
      await adminApi(`/admin/support/${params.id}/status`, { method: "PUT", body: { status } });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <AdminShell>
        <p className="text-[#9C2F1B] text-sm">{error}</p>
        <Link href="/admin/support" className="text-[#5B6270] text-sm underline">
          Retour à la liste
        </Link>
      </AdminShell>
    );
  }

  if (!t) {
    return (
      <AdminShell>
        <p className="text-[#5B6270] text-sm">Chargement…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="text-[#5B6270] text-[13px] mb-3">
        <Link href="/admin/support" className="underline">
          Support
        </Link>{" "}
        / {t.subject}
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h1 className="text-[24px] font-bold m-0" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          {t.subject}
        </h1>
        <div className="flex gap-2 ml-auto">
          {(["open", "in_progress", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              disabled={busy}
              className={`min-h-[36px] px-3.5 rounded-full text-[12.5px] font-semibold border ${
                t.status === s ? "bg-[#1B1F27] text-white border-[#1B1F27]" : "bg-white border-[#CFC7B6] text-[#1B1F27]"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E4DED2] rounded-2xl flex flex-col" style={{ height: "60vh" }}>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {t.messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderType === "admin" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
                  m.senderType === "admin" ? "bg-[#F3EFE7]" : "bg-[#E4ECF8]"
                }`}
              >
                {m.attachmentData && m.attachmentIsImage && (
                  <a href={m.attachmentData} target="_blank" rel="noopener noreferrer">
                    <img
                      src={m.attachmentData}
                      alt={m.attachmentName || "Pièce jointe"}
                      className="max-w-full rounded-[8px] mb-1.5 block"
                    />
                  </a>
                )}
                {m.attachmentData && !m.attachmentIsImage && (
                  <a
                    href={m.attachmentData}
                    download={m.attachmentName || "fichier"}
                    className="flex items-center gap-2 bg-white border border-[#CFC7B6] rounded-[8px] px-3 py-2 mb-1.5 text-[12.5px]"
                  >
                    📎 {m.attachmentName || "Fichier joint"}
                  </a>
                )}
                {m.body && <p className="m-0 whitespace-pre-line">{m.body}</p>}
                <div className="text-[#5B6270] text-[11px] mt-1">
                  {m.senderType === "admin" ? m.senderLabel ?? "Toi" : "Client"} · {fmtTime(m.createdAt)}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[#E4DED2] p-4">
          <div className="flex gap-2 flex-wrap mb-2.5">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => setDraft(q)}
                className="min-h-[36px] px-3 rounded-full border border-[#CFC7B6] bg-white text-[12px] text-[#5B6270]"
              >
                {q.length > 44 ? q.slice(0, 44) + "…" : q}
              </button>
            ))}
          </div>
          {attachment && (
            <div className="flex items-center justify-between bg-[#F3EFE7] border border-[#CFC7B6] rounded-[10px] px-3.5 py-2 mb-2.5 text-[12.5px]">
              <span className="truncate pr-2">📎 {attachment.name}</span>
              <button onClick={() => setAttachment(null)} className="text-[#5B6270] flex-none">
                ✕
              </button>
            </div>
          )}
          <div className="flex items-end gap-2.5">
            <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={onPickFile} />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-none min-h-[44px] w-[44px] rounded-[10px] border border-[#CFC7B6] bg-white text-[#5B6270] text-[18px]"
              aria-label="Joindre un fichier"
            >
              📎
            </button>
            <textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Écris ta réponse…"
              className="flex-1 px-3.5 py-2.5 rounded-[10px] border border-[#CFC7B6] text-[14px] resize-none"
            />
            <button
              onClick={send}
              disabled={busy || (!draft.trim() && !attachment)}
              className="min-h-[44px] px-5 rounded-[10px] bg-[#C99A4B] text-[#1B1305] font-bold text-[14px] disabled:opacity-50"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
