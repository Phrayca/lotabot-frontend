"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api";
import { Button, FieldLabel } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("771715238");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setError("");
    setLoading(true);
    try {
      const data = await api<{ token: string }>("/auth/login", {
        method: "POST",
        body: { phone, password },
      });
      setToken(data.token);
      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col px-6 pt-16">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-[20px] bg-[rgba(201,154,75,0.14)] flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="4" width="14" height="16" rx="4" stroke="#e4b565" strokeWidth="1.6" />
            <circle cx="9" cy="10" r="1.3" fill="#e4b565" />
            <circle cx="15" cy="10" r="1.3" fill="#e4b565" />
            <path d="M9 15c1 1 5 1 6 0" stroke="#e4b565" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="heading-font text-[22px] mt-4 mb-1 font-bold">Lotabot</h1>
        <p className="text-dim text-sm">Ton robot de trading, à ta poche</p>
      </div>

      <div className="flex flex-col gap-3.5">
        <div>
          <FieldLabel>Numéro de téléphone</FieldLabel>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Mot de passe</FieldLabel>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <p className="text-right -mt-1">
          <a href="#" className="text-goldbright text-[13.5px] no-underline">
            Mot de passe oublié ?
          </a>
        </p>
        {error && <p className="text-red text-[13px]">{error}</p>}
        <Button onClick={login} disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
        <p className="text-center text-dim text-[13.5px]">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-goldbright font-semibold no-underline">
            Créer un compte
          </Link>
        </p>
        <p className="text-center text-dimmer text-xs mt-2">
          Démo : 771715238 / demo1234
        </p>
      </div>
    </div>
  );
}
