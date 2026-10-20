"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BackHeader, Button } from "@/components/ui";
import { useToast } from "@/components/Toast";

type Subscription = {
  plan: string;
  price: number;
  renewsAt: string;
  status: string;
  paymentMethod: "orange" | "wave";
};

const PLAN_PRICES: Record<string, number> = { classique: 10000, premium: 15000 };

export default function AbonnementPage() {
  const toast = useToast();
  const [s, setS] = useState<Subscription | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [changing, setChanging] = useState(false);

  function load() {
    api<Subscription>("/subscription")
      .then(setS)
      .catch((err) => toast(err.message));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function setPayment(method: "orange" | "wave") {
    try {
      const data = await api<Subscription>("/subscription/payment-method", {
        method: "PUT",
        body: { paymentMethod: method },
      });
      setS(data);
      toast("Moyen de paiement mis à jour");
    } catch (err: any) {
      toast(err.message);
    }
  }

  async function confirmChangePlan(plan: "classique" | "premium") {
    setChanging(true);
    try {
      const data = await api<Subscription>("/subscription/change-plan", { method: "POST", body: { plan } });
      setS(data);
      setShowChangePlan(false);
      toast(`Formule ${plan === "premium" ? "Premium" : "Classique"} activée - ${Math.round(data.price).toLocaleString("fr-FR")} F`);
    } catch (err: any) {
      toast(err.message);
    } finally {
      setChanging(false);
    }
  }

  async function confirmCancel() {
    setShowCancel(false);
    try {
      const data = await api<{ activeUntil: string }>("/subscription/cancel", { method: "POST" });
      const date = new Date(data.activeUntil).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      toast(`Abonnement annulé - actif jusqu'au ${date}`);
      load();
    } catch (err: any) {
      toast(err.message);
    }
  }

  const renewDate = s?.renewsAt
    ? new Date(s.renewsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    : "";

  const statusLine =
    s?.status === "cancelled"
      ? `Actif jusqu'au ${renewDate}`
      : s?.status === "expired"
      ? `Essai terminé le ${renewDate}`
      : s?.status === "trialing"
      ? `Essai gratuit jusqu'au ${renewDate}`
      : `Renouvellement le ${renewDate}`;

  return (
    <div className="min-h-screen max-w-md mx-auto pb-10">
      <BackHeader title="Abonnement" backHref="/profil" />
      <div className="px-5">
        <div className="bg-gradient-to-br from-[rgba(201,154,75,0.16)] to-[rgba(201,154,75,0.05)] border border-[rgba(201,154,75,0.3)] rounded-lg2 p-5">
          <div className="text-goldbright text-[13px]">Formule actuelle</div>
          <div className="heading-font text-[21px] font-bold my-1">
            {s ? `${s.plan === "premium" ? "Premium" : "Classique"} - ${Math.round(s.price).toLocaleString("fr-FR")} F/mois` : "…"}
          </div>
          <div className="text-dim text-[13px]">{statusLine}</div>
        </div>

        {s?.status === "expired" && (
          <p className="text-red text-[12.5px] mt-3 leading-relaxed">
            Ton robot est en pause depuis la fin de ton essai. Active une formule ci-dessous pour le reprendre.
          </p>
        )}

        <h3 className="heading-font text-[14.5px] text-dim mt-5 mb-2.5">Moyen de paiement</h3>
        <div className="flex flex-col gap-3.5">
          <div
            onClick={() => setPayment("orange")}
            className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span>📱</span>
              <span>Orange Money</span>
            </div>
            <span className={s?.paymentMethod === "orange" ? "text-green" : "text-dim"}>
              {s?.paymentMethod === "orange" ? "✓" : "›"}
            </span>
          </div>
          <div
            onClick={() => setPayment("wave")}
            className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span>📱</span>
              <span>Wave</span>
            </div>
            <span className={s?.paymentMethod === "wave" ? "text-green" : "text-dim"}>
              {s?.paymentMethod === "wave" ? "✓" : "›"}
            </span>
          </div>
        </div>

        <Button className="mt-5" onClick={() => setShowChangePlan(true)}>
          {s?.status === "expired" || s?.status === "trialing" ? "Activer / changer de formule" : "Changer de formule"}
        </Button>
        {s?.status === "active" && (
          <Button variant="dangerText" className="mt-2" onClick={() => setShowCancel(true)}>
            Annuler l'abonnement
          </Button>
        )}
      </div>

      {showChangePlan && (
        <div className="fixed inset-0 bg-black/55 flex items-end justify-center z-50">
          <div className="max-w-md w-full bg-surface rounded-t-[22px] border-t border-border px-5 pt-6 pb-7">
            <h3 className="heading-font text-lg font-bold mb-1">Choisis ta formule</h3>
            <p className="text-dim text-sm mb-5">
              Ton crédit de parrainage disponible sera déduit automatiquement du montant.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => confirmChangePlan("classique")}
                disabled={changing}
                className={`text-left border rounded-md2 p-4 ${
                  s?.plan === "classique" ? "border-gold bg-[rgba(201,154,75,0.08)]" : "border-border bg-surface2"
                }`}
              >
                <div className="font-semibold">Classique</div>
                <div className="text-dim text-[13px]">{PLAN_PRICES.classique.toLocaleString("fr-FR")} F / mois</div>
              </button>
              <button
                onClick={() => confirmChangePlan("premium")}
                disabled={changing}
                className={`text-left border rounded-md2 p-4 ${
                  s?.plan === "premium" ? "border-gold bg-[rgba(201,154,75,0.08)]" : "border-border bg-surface2"
                }`}
              >
                <div className="font-semibold">Premium</div>
                <div className="text-dim text-[13px]">{PLAN_PRICES.premium.toLocaleString("fr-FR")} F / mois</div>
              </button>
            </div>
            <Button variant="ghost" className="mt-4" onClick={() => setShowChangePlan(false)} disabled={changing}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {showCancel && (
        <div className="fixed inset-0 bg-black/55 flex items-end justify-center z-50">
          <div className="max-w-md w-full bg-surface rounded-t-[22px] border-t border-border px-5 pt-6 pb-7">
            <h3 className="heading-font text-lg font-bold mb-2">Annuler l'abonnement ?</h3>
            <p className="text-dim text-sm mb-5">
              Le robot sera désactivé à la fin de la période en cours, le {renewDate}. Tu peux te réabonner à tout
              moment.
            </p>
            <Button variant="danger" onClick={confirmCancel}>
              Confirmer l'annulation
            </Button>
            <Button variant="ghost" className="mt-2.5" onClick={() => setShowCancel(false)}>
              Garder mon abonnement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
