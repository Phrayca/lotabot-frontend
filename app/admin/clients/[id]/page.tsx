"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, getAdminToken, isAdminLoggedIn, API_BASE } from "@/lib/adminApi";
import AdminShell from "@/components/AdminShell";

type LegalAcceptance = { slug: string; version: string; acceptedAt: string; ipAddress?: string };
type Trade = { externalId?: string; pair: string; amountUsd: number; status: string; openedAt: string };
type Note = { id: string; body: string; createdAt: string; adminEmail: string };

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
  robotStatus: "active" | "paused" | "safety_stop" | "admin_disabled" | "not_connected";
  robotStatusMessage?: string;
  riskLevel: number;
  lot: number;
  maxPositions: number;
  pair: string;
  adminDisabled: boolean;
  adminDisabledReason?: string;
  balanceUsd: number;
  weekChangePct: number;
  openTrades: number;
  legalAcceptances: LegalAcceptance[];
  recentTrades: Trade[];
};
const PAIR_LABELS: Record<string, string> = {
  XAUUSD: "Or (XAUUSD)",
  EURUSD: "Euro / Dollar (EURUSD)",
  BTCUSD: "Bitcoin (BTCUSD)",
};
const RISK_LABELS = ["Prudent", "Modéré", "Agressif"];
const ROBOT_LABEL: Record<ClientDetail["robotStatus"], string> = {
  active: "Actif",
  paused: "En pause",
  safety_stop: "Arrêt de sécurité",
  admin_disabled: "Désactivé par l'admin",
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

function ActionButton({
  onClick,
  disabled,
  tone = "default",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger" | "primary";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    default: "bg-white border border-[#CFC7B6] text-[#1B1F27]",
    danger: "bg-white border border-[#E3B8AE] text-[#9C2F1B]",
    primary: "bg-[#C99A4B] border-0 text-[#1B1305]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[40px] px-4 rounded-[10px] text-[13.5px] font-semibold disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export default function AdminClientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [c, setC] = useState<ClientDetail | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [extendDays, setExtendDays] = useState("30");
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  function load() {
    return Promise.all([
      adminApi<ClientDetail>(`/admin/clients/${params.id}`),
      adminApi<{ notes: Note[] }>(`/admin/clients/${params.id}/notes`),
    ]).then(([detail, notesRes]) => {
      setC(detail);
      setNotes(notesRes.notes);
    });
  }

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    load().catch((err: any) => {
      setError(err.message);
      if (err.message?.includes("Session")) router.replace("/admin/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function toggleRobot() {
    if (!c) return;
    setBusy("robot");
    setActionMsg("");
    try {
      await adminApi(`/admin/clients/${c.id}/robot`, { method: "PUT", body: { active: c.robotStatus !== "active" } });
      await load();
      setActionMsg("Réglage du robot mis à jour.");
    } catch (err: any) {
      setActionMsg(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function restartMt5() {
    if (!c) return;
    setBusy("restart");
    setActionMsg("");
    try {
      await adminApi(`/admin/clients/${c.id}/mt5/restart`, { method: "POST" });
      await load();
      setActionMsg("Redémarrage demandé : compte quelques minutes le temps que le serveur reprenne la main.");
    } catch (err: any) {
      setActionMsg(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function lockRobot() {
    if (!c) return;
    const reason = window.prompt(
      "Pourquoi désactives-tu le robot sur ce compte ? (visible par le client, optionnel)",
      ""
    );
    if (reason === null) return; // annulé
    setBusy("lock");
    setActionMsg("");
    try {
      await adminApi(`/admin/clients/${c.id}/robot/lock`, { method: "POST", body: { reason } });
      await load();
      setActionMsg("Robot désactivé : le client ne peut plus le réactiver lui-même.");
    } catch (err: any) {
      setActionMsg(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function unlockRobot() {
    if (!c) return;
    setBusy("unlock");
    setActionMsg("");
    try {
      await adminApi(`/admin/clients/${c.id}/robot/unlock`, { method: "POST" });
      await load();
      setActionMsg("Robot réactivable par le client à nouveau.");
    } catch (err: any) {
      setActionMsg(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function extendSubscription() {
    if (!c) return;
    const days = parseInt(extendDays, 10);
    if (!days || days <= 0) {
      setActionMsg("Indique un nombre de jours valide.");
      return;
    }
    setBusy("extend");
    setActionMsg("");
    try {
      await adminApi(`/admin/clients/${c.id}/subscription/extend`, { method: "POST", body: { days } });
      await load();
      setActionMsg(`${days} jour(s) offert(s).`);
    } catch (err: any) {
      setActionMsg(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function saveNote() {
    if (!c || !noteDraft.trim()) return;
    setBusy("note");
    try {
      const res = await adminApi<{ notes: Note[] }>(`/admin/clients/${c.id}/notes`, {
        method: "POST",
        body: { body: noteDraft.trim() },
      });
      setNotes(res.notes);
      setNoteDraft("");
    } catch (err: any) {
      setActionMsg(err.message);
    } finally {
      setBusy(null);
    }
  }

  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [docText, setDocText] = useState<Record<string, string>>({});
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  async function toggleDocText(slug: string, version: string) {
    const key = `${slug}-${version}`;
    if (expandedDoc === key) {
      setExpandedDoc(null);
      return;
    }
    setExpandedDoc(key);
    if (!docText[key]) {
      try {
        const res = await adminApi<{ body: string }>(`/admin/clients/${c!.id}/legal/${slug}/${version}`);
        setDocText((prev) => ({ ...prev, [key]: res.body }));
      } catch (err: any) {
        setActionMsg(err.message);
      }
    }
  }

  async function downloadDocPdf(slug: string, version: string) {
    if (!c) return;
    const key = `${slug}-${version}`;
    setDownloadingPdf(key);
    setActionMsg("");
    try {
      const token = getAdminToken();
      const res = await fetch(
        `${API_BASE}/admin/clients/${c.id}/legal/${slug}/${version}/pdf`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error(`Erreur ${res.status} lors du téléchargement`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-v${version}-${c.phone.replace(/\D/g, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setActionMsg(err.message);
    } finally {
      setDownloadingPdf(null);
    }
  }

  async function deleteClient() {
    if (!c || deleteConfirm.trim() !== c.phone) return;
    setBusy("delete");
    setActionMsg("");
    try {
      await adminApi(`/admin/clients/${c.id}`, { method: "DELETE", body: { confirmPhone: deleteConfirm.trim() } });
      router.push("/admin/clients");
    } catch (err: any) {
      setActionMsg(err.message);
      setBusy(null);
    }
  }

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

      <div className="flex items-center gap-4 mb-4 flex-wrap">
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
        {c.adminDisabled && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#FBE7E2] text-[#9C2F1B]">
            Désactivé par l'admin
          </span>
        )}
        <span className="flex-1" />
        {c.mt5Connected && (
          <>
            {c.adminDisabled ? (
              <ActionButton onClick={unlockRobot} disabled={busy === "unlock"} tone="primary">
                Réactiver le robot (lever le blocage)
              </ActionButton>
            ) : (
              <>
                <ActionButton onClick={toggleRobot} disabled={busy === "robot"}>
                  {c.robotStatus === "active" ? "Mettre en pause" : "Réactiver le robot"}
                </ActionButton>
                <ActionButton onClick={lockRobot} disabled={busy === "lock"} tone="danger">
                  Désactiver (le client ne pourra pas réactiver)
                </ActionButton>
              </>
            )}
            <ActionButton onClick={restartMt5} disabled={busy === "restart"} tone={c.robotStatus === "safety_stop" ? "primary" : "default"}>
              {c.robotStatus === "safety_stop" ? "Remettre à zéro (redémarrer)" : "Redémarrer la connexion"}
            </ActionButton>
          </>
        )}
      </div>

      {actionMsg && <p className="text-[#5B6270] text-[13px] mb-4">{actionMsg}</p>}

      {c.adminDisabled && (
        <div className="bg-[#FBE7E2] border border-[#E3B8AE] rounded-2xl px-5 py-4 mb-6">
          <div className="font-bold text-[#9C2F1B]">Le robot est désactivé par l'admin</div>
          <div className="text-[#6E2314] mt-1 text-sm">
            {c.adminDisabledReason || "Aucune raison indiquée."}
          </div>
          <div className="text-[#6E2314] mt-2 text-[12.5px]">
            Le client voit ce message et ne peut pas réactiver le robot lui-même tant que tu n'as pas cliqué sur
            « Réactiver le robot » ci-dessus.
          </div>
        </div>
      )}

      {c.robotStatus === "safety_stop" && (
        <div className="bg-[#FBE7E2] border border-[#E3B8AE] rounded-2xl px-5 py-4 mb-6">
          <div className="font-bold text-[#9C2F1B]">Le robot est en arrêt de sécurité</div>
          <div className="text-[#6E2314] mt-1 text-sm">
            {c.robotStatusMessage || "Une baisse trop importante a mis le robot en pause sur ce compte."}
          </div>
          <div className="text-[#6E2314] mt-2 text-[12.5px]">
            « Remettre à zéro » redémarre le worker sur un état propre. Vérifie la situation du compte avant de le
            faire.
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
              <dt className="text-[#5B6270]">Paire tradée</dt>
              <dd className="font-semibold m-0">{PAIR_LABELS[c.pair] ?? c.pair}</dd>
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
            <div className="flex items-center gap-2 mt-4">
              <input
                type="number"
                min={1}
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                className="w-20 min-h-[40px] px-3 rounded-[10px] border border-[#CFC7B6] text-[14px]"
              />
              <span className="text-[13px] text-[#5B6270]">jours à offrir</span>
              <ActionButton onClick={extendSubscription} disabled={busy === "extend"} tone="primary">
                Offrir
              </ActionButton>
            </div>
          </div>

          <div className="bg-white border border-[#E4DED2] rounded-2xl p-5">
            <h2 className="text-[15px] font-bold m-0 mb-3">Contrats acceptés</h2>
            {c.legalAcceptances.length === 0 && (
              <p className="text-[#5B6270] text-sm m-0">Aucun document accepté pour l'instant.</p>
            )}
            {c.legalAcceptances.map((a, i) => {
              const key = `${a.slug}-${a.version}`;
              return (
                <div key={i} className="py-2.5 border-t border-[#EFE9DD] first:border-t-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm">
                        {DOC_TITLES[a.slug] ?? a.slug} · v{a.version}
                      </div>
                      <div className="text-[#5B6270] text-[12.5px] mt-0.5">
                        {fmtDate(a.acceptedAt)}
                        {a.ipAddress ? ` · IP ${a.ipAddress}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-none">
                      <button
                        onClick={() => toggleDocText(a.slug, a.version)}
                        className="text-[12px] font-semibold text-[#1F4E8C] px-2 py-1"
                      >
                        {expandedDoc === key ? "Masquer" : "Voir"}
                      </button>
                      <button
                        onClick={() => downloadDocPdf(a.slug, a.version)}
                        disabled={downloadingPdf === key}
                        className="text-[12px] font-semibold text-[#1F4E8C] px-2 py-1 disabled:opacity-50"
                      >
                        {downloadingPdf === key ? "…" : "PDF"}
                      </button>
                    </div>
                  </div>
                  {expandedDoc === key && (
                    <div className="mt-2 bg-[#FAF7F0] border border-[#E4DED2] rounded-[10px] p-3 text-[12.5px] text-[#4A5160] leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto">
                      {docText[key] ?? "Chargement…"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-[#E4DED2] rounded-2xl p-5">
            <h2 className="text-[15px] font-bold m-0 mb-1">Notes internes</h2>
            <p className="text-[#5B6270] text-[12.5px] m-0 mb-3">Visibles par les admins uniquement.</p>
            <textarea
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Ajouter une note…"
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#CFC7B6] text-[13.5px] resize-none"
            />
            <div className="mt-2">
              <ActionButton onClick={saveNote} disabled={busy === "note" || !noteDraft.trim()} tone="primary">
                Enregistrer la note
              </ActionButton>
            </div>
            {notes.map((n) => (
              <div key={n.id} className="py-2.5 border-t border-[#EFE9DD] mt-3 first:mt-0">
                <p className="text-sm m-0 whitespace-pre-line">{n.body}</p>
                <div className="text-[#5B6270] text-[12px] mt-1">
                  {n.adminEmail} · {fmtDate(n.createdAt)}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#E3B8AE] rounded-2xl p-5">
            <h2 className="text-[15px] font-bold m-0 text-[#9C2F1B]">Zone dangereuse</h2>
            <p className="text-[#5B6270] text-[12.5px] m-0 mt-1 mb-3">
              Supprime définitivement ce client : profil, abonnement, connexion MT5, trades, contrats
              acceptés et conversations de support. Impossible de revenir en arrière.
            </p>
            {(c.subscriptionStatus === "active" || c.mt5Connected) && (
              <p className="text-[#9C2F1B] text-[12.5px] font-semibold mb-3">
                ⚠️ Ce compte semble encore actif{c.mt5Connected ? " (compte MT5 connecté)" : ""}. Vérifie avant de
                supprimer.
              </p>
            )}
            {!showDelete ? (
              <ActionButton onClick={() => setShowDelete(true)} tone="danger">
                Supprimer ce client
              </ActionButton>
            ) : (
              <div className="flex flex-col gap-2.5">
                <label className="text-[12.5px] text-[#5B6270]">
                  Recopie le numéro de téléphone du client pour confirmer : <strong>{c.phone}</strong>
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="min-h-[40px] px-3 rounded-[10px] border border-[#CFC7B6] text-[14px]"
                />
                <div className="flex gap-2">
                  <ActionButton onClick={deleteClient} disabled={busy === "delete" || deleteConfirm.trim() !== c.phone} tone="danger">
                    {busy === "delete" ? "Suppression…" : "Confirmer la suppression définitive"}
                  </ActionButton>
                  <ActionButton onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}>Annuler</ActionButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
