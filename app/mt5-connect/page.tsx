"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";
import { Button, FieldLabel } from "@/components/ui";
import { useToast } from "@/components/Toast";

// Serveurs connus, proposés pendant la saisie (le client peut aussi taper le sien).
const KNOWN_SERVERS = ["JustMarkets-Demo"];

const PAIRS: { code: "XAUUSD" | "EURUSD" | "BTCUSD"; label: string; hint: string }[] = [
  { code: "XAUUSD", label: "Or (XAUUSD)", hint: "Le plus tradé chez nous, notre stratégie la plus éprouvée." },
  { code: "EURUSD", label: "Euro / Dollar (EURUSD)", hint: "Moins volatil que l'or, mouvements plus mesurés." },
  { code: "BTCUSD", label: "Bitcoin (BTCUSD)", hint: "Marché ouvert 24h/24, week-end compris — variations plus fortes." },
];

type LegalStatus = { allAccepted: boolean };

export default function MT5ConnectPage() {
  const router = useRouter();
  const toast = useToast();
  const [checkingLegal, setCheckingLegal] = useState(true);
  const [pair, setPair] = useState<(typeof PAIRS)[number]["code"]>("XAUUSD");
  const [brokerServer, setBrokerServer] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    // Les 3 documents (CGU, risques, autorisation MT5) doivent être acceptés avant
    // de pouvoir donner un mot de passe MT5 : sinon on redirige vers cet écran d'abord.
    api<LegalStatus>("/legal/status")
      .then((s) => {
        if (!s.allAccepted) {
          router.replace("/legal/accepter?next=/mt5-connect");
          return;
        }
        setCheckingLegal(false);
      })
      .catch(() => setCheckingLegal(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyServerName() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText("JustMarkets-Demo").catch(() => {});
    }
    toast("Nom du serveur copié");
  }

  async function connect() {
    setError("");
    const server = brokerServer.trim();
    const account = accountNumber.trim();
    if (!server || !account || !password) {
      setError("Tous les champs sont requis.");
      return;
    }
    if (!/^\d+$/.test(account)) {
      setError("Le numéro de compte ne contient que des chiffres.");
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ demoMode: boolean }>("/mt5/connect", {
        method: "POST",
        body: { brokerServer: server, accountNumber: account, password, pair },
      });
      toast(data.demoMode ? "Compte connecté, mise en route en cours" : "Compte MT5 connecté");
      // On affiche l'état du compte : il passe de « Mise en route » à « Robot actif »
      // (ou affiche un message clair si un champ est faux).
      router.push("/profil/mt5");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingLegal) {
    return (
      <div className="min-h-screen max-w-md mx-auto px-6 pt-14">
        <p className="text-dim text-sm">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto px-6 pt-14 pb-10">
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

      <div className="bg-surface border border-border rounded-md2 px-4 py-3.5 mb-5 flex items-start gap-2.5">
        <span className="text-[15px] flex-none">💵</span>
        <p className="text-[12.5px] text-dim leading-relaxed m-0">
          Capital minimum accepté : <strong className="text-ink">100 $</strong>.{" "}
          {pair === "XAUUSD" ? (
            <>
              En dessous d'environ <strong className="text-ink">600 $</strong>, le lot minimum imposé par les
              courtiers pèse plus lourd dans le risque par trade — c'est expliqué dans l'avertissement sur les
              risques que tu as accepté.
            </>
          ) : (
            <>
              Le seuil de capital recommandé pour cette paire peut différer de celui de l'or ; le support peut te
              conseiller un montant précis si besoin.
            </>
          )}
        </p>
      </div>

      <button
        onClick={() => setShowGuide((v) => !v)}
        className="text-goldbright text-[13.5px] font-semibold mb-4"
      >
        {showGuide ? "Masquer le guide" : "Où trouver ces informations ?"}
      </button>

      {showGuide && (
        <div className="bg-surface border border-border rounded-md2 p-4 mb-5 flex flex-col gap-4">
          <GuideStep n={1} text="Ouvre l'application MetaTrader 5 sur ton téléphone ou ton ordinateur." />
          <GuideStep n={2} text="Va dans Réglages (ou le menu ≡) puis touche ton compte de trading." />
          <GuideStep
            n={3}
            text="Repère la ligne « Serveur ». C'est ce nom, EXACTEMENT (sans espace, sans « MT5 »), qu'il faut recopier ci-dessous."
          />

          <div className="bg-bg border border-border rounded-md2 p-3.5">
            <div className="text-dimmer text-[11px] uppercase tracking-wide mb-2">Aperçu (exemple)</div>
            <div className="bg-surface2 rounded-[8px] px-3 py-2.5 flex flex-col gap-1.5">
              <div className="flex justify-between text-[12px] text-dim">
                <span>Compte</span>
                <span>•••• 2564</span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-dim">Serveur</span>
                <span className="font-mono font-semibold text-ink">JustMarkets-Demo</span>
              </div>
            </div>
            <button
              onClick={copyServerName}
              className="mt-3 w-full text-center text-goldbright text-[12.5px] font-semibold py-2"
            >
              Copier « JustMarkets-Demo »
            </button>
          </div>

          <GuideStep n={4} text="Le numéro de compte est affiché juste au-dessus du serveur." />
          <GuideStep
            n={5}
            text="C'est le mot de passe que tu utilises pour te connecter et trader dans MT5 (pas celui, différent, dit 'investisseur' qui ne permet que de consulter)."
          />
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        <div>
          <FieldLabel>Paire tradée par le robot</FieldLabel>
          <div className="flex flex-col gap-2">
            {PAIRS.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => setPair(p.code)}
                className={`text-left rounded-md2 border px-3.5 py-3 ${
                  pair === p.code ? "border-goldbright bg-[rgba(201,154,75,0.1)]" : "border-border bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-[14px] ${pair === p.code ? "text-goldbright" : "text-ink"}`}>
                    {p.label}
                  </span>
                  {pair === p.code && <span className="text-goldbright text-[13px]">✓</span>}
                </div>
                <p className="text-dimmer text-[12px] mt-0.5 m-0">{p.hint}</p>
              </button>
            ))}
          </div>
          <p className="text-dimmer text-[12px] mt-1.5 leading-relaxed">
            Ce choix détermine la stratégie appliquée par le robot. Tu pourras en discuter avec le support si tu
            veux changer de paire plus tard.
          </p>
        </div>
        <div>
          <FieldLabel>Serveur du courtier</FieldLabel>
          <input
            type="text"
            list="mt5-servers"
            value={brokerServer}
            onChange={(e) => setBrokerServer(e.target.value)}
            placeholder="ex : JustMarkets-Demo"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <datalist id="mt5-servers">
            {KNOWN_SERVERS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <p className="text-dimmer text-[12px] mt-1.5 leading-relaxed">
            Recopie le nom exactement comme dans MT5. Une seule lettre différente et la connexion échoue.
          </p>
        </div>
        <div>
          <FieldLabel>Numéro de compte</FieldLabel>
          <input
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div>
          <FieldLabel>Mot de passe MT5</FieldLabel>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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
