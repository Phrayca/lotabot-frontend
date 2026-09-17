"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api";
import { Button, Card, FieldLabel } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<"classique" | "premium">("premium");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!fullName.trim() || !phone.trim() || password.length < 4) {
      setError("Renseigne ton nom, ton numéro et un mot de passe (4 caractères min).");
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ token: string }>("/auth/register", {
        method: "POST",
        body: { fullName, phone, password, plan },
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
      <h1 className="heading-font text-xl font-bold mb-1">Choisis ta formule</h1>
      <p className="text-dim text-sm mb-6">Change de formule à tout moment depuis ton profil.</p>

      <div className="flex flex-col gap-4">
        <PlanCard
          label="Classique"
          price="10 000"
          selected={plan === "classique"}
          onClick={() => setPlan("classique")}
          features={["Robot XAUUSD automatique", "Historique des trades", "Support WhatsApp"]}
        />
        <PlanCard
          label="Premium"
          price="15 000"
          badge="Populaire"
          selected={plan === "premium"}
          onClick={() => setPlan("premium")}
          features={[
            "Tout Classique inclus",
            "Formation vidéo complète",
            "Niveau de risque personnalisé",
            "Rapport hebdo WhatsApp",
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
        {error && <p className="text-red text-[13px]">{error}</p>}
        <Button onClick={submit} disabled={loading}>
          {loading ? "Création…" : `Continuer avec ${plan === "premium" ? "Premium" : "Classique"}`}
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
            <span className="text-green">✓</span> {f}
          </div>
        ))}
      </div>
    </div>
  );
}
