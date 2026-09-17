"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useToast } from "@/components/Toast";
import { Button, FieldLabel, Switch } from "@/components/ui";

type Robot = { active: boolean; riskLevel: number; lot: number; maxPositions: number };
const RISK_LABELS = ["Prudent", "Modéré", "Agressif"];

export default function RobotPage() {
  const toast = useToast();
  const [robot, setRobot] = useState<Robot | null>(null);
  const [lot, setLot] = useState("0.02");
  const [maxPositions, setMaxPositions] = useState("5");
  const trackRef = useRef<HTMLDivElement>(null);

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
    setRobot((prev) => (prev ? { ...prev, riskLevel: level } : prev));
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
      <h1 className="heading-font text-lg font-bold pt-4 pb-4">Mon robot - XAUUSD</h1>
      {robot && (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px]">
            <span className="font-semibold">Robot actif</span>
            <Switch on={robot.active} onClick={toggleActive} />
          </div>

          <div>
            <FieldLabel>Niveau de risque</FieldLabel>
            <div ref={trackRef} className="w-full h-1 bg-surface3 rounded-full relative my-[22px]">
              <div
                className="absolute top-0 left-0 h-full bg-gold rounded-full"
                style={{ width: `${(robot.riskLevel / 2) * 100}%` }}
              />
              <div
                className="absolute top-1/2 w-[22px] h-[22px] bg-gold rounded-full border-4 border-bg -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${(robot.riskLevel / 2) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-dim">
              {RISK_LABELS.map((l, i) => (
                <span key={l} onClick={() => setRisk(i)} className="cursor-pointer">
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Lot par position</FieldLabel>
            <input type="number" step="0.01" value={lot} onChange={(e) => setLot(e.target.value)} />
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
