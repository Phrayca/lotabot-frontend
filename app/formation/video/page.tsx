"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

function VideoContent() {
  const params = useSearchParams();
  const toast = useToast();
  const id = params.get("id") || "";
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<CourseDetail>(`/courses/${id}`)
      .then(setCourse)
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const duration = course?.durationMin ?? 0;

  return (
    <div className="min-h-screen max-w-md mx-auto">
      <BackHeader title={course?.title ?? "Cours"} backHref="/formation" />
      <div className="px-5">
        <div className="bg-surface2 rounded-md2 h-[190px] relative flex items-center justify-center mb-3.5">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.06)" />
            <path d="M8 5.5v13l11-6.5z" fill="#c7cdd6" />
          </svg>
          <div className="absolute bottom-2.5 right-2.5 bg-black/55 text-white text-xs px-2 py-1 rounded-md tabular-nums">
            {duration}:00
          </div>
        </div>
        <div className="h-1 bg-surface3 rounded-full relative">
          <div className="absolute h-full bg-gold rounded-full" style={{ width: "0%" }} />
        </div>
        <div className="flex justify-between text-xs text-dim mt-1.5">
          <span>0:00</span>
          <span>{duration}:00</span>
        </div>
        <div className="flex items-center justify-center gap-8 my-4">
          <button className="text-ink">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 5L3 12l5 7M3 12h12a5 5 0 000-10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div
            onClick={() => setPlaying((p) => !p)}
            className="w-[60px] h-[60px] rounded-full bg-gold flex items-center justify-center cursor-pointer text-[#1c1406]"
          >
            {playing ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
                <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
              </svg>
            )}
          </div>
          <button className="text-ink">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M16 5l5 7-5 7M21 12H9a5 5 0 010-10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="rounded-md2 py-[15px] border border-border text-dim font-bold">🎧 Audio seul</button>
          <button className="rounded-md2 py-[15px] bg-[rgba(201,154,75,0.16)] text-goldbright font-bold">▤ Vidéo</button>
        </div>
        <h3 className="heading-font text-[15px] mt-6 mb-2">Ce qu'il faut retenir</h3>
        <p className="text-dim text-[13.5px] leading-relaxed pb-8 whitespace-pre-line">
          {course?.body || "Chargement du contenu…"}
        </p>
      </div>
    </div>
  );
}

export default function VideoPage() {
  return (
    <Suspense fallback={null}>
      <VideoContent />
    </Suspense>
  );
}
