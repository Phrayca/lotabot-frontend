"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Bot, GraduationCap, User } from "lucide-react";

const TABS = [
  { key: "home", label: "Accueil", href: "/home", Icon: Home },
  { key: "historique", label: "Historique", href: "/historique", Icon: History },
  { key: "robot", label: "Robot", href: "/robot", Icon: Bot },
  { key: "formation", label: "Formation", href: "/formation", Icon: GraduationCap },
  { key: "profil", label: "Profil", href: "/profil", Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="flex justify-around items-center px-2 pt-2.5 pb-4 border-t border-border bg-bg fixed bottom-0 left-0 right-0 max-w-md mx-auto">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`flex flex-col items-center gap-1 text-[10.5px] w-14 ${
              active ? "text-goldbright" : "text-dimmer"
            }`}
          >
            <t.Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
