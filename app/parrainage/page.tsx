"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BackHeader, Button } from "@/components/ui";
import { useToast } from "@/components/Toast";

type Referral = { code: string; referredCount: number; monthsEarned: number };

export default function ParrainagePage() {
  const toast = useToast();
  const [r, setR] = useState<Referral | null>(null);

  useEffect(() => {
    api<Referral>("/referral")
      .then(setR)
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyCode() {
    if (r && navigator.clipboard) {
      navigator.clipboard.writeText(r.code).catch(() => {});
    }
    toast("Code copié");
  }

  function shareCode() {
    toast("Lien de parrainage copié");
  }

  return (
    <div className="min-h-screen max-w-md mx-auto pb-10">
      <BackHeader title="Parrainage" backHref="/home" />
      <div className="px-5">
        <div className="flex flex-col items-center text-center bg-gradient-to-br from-[rgba(201,154,75,0.16)] to-[rgba(201,154,75,0.05)] border border-[rgba(201,154,75,0.3)] rounded-lg2 p-5">
          <div className="text-3xl">🎁</div>
          <div className="heading-font font-bold text-base mt-2.5">1 mois offert par filleul</div>
          <div className="text-dim text-[13px] mt-1">Dès son premier paiement validé</div>
        </div>

        <div className="mt-4.5">
          <label className="block text-[12.5px] text-dim mb-[7px]">Ton code de parrainage</label>
          <div className="flex items-center justify-between bg-surface2 border border-border rounded-md2 px-4 py-[15px] text-[19px] font-bold tracking-wider">
            <span>{r?.code ?? "…"}</span>
            <button onClick={copyCode} className="text-dim">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
        </div>

        <Button className="mt-3.5" onClick={shareCode}>
          Partager mon code
        </Button>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="text-center">
            <div className="text-[22px] font-bold">{r?.referredCount ?? "—"}</div>
            <div className="text-dim text-[13px]">Filleuls</div>
          </div>
          <div className="text-center">
            <div className="text-[22px] font-bold">{r?.monthsEarned ?? "—"}</div>
            <div className="text-dim text-[13px]">Mois offerts</div>
          </div>
        </div>
      </div>
    </div>
  );
}
