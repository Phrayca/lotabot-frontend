"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { RowItem, Button } from "@/components/ui";
import { useToast } from "@/components/Toast";

type Profile = {
  fullName: string;
  plan: string;
  subscriptionStatus: string;
  phone: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const STATUS_LABEL: Record<string, string> = {
  active: "actif",
  trialing: "essai gratuit",
  cancelled: "annulé",
};

export default function ProfilPage() {
  const router = useRouter();
  const toast = useToast();
  const [p, setP] = useState<Profile | null>(null);

  useEffect(() => {
    api<Profile>("/profile")
      .then(setP)
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    setToken(null);
    router.push("/login");
  }

  return (
    <AppShell>
      <div className="pt-5">
        <div className="flex items-center gap-3.5 mb-5.5">
          <div className="w-16 h-16 rounded-full bg-[rgba(201,154,75,0.2)] text-goldbright flex items-center justify-center font-bold text-xl">
            {p ? initials(p.fullName) : "…"}
          </div>
          <div>
            <div className="heading-font font-bold text-[17px]">{p?.fullName ?? "…"}</div>
            <div className="text-dim text-[13px]">
              {p ? `Abonnement ${p.plan === "premium" ? "Premium" : "Classique"} - ${STATUS_LABEL[p.subscriptionStatus] ?? p.subscriptionStatus}` : ""}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <RowItem href="/profil/infos">
            <div className="flex items-center gap-3">
              <span>👤</span>
              <span>Informations personnelles</span>
            </div>
            <span className="text-dim">›</span>
          </RowItem>
          <RowItem href="/profil/abonnement">
            <div className="flex items-center gap-3">
              <span>💳</span>
              <span>Abonnement et paiement</span>
            </div>
            <span className="text-dim">›</span>
          </RowItem>
          <RowItem href="/profil/mt5">
            <div className="flex items-center gap-3">
              <span>🔗</span>
              <span>Compte MT5 connecté</span>
            </div>
            <span className="text-dim">›</span>
          </RowItem>
          <RowItem href="/profil/notifications">
            <div className="flex items-center gap-3">
              <span>🔔</span>
              <span>Notifications</span>
            </div>
            <span className="text-dim">›</span>
          </RowItem>
        </div>
        <Button variant="dangerText" onClick={logout} className="mt-6 text-left justify-start">
          ↩ Se déconnecter
        </Button>
      </div>
    </AppShell>
  );
}
