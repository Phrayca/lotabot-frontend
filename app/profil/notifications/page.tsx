"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BackHeader, Switch } from "@/components/ui";
import { useToast } from "@/components/Toast";

type Notifs = { tradeAlerts: boolean; weeklyReport: boolean; promos: boolean };

export default function NotificationsPage() {
  const toast = useToast();
  const [n, setN] = useState<Notifs | null>(null);

  useEffect(() => {
    api<Notifs>("/profile/notifications")
      .then(setN)
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(key: keyof Notifs) {
    if (!n) return;
    const updated = { ...n, [key]: !n[key] };
    setN(updated);
    try {
      await api("/profile/notifications", { method: "PUT", body: updated });
    } catch (err: any) {
      toast(err.message);
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto pb-10">
      <BackHeader title="Notifications" backHref="/profil" />
      <div className="px-5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px]">
          <span>Alertes de trades</span>
          <Switch on={!!n?.tradeAlerts} onClick={() => toggle("tradeAlerts")} />
        </div>
        <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px]">
          <span>Rapport hebdo WhatsApp</span>
          <Switch on={!!n?.weeklyReport} onClick={() => toggle("weeklyReport")} />
        </div>
        <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px]">
          <span>Offres et promotions</span>
          <Switch on={!!n?.promos} onClick={() => toggle("promos")} />
        </div>
      </div>
    </div>
  );
}
