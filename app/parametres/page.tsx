"use client";
import { BackHeader } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";

const THEME_OPTIONS: { value: "auto" | "light" | "dark"; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
];

export default function ParametresPage() {
  const { mode, setMode } = useTheme();

  return (
    <div className="min-h-screen max-w-md mx-auto pb-10">
      <BackHeader title="Paramètres" backHref="/profil" />
      <div className="px-5">
        <h2 className="text-[13px] font-semibold text-dim mt-2 mb-2">Apparence</h2>
        <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-3">
          <span className="text-[14.5px]">Thème</span>
          <div className="flex bg-surface2 border border-border rounded-[10px] p-[3px]">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold ${
                  mode === opt.value ? "bg-goldbright text-bg" : "text-dim"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-dimmer text-[12px] mt-1.5 leading-relaxed">
          « Auto » suit le réglage de ton téléphone, et bascule automatiquement si tu le changes.
        </p>
      </div>
    </div>
  );
}
