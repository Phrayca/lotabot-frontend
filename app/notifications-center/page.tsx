"use client";
import { BackHeader } from "@/components/ui";

const INFO_ITEMS = [
  {
    icon: "🤖",
    title: "Bienvenue sur Lotabot",
    body: "Ton robot XAUUSD est prêt. Connecte ton compte MT5 depuis Profil pour démarrer.",
  },
  {
    icon: "🎁",
    title: "Essai gratuit de 2 jours",
    body: "Profite du robot sans engagement pendant 2 jours avant le premier prélèvement.",
  },
  {
    icon: "🎓",
    title: "Nouveau : espace Formation",
    body: "Des leçons courtes pour comprendre le XAUUSD et bien régler ton niveau de risque.",
  },
];

export default function NotificationsCenterPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto pb-10">
      <BackHeader title="Notifications" backHref="/home" />
      <div className="px-5 flex flex-col gap-3.5">
        {INFO_ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3 bg-surface border border-border rounded-md2 p-4">
            <span className="text-xl flex-none">{item.icon}</span>
            <div>
              <div className="font-semibold text-[14.5px]">{item.title}</div>
              <div className="text-dim text-[13px] mt-0.5 leading-relaxed">{item.body}</div>
            </div>
          </div>
        ))}

        <a
          href="https://wa.me/221000000000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between bg-greenbg border border-[rgba(63,168,115,0.3)] rounded-md2 px-4 py-[15px] mt-2"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <div>
              <div className="font-semibold text-[14.5px] text-green">Besoin d'aide ?</div>
              <div className="text-[12.5px] text-dim">Contacter le support sur WhatsApp</div>
            </div>
          </div>
          <span className="text-green">↗</span>
        </a>
      </div>
    </div>
  );
}
