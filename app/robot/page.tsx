"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useToast } from "@/components/Toast";
import { Button, FieldLabel, Switch } from "@/components/ui";

type Robot = {
  active: boolean;
  riskLevel: number;
  lot: number;
  maxPositions: number;
  plan: string;
  pair: string;
  adminDisabled: boolean;
  adminDisabledReason?: string | null;
};
const RISK_LABELS = ["Prudent", "Modéré", "Agressif"];
const SUGGESTED_LOT = [0.01, 0.02, 0.05];
const PAIR_LABELS: Record<string, string> = {
  XAUUSD: "XAUUSD (Or)",
  EURUSD: "EURUSD (Euro / Dollar)",
  BTCUSD: "BTCUSD (Bitcoin)",
};

export default function RobotPage() {
  const toast = useToast();
  const router = useRouter();
  const [robot, setRobot] = useState<Robot | null>(null);
  const [lot, setLot] = useState("0.02");
  const [maxPositions, setMaxPositions] = useState("5");
  const [lotEditedManually, setLotEditedManually] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const isPremium = robot?.plan === "premium";

  useEffect(() => {
    api<Robot>("/robot")
      .then((r) => {
        setRobot(r);
        setLot(String(r.lot));
        setMaxPositions(String(r.maxPositions));
      })
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleActive() {
    if (!robot) return;
    try {
      const r = await api<Robot>("/robot/toggle", { method: "PUT" });
      setRobot(r);
    } catch (err: any) {
      toast(err.message);
    }
  }

  function setRisk(level: number) {
    if (!isPremium) {
      toast("Niveau de risque personnalisé réservé à Premium");
      return;
    }
    setRobot((prev) => (prev ? { ...prev, riskLevel: level } : prev));
    if (!lotEditedManually) {
      setLot(String(SUGGESTED_LOT[level]));
    }
  }

  function resetLotToDefault() {
    if (!robot) return;
    setLot(String(SUGGESTED_LOT[robot.riskLevel]));
    setLotEditedManually(false);
    toast("Lot remis au réglage recommandé");
  }

  async function save() {
    if (!robot) return;
    try {
      const r = await api<Robot>("/robot", {
        method: "PUT",
        body: {
          active: robot.active,
          riskLevel: robot.riskLevel,
          lot: parseFloat(lot),
          maxPositions: parseInt(maxPositions, 10),
        },
      });
      setRobot(r);
      toast("Réglages enregistrés");
    } catch (err: any) {
      toast(err.message);
    }
  }

  return (
    <AppShell>
      <h1 className="heading-font text-lg font-bold pt-4 pb-1">
        Mon robot{robot ? ` - ${PAIR_LABELS[robot.pair] ?? robot.pair}` : ""}
      </h1>
      <p className="text-dim text-[12.5px] -mt-0.5 pb-3">
        La paire est choisie une fois, à la connexion de ton compte MT5.
      </p>
      {robot && (
        <div className="flex flex-col gap-3.5">
          {robot.adminDisabled && (
            <div className="flex items-start gap-2.5 bg-redbg border border-[rgba(192,86,59,0.35)] rounded-md2 px-4 py-3">
              <span className="text-lg flex-none">⛔</span>
              <div>
                <div className="text-[13.5px] font-semibold text-red">
                  L'équipe Lotabot a désactivé le robot sur ton compte
                </div>
                <div className="text-[12px] text-dim leading-relaxed mt-0.5">
                  {robot.adminDisabledReason || "Contacte le support pour en savoir plus."}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px]">
            <span className="font-semibold">Robot actif</span>
            <Switch on={robot.active} onClick={toggleActive} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-[7px]">
              <FieldLabel>Niveau de risque</FieldLabel>
              {!isPremium && (
                <button onClick={() => router.push("/profil/abonnement")} className="text-goldbright text-[12px] font-semibold">
                  🔒 Passer Premium
                </button>
              )}
            </div>
            <div
              ref={trackRef}
              className={`w-full h-1 bg-surface3 rounded-full relative my-[22px] ${!isPremium ? "opacity-50" : ""}`}
            >
              <div
                className="absolute top-0 left-0 h-full bg-gold rounded-full"
                style={{ width: `${(robot.riskLevel / 2) * 100}%` }}
              />
              <div
                className="absolute top-1/2 w-[22px] h-[22px] bg-gold rounded-full border-4 border-bg -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${(robot.riskLevel / 2) * 100}%` }}
              />
            </div>
            <div className={`flex justify-between text-xs text-dim ${!isPremium ? "opacity-50" : ""}`}>
              {RISK_LABELS.map((l, i) => (
                <span key={l} onClick={() => setRisk(i)} className={isPremium ? "cursor-pointer" : "cursor-not-allowed"}>
                  {l}
                </span>
              ))}
            </div>
            {!isPremium && (
              <p className="text-dimmer text-[12px] mt-2">
                Ton robot utilise le niveau Modéré par défaut. Passe à Premium pour l'ajuster toi-même.
              </p>
            )}
          </div>

          <div className="bg-[rgba(201,154,75,0.1)] border border-[rgba(201,154,75,0.25)] rounded-md2 px-4 py-3 text-[12.5px] text-goldbright leading-relaxed">
            ⚠️ Le lot est déjà réglé automatiquement selon ton niveau de risque. Nous te recommandons de le
            laisser tel quel — ne le modifie que si tu veux prendre le risque toi-même, en connaissance de
            cause.
          </div>

          <div>
            <div className="flex items-center justify-between mb-[7px]">
              <FieldLabel>Lot par position</FieldLabel>
              {lotEditedManually && (
                <button onClick={resetLotToDefault} className="text-goldbright text-[12px] font-semibold">
                  Revenir au réglage recommandé
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              value={lot}
              onChange={(e) => {
                setLot(e.target.value);
                setLotEditedManually(true);
              }}
            />
          </div>
          <div>
            <FieldLabel>Positions simultanées max</FieldLabel>
            <input type="number" value={maxPositions} onChange={(e) => setMaxPositions(e.target.value)} />
          </div>
          <Button onClick={save}>Enregistrer</Button>
        </div>
      )}
    </AppShell>
  );
}
