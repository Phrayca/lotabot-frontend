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

function LessonContent() {
  const params = useSearchParams();
  const toast = useToast();
  const id = params.get("id") || "";
  const [course, setCourse] = useState<CourseDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    api<CourseDetail>(`/courses/${id}`)
      .then(setCourse)
      .catch((err) => toast(err.message));
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

        <div className="text-ink text-[14.5px] leading-[1.75] whitespace-pre-line">
          {course?.body || "Chargement…"}
        </div>

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
