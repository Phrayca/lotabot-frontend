"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api";
import { Button, FieldLabel } from "@/components/ui";

function RobotIllustration() {
  return (
    <svg width="168" height="168" viewBox="0 0 168 168" fill="none">
      <defs>
        <radialGradient id="glow" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#c99a4b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c99a4b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3542" />
          <stop offset="100%" stopColor="#1a212b" />
        </linearGradient>
        <linearGradient id="visorGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e4b565" />
          <stop offset="100%" stopColor="#c99a4b" />
        </linearGradient>
      </defs>

      <circle cx="84" cy="80" r="80" fill="url(#glow)" />

      {/* candlestick decor, trading theme */}
      <g opacity="0.55">
        <rect x="18" y="98" width="5" height="22" rx="1.5" fill="#3fa873" />
        <rect x="16" y="103" width="9" height="12" rx="1.5" fill="#3fa873" />
        <rect x="140" y="86" width="5" height="26" rx="1.5" fill="#c0563b" />
        <rect x="138" y="88" width="9" height="14" rx="1.5" fill="#c0563b" />
        <rect x="30" y="46" width="4" height="16" rx="1.5" fill="#3fa873" />
        <rect x="28" y="50" width="8" height="9" rx="1.5" fill="#3fa873" />
      </g>

      {/* antenna */}
      <line x1="84" y1="30" x2="84" y2="18" stroke="#8e99a8" strokeWidth="2.5" />
      <circle cx="84" cy="14" r="5" fill="url(#visorGrad)" />

      {/* head */}
      <rect x="52" y="32" width="64" height="46" rx="16" fill="url(#bodyGrad)" stroke="#3a4552" strokeWidth="1.5" />
      <rect x="64" y="50" width="40" height="14" rx="7" fill="url(#visorGrad)" />
      <circle cx="76" cy="57" r="3" fill="#1c1406" />
      <circle cx="92" cy="57" r="3" fill="#1c1406" />

      {/* body */}
      <rect x="42" y="84" width="84" height="58" rx="18" fill="url(#bodyGrad)" stroke="#3a4552" strokeWidth="1.5" />

      {/* chest chart : uptrend line */}
      <polyline
        points="58,122 72,110 84,116 98,98 110,104"
        fill="none"
        stroke="#3fa873"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="110" cy="104" r="3.5" fill="#3fa873" />

      {/* arms */}
      <rect x="30" y="94" width="14" height="30" rx="7" fill="url(#bodyGrad)" stroke="#3a4552" strokeWidth="1.5" />
      <rect x="124" y="94" width="14" height="30" rx="7" fill="url(#bodyGrad)" stroke="#3a4552" strokeWidth="1.5" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen max-w-md mx-auto flex flex-col px-6 pt-10">
      <div className="flex flex-col items-center text-center mb-6">
        <RobotIllustration />
        <h1 className="heading-font text-[22px] mt-2 mb-1 font-bold">Lotabot</h1>
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
      </div>
    </div>
  );
}
