"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";
import { BackHeader } from "@/components/ui";
import { useToast } from "@/components/Toast";

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

export default function SupportThreadPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const [t, setT] = useState<TicketDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<{ data: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load(scroll = false) {
    api<TicketDetail>(`/support/${params.id}`)
      .then((data) => {
        setT(data);
        if (scroll) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .catch((err: any) => {
        toast(err.message);
        if (err.message?.includes("introuvable")) router.replace("/profil/support");
      });
  }

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
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
      toast("Ce fichier dépasse 5 Mo, choisis-en un plus léger.");
      return;
    }
    try {
      const data = await readFileAsDataUrl(file);
      setAttachment({ data, name: file.name });
    } catch (err: any) {
      toast(err.message);
    }
  }

  async function send() {
    if (!draft.trim() && !attachment) return;
    setSending(true);
    try {
      await api(`/support/${params.id}/messages`, {
        method: "POST",
        body: { body: draft.trim(), attachmentData: attachment?.data, attachmentName: attachment?.name },
      });
      setDraft("");
      setAttachment(null);
      load(true);
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!t) {
    return (
      <div className="min-h-screen max-w-md mx-auto">
        <BackHeader title="Support" backHref="/profil/support" />
        <p className="text-dim text-sm px-5">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col pb-4">
      <BackHeader title={t.subject} backHref="/profil/support" />
      <div className="px-5 mb-2">
        <span
          className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${
            t.status === "resolved"
              ? "bg-greenbg text-green"
              : t.status === "in_progress"
              ? "bg-[rgba(201,154,75,0.15)] text-goldbright"
              : "bg-surface2 text-dim"
          }`}
        >
          {STATUS_LABEL[t.status]}
        </span>
      </div>

      <div className="flex-1 px-5 flex flex-col gap-3 overflow-y-auto">
        {t.messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderType === "client" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-md2 px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                m.senderType === "client" ? "bg-[rgba(201,154,75,0.15)] text-fg" : "bg-surface border border-border"
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
                  className="flex items-center gap-2 bg-surface2 border border-border rounded-[8px] px-3 py-2 mb-1.5 text-[12.5px]"
                >
                  📎 {m.attachmentName || "Fichier joint"}
                </a>
              )}
              {m.body && <p className="m-0 whitespace-pre-line">{m.body}</p>}
              <div className="text-dimmer text-[11px] mt-1">
                {m.senderType === "admin" ? "Support Lotabot" : "Toi"} · {fmtTime(m.createdAt)}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-5 pt-3 pb-1">
        {attachment && (
          <div className="flex items-center justify-between bg-surface2 border border-border rounded-md2 px-3.5 py-2 mb-2 text-[12.5px]">
            <span className="truncate pr-2">📎 {attachment.name}</span>
            <button onClick={() => setAttachment(null)} className="text-dim flex-none">
              ✕
            </button>
          </div>
        )}
        <div className="flex items-end gap-2.5">
          <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={onPickFile} />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-none min-h-[44px] w-[44px] rounded-md2 border border-border bg-surface2 text-dim text-[18px]"
            aria-label="Joindre un fichier"
          >
            📎
          </button>
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Écris ton message…"
            className="flex-1 min-w-0 min-h-[52px] px-3.5 py-2.5 rounded-md2 border border-border bg-surface2 text-[14px] leading-relaxed resize-none"
          />
          <button
            onClick={send}
            disabled={sending || (!draft.trim() && !attachment)}
            className="flex-none min-h-[44px] px-5 rounded-md2 bg-goldbright text-bg font-bold text-[14px] disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
