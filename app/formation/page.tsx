"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useToast } from "@/components/Toast";

type Course = { id: string; title: string; durationMin: number; metaLabel: string; premium: boolean };
type Profile = { plan: string };

export default function FormationPage() {
  const toast = useToast();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [plan, setPlan] = useState<string>("classique");

  useEffect(() => {
    api<{ courses: Course[] }>("/courses")
      .then((d) => setCourses(d.courses))
      .catch((err) => toast(err.message));
    api<Profile>("/profile")
      .then((p) => setPlan(p.plan))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCourse(c: Course) {
    if (c.premium && plan !== "premium") {
      toast("Réservé aux abonnés Premium");
      router.push("/profil/abonnement");
      return;
    }
    router.push(`/formation/video?id=${c.id}`);
  }

  return (
    <AppShell>
      <h1 className="heading-font text-lg font-bold pt-4 pb-1">Formation</h1>
      <p className="text-dim text-[13px] -mt-1 mb-4">Pour bien démarrer, du plus simple au plus avancé</p>
      <div className="flex flex-col gap-3.5">
        {courses === null && <p className="text-dim text-[13.5px]">Chargement…</p>}
        {courses?.map((c) => {
          const locked = c.premium && plan !== "premium";
          return (
            <div
              key={c.id}
              onClick={() => openCourse(c)}
              className={`flex items-center gap-3.5 bg-surface border border-border rounded-md2 p-3.5 cursor-pointer ${
                locked ? "opacity-70" : ""
              }`}
            >
              <div
                className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-none ${
                  c.premium ? "bg-[rgba(201,154,75,0.18)] text-goldbright" : "bg-surface3"
                }`}
              >
                {locked ? "🔒" : c.premium ? "📘" : "📄"}
              </div>
              <div>
                <div className="font-semibold text-[14.5px]">{c.title}</div>
                <div className="text-[12.5px] text-dim mt-0.5">
                  {c.durationMin} min - {c.metaLabel}
                  {locked && " · Premium"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
