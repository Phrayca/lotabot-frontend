"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";
import { Button, Switch } from "@/components/ui";
import { useToast } from "@/components/Toast";

type LegalDoc = { slug: string; title: string; version: string; body: string };
type LegalStatus = { pending: LegalDoc[]; allAccepted: boolean };

// useSearchParams() (pour lire ?next=...) doit être entouré d'un <Suspense>,
// sinon la génération statique du site échoue à la construction.
export default function LegalAccepterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen max-w-md mx-auto px-6 pt-14">
          <p className="text-dim text-sm">Chargement…</p>
        </div>
      }
    >
      <LegalAccepterContent />
    </Suspense>
  );
}

function LegalAccepterContent() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/mt5-connect";

  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<LegalDoc[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    api<LegalStatus>("/legal/status")
      .then((s) => {
        if (s.allAccepted) {
          router.replace(next);
          return;
        }
        setPending(s.pending);
        setLoading(false);
      })
      .catch((err: any) => {
        toast(err.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allChecked = pending.length > 0 && pending.every((d) => checked[d.slug]);

  async function confirm() {
    if (!allChecked || saving) return;
    setSaving(true);
    try {
      await api("/legal/accept", { method: "POST", body: { slugs: pending.map((d) => d.slug) } });
      toast("Merci, c'est enregistré");
      router.push(next);
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen max-w-md mx-auto px-6 pt-14">
        <p className="text-dim text-sm">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto px-6 pt-14 pb-10">
      <h1 className="heading-font text-xl font-bold mb-1">Avant de continuer</h1>
      <p className="text-dim text-sm mb-6">
        Lis chaque document en entier, puis coche pour confirmer que tu l'acceptes. C'est nécessaire avant
        de connecter un compte MT5.
      </p>

      <div className="flex flex-col gap-4">
        {pending.map((doc) => (
          <div key={doc.slug} className="bg-surface border border-border rounded-md2 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border">
              <div className="font-semibold text-[14.5px]">{doc.title}</div>
              <div className="text-dimmer text-[11.5px] mt-0.5">Version {doc.version}</div>
            </div>
            <div className="px-4 py-3.5 max-h-64 overflow-y-auto text-[13px] text-dim leading-relaxed flex flex-col gap-3">
              {doc.body.split("\n\n").map((para, i) => (
                <p key={i} className="whitespace-pre-line m-0">
                  {para}
                </p>
              ))}
            </div>
            <label className="flex items-center gap-2.5 px-4 py-3.5 border-t border-border cursor-pointer">
              <Switch
                on={!!checked[doc.slug]}
                onClick={() => setChecked((prev) => ({ ...prev, [doc.slug]: !prev[doc.slug] }))}
              />
              <span className="text-[13px] font-medium">J'ai lu et j'accepte ce document</span>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={confirm} disabled={!allChecked || saving}>
          {saving ? "Enregistrement…" : "Continuer"}
        </Button>
      </div>
    </div>
  );
}
