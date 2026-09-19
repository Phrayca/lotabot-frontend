"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { api, setToken } from "@/lib/api";
import { Button, FieldLabel } from "@/components/ui";

function RegisterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [plan, setPlan] = useState<"classique" | "premium">("premium");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(params.get("code") || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!fullName.trim() || !phone.trim() || password.length < 4) {
      setError("Renseigne ton nom, ton numéro et un mot de passe (4 caractères min).");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ token: string }>("/auth/register", {
        method: "POST",
        body: { fullName, phone, password, plan, referralCode: referralCode.trim() || undefined },
      });
      setToken(data.token);
      router.push("/mt5-connect");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto px-6 pt-10 pb-10">
      <div className="flex items-center gap-2 bg-greenbg text-green text-[13px] font-semibold px-4 py-2.5 rounded-md2 mb-5">
        <span>🎁</span> 2 jours d'essai gratuit, robot inclus — sans engagement
      </div>

      <h1 className="heading-font text-xl font-bold mb-1">Choisis ta formule</h1>
      <p className="text-dim text-sm mb-6">Tu ne seras débité qu'à la fin de ton essai. Change de formule à tout moment.</p>

      <div className="flex flex-col gap-4">
        <PlanCard
          label="Classique"
          price="10 000"
          selected={plan === "classique"}
          onClick={() => setPlan("classique")}
          features={[
            "Connecte ton compte au robot de trading",
            "Historique de trades envoyé par e-mail",
            "Support WhatsApp",
          ]}
        />
        <PlanCard
          label="Premium"
          price="15 000"
          badge="Populaire"
          selected={plan === "premium"}
          onClick={() => setPlan("premium")}
          features={[
            "Tout Classique inclus",
            "Formation vidéo complète sur le trading de l'or",
            "Niveau de risque personnalisé",
            "Rapport hebdo WhatsApp",
            "Assistance d'un analyste financier pour installer le robot",
          ]}
        />
      </div>

      <div className="flex flex-col gap-3.5 mt-8">
        <div>
          <FieldLabel>Nom complet</FieldLabel>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Amadou Diop" />
        </div>
        <div>
          <FieldLabel>Numéro de téléphone</FieldLabel>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="77 xxx xx xx" />
        </div>
        <div>
          <FieldLabel>Mot de passe</FieldLabel>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Confirmer le mot de passe</FieldLabel>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Code de parrainage (optionnel)</FieldLabel>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="Ex : AMADOU80"
          />
        </div>
        {error && <p className="text-red text-[13px]">{error}</p>}
        <Button onClick={submit} disabled={loading}>
          {loading ? "Création…" : `Démarrer mon essai gratuit`}
        </Button>
        <p className="text-center text-dim text-[13.5px]">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-goldbright font-semibold no-underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  label,
  price,
  badge,
  selected,
  onClick,
  features,
}: {
  label: string;
  price: string;
  badge?: string;
  selected: boolean;
  onClick: () => void;
  features: string[];
}) {
  return (
    <div
      onClick={onClick}
      className={`relative border rounded-lg2 p-5 cursor-pointer bg-surface ${
        selected ? "border-gold bg-gradient-to-b from-[rgba(201,154,75,0.09)] to-transparent" : "border-border"
      }`}
    >
      {badge && (
        <span className="absolute -top-[11px] left-5 bg-gold text-[#1c1406] text-[11.5px] font-bold px-[11px] py-[3px] rounded-full">
          {badge}
        </span>
      )}
      <div className="font-semibold">{label}</div>
      <div className="text-[26px] font-bold my-1.5">
        {price} <span className="text-[13px] text-dim font-medium">F / mois</span>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-dim">
            <span className="text-green flex-none mt-0.5">✓</span> {f}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
