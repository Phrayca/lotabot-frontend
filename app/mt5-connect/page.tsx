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
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  async function connect() {
    setError("");
    if (!brokerServer.trim() || !accountNumber.trim() || !password) {
      setError("Tous les champs sont requis.");
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ demoMode: boolean }>("/mt5/connect", {
        method: "POST",
        body: { brokerServer, accountNumber, password },
      });
      toast(data.demoMode ? "Compte connecté, mise en route en cours" : "Compte MT5 connecté");
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
      <div className="flex items-start gap-2.5 bg-[rgba(201,154,75,0.1)] border border-[rgba(201,154,75,0.25)] rounded-md2 px-4 py-3 mb-4 text-[12.5px] text-goldbright leading-relaxed">
        <span>💡</span>
        <span>
          N'oublie pas non plus de compléter ton profil (Profil → Informations personnelles) : c'est
          nécessaire pour recevoir ton rapport hebdo.
        </span>
      </div>
      <p className="text-dim text-sm mb-4">
        Renseigne le mot de passe de ton compte MT5 (celui avec lequel tu passes tes ordres). C'est
        nécessaire pour que le robot puisse trader à ta place — il est chiffré dès son enregistrement,
        et personne ne peut retirer de l'argent de ton compte avec, seulement trader.
      </p>

      <button
        onClick={() => setShowGuide((v) => !v)}
        className="text-goldbright text-[13.5px] font-semibold mb-4"
      >
        {showGuide ? "Masquer le guide" : "Où trouver ces informations ?"}
      </button>

      {showGuide && (
        <div className="bg-surface border border-border rounded-md2 p-4 mb-5 flex flex-col gap-3">
          <GuideStep n={1} text="Ouvre l'application MetaTrader 5 sur ton téléphone ou ton ordinateur." />
          <GuideStep n={2} text="Va dans Réglages (ou le menu ≡) puis touche ton compte de trading." />
          <GuideStep
            n={3}
            text="Sous 'Serveur', tu trouveras le nom exact à coller ci-dessous (ex : JustMarkets-MT5Real)."
          />
          <GuideStep n={4} text="Le numéro de compte est affiché juste au-dessus du serveur." />
          <GuideStep
            n={5}
            text="C'est le mot de passe que tu utilises pour te connecter et trader dans MT5 (pas celui, différent, dit 'investisseur' qui ne permet que de consulter)."
          />
        </div>
      )}

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
          <FieldLabel>Mot de passe MT5</FieldLabel>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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

function GuideStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-5 h-5 rounded-full bg-[rgba(201,154,75,0.18)] text-goldbright text-[11px] font-bold flex items-center justify-center flex-none mt-0.5">
        {n}
      </span>
      <p className="text-[12.5px] text-dim leading-relaxed">{text}</p>
    </div>
  );
}
