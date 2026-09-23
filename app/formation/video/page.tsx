"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { BackHeader } from "@/components/ui";
import { useToast } from "@/components/Toast";

type CourseDetail = {
  id: string;
  title: string;
  durationMin: number;
  metaLabel: string;
  premium: boolean;
  body: string;
};

// Illustration dediee a chaque formation, le temps que la vraie video arrive. Choisie une par
// une pour son sujet (pas une icone generique repetee) : robot pour l'accueil, lingot pour
// l'or, balance pour le risque, jauge a 3 crans pour le niveau de risque (le meme principe
// visuel que le curseur de l'ecran Robot), mini-graphique pour l'historique, bouclier pour la
// gestion avancee. Les couleurs reprennent les tokens deja utilises ailleurs dans l'app
// (goldbright, green, red, dim, border) via className, et la transparence passe par les
// attributs SVG natifs (fillOpacity/strokeOpacity) plutot qu'une syntaxe Tailwind non confirmee.
function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
      <rect x="70" y="46" width="60" height="48" rx="12" className="fill-goldbright" fillOpacity={0.15} />
      <rect x="82" y="58" width="36" height="24" rx="6" className="stroke-goldbright" strokeWidth="2.5" />
      <circle cx="93" cy="70" r="3.5" className="fill-goldbright" />
      <circle cx="107" cy="70" r="3.5" className="fill-goldbright" />
      <path d="M100 46V34" className="stroke-goldbright" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="100" cy="30" r="4" className="fill-goldbright" />
      <path d="M70 66h-8M130 66h8" className="stroke-goldbright" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M52 100c6-10 16-16 28-16M148 100c-6-10-16-16-28-16"
        className="stroke-dim"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
    </svg>
  );
}

function GoldIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
      <path
        d="M62 58h76l14 20-14 24H62l-14-24z"
        className="fill-goldbright stroke-goldbright"
        fillOpacity={0.15}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M62 58l14 20-14 24M138 58l-14 20 14 24" className="stroke-goldbright" strokeOpacity={0.6} strokeWidth="1.5" />
      <text
        x="100"
        y="86"
        textAnchor="middle"
        className="fill-goldbright font-bold"
        style={{ fontSize: 22, fontFamily: "'Fraunces', Georgia, serif" }}
      >
        Au
      </text>
      <path d="M40 106c4-3 10-3 14 0M146 106c4-3 10-3 14 0" className="stroke-dim" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RiskBalanceIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
      <path d="M100 38v58" className="stroke-goldbright" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M62 50h76" className="stroke-goldbright" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M62 50L48 78h28z" className="fill-red stroke-red" fillOpacity={0.15} strokeWidth="2" strokeLinejoin="round" />
      <path d="M138 50l14 22h-28z" className="fill-green stroke-green" fillOpacity={0.15} strokeWidth="2" strokeLinejoin="round" />
      <rect x="86" y="96" width="28" height="10" rx="3" className="fill-goldbright stroke-goldbright" fillOpacity={0.2} strokeWidth="2" />
      <circle cx="100" cy="38" r="4" className="fill-goldbright" />
    </svg>
  );
}

function RiskGaugeIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
      <path d="M46 96a54 54 0 0 1 108 0" className="stroke-border" strokeWidth="8" strokeLinecap="round" />
      <path d="M46 96a54 54 0 0 1 34-50" className="stroke-green" strokeWidth="8" strokeLinecap="round" />
      <path d="M80 46a54 54 0 0 1 40 0" className="stroke-goldbright" strokeWidth="8" strokeLinecap="round" />
      <path d="M120 46a54 54 0 0 1 34 50" className="stroke-red" strokeWidth="8" strokeLinecap="round" />
      <line x1="100" y1="96" x2="128" y2="66" className="stroke-goldbright" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="96" r="6" className="fill-goldbright" />
    </svg>
  );
}

function HistoryIllustration() {
  const bars = [
    { h: 22, up: true },
    { h: 34, up: false },
    { h: 44, up: true },
    { h: 18, up: false },
    { h: 38, up: true },
  ];
  return (
    <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
      <line x1="34" y1="104" x2="166" y2="104" className="stroke-border" strokeWidth="2" />
      {bars.map((b, i) => (
        <rect
          key={i}
          x={50 + i * 26}
          y={104 - b.h}
          width="14"
          height={b.h}
          rx="3"
          className={b.up ? "fill-green" : "fill-red"}
          fillOpacity={0.7}
        />
      ))}
      <path
        d="M50 88l26 12 26-24 26 18 26-30"
        className="stroke-goldbright"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function ShieldIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
      <path
        d="M100 34l32 12v26c0 22-14 34-32 40-18-6-32-18-32-40V46z"
        className="fill-goldbright stroke-goldbright"
        fillOpacity={0.12}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M84 72l12 12 22-24" className="stroke-goldbright" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M60 100c8 4 12 10 12 18M140 100c-8 4-12 10-12 18"
        className="stroke-dim"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 6"
      />
    </svg>
  );
}

const ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  "Bienvenue sur Lotabot": WelcomeIllustration,
  "C'est quoi le XAUUSD ?": GoldIllustration,
  "Comprendre le risque, en 5 minutes": RiskBalanceIllustration,
  "Choisir son niveau de risque": RiskGaugeIllustration,
  "Lire ton historique de trades": HistoryIllustration,
  "Gestion du risque avancée": ShieldIllustration,
};

function DefaultIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
      <rect x="66" y="40" width="68" height="60" rx="6" className="fill-goldbright stroke-goldbright" fillOpacity={0.12} strokeWidth="2.5" />
      <path d="M78 56h44M78 68h44M78 80h28" className="stroke-goldbright" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function LessonContent() {
  const params = useSearchParams();
  const toast = useToast();
  const router = useRouter();
  const id = params.get("id") || "";
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api<CourseDetail>(`/courses/${id}`)
      .then(setCourse)
      .catch((err) => {
        toast(err.message);
        router.push("/formation");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const Illustration = (course && ILLUSTRATIONS[course.title]) || DefaultIllustration;

  return (
    <div className="min-h-screen max-w-md mx-auto">
      <BackHeader title={course?.title ?? "Leçon"} backHref="/formation" />
      <div className="px-5 pb-10">
        {!loading && course && (
          <div className="rounded-md2 bg-surface2 border border-border h-[150px] mb-4.5 overflow-hidden">
            <Illustration />
          </div>
        )}

        <div className="flex items-center gap-2 mb-4.5">
          <span className="text-xs font-semibold px-[10px] py-1 rounded-full bg-surface2 text-dim">
            {course?.metaLabel ?? "…"}
          </span>
          <span className="text-xs text-dimmer">{course ? `${course.durationMin} min de lecture` : ""}</span>
        </div>

        {/* Distinguer "en train de charger" (loading) de "chargé, mais rien à afficher"
            (course.body vide) : sinon un contenu manquant reste bloqué sur "Chargement…"
            pour toujours, même une fois la reponse du serveur bien recue. */}
        {loading && <p className="text-dim text-[14.5px]">Chargement…</p>}
        {!loading && course && course.body && (
          <div className="text-ink text-[14.5px] leading-[1.75] whitespace-pre-line">{course.body}</div>
        )}
        {!loading && course && !course.body && (
          <p className="text-dim text-[14.5px]">Le contenu écrit de cette leçon arrive bientôt.</p>
        )}

        <div className="flex items-center gap-2.5 bg-surface2 border border-border rounded-md2 px-4 py-3 mt-7 text-[12.5px] text-dim">
          <span>🎥</span>
          Version vidéo bientôt disponible pour cette leçon.
        </div>
      </div>
    </div>
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={null}>
      <LessonContent />
    </Suspense>
  );
}
