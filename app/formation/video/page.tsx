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

  return (
    <div className="min-h-screen max-w-md mx-auto">
      <BackHeader title={course?.title ?? "Leçon"} backHref="/formation" />
      <div className="px-5 pb-10">
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
