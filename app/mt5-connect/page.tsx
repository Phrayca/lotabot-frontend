"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";
import { Button, FieldLabel } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function MT5ConnectPage() {
  const router = useRouter();
  const toast = useToast();
  const [brokerServer, setBrokerServer] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [investorPassword, setInvestorPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  async function connect() {
    setError("");
    if (!brokerServer.trim() || !accountNumber.trim() || !investorPassword) {
      setError("Tous les champs sont requis.");
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ demoMode: boolean }>("/mt5/connect", {
        method: "POST",
        body: { brokerServer, accountNumber, investorPassword },
      });
      toast(data.demoMode ? "Compte connecté (mode démo)" : "Compte MT5 connecté");
      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto px-6 pt-14">
      <h1 className="heading-font text-xl font-bold mb-1">Connecte ton compte MT5</h1>
      <p className="text-dim text-sm mb-6">
        Utilise ton mot de passe investisseur (lecture seule) — jamais ton mot de passe principal.
      </p>
      <div className="flex flex-col gap-3.5">
        <div>
          <FieldLabel>Serveur du courtier</FieldLabel>
          <input
            type="text"
            value={brokerServer}
            onChange={(e) => setBrokerServer(e.target.value)}
            placeholder="ex : JustMarkets-MT5Real"
          />
        </div>
        <div>
          <FieldLabel>Numéro de compte</FieldLabel>
          <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Mot de passe investisseur</FieldLabel>
          <input
            type="password"
            value={investorPassword}
            onChange={(e) => setInvestorPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-red text-[13px]">{error}</p>}
        <Button onClick={connect} disabled={loading}>
          {loading ? "Connexion…" : "Connecter mon compte"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/home")}>
          Faire ça plus tard
        </Button>
      </div>
    </div>
  );
}
