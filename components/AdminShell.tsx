"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminApi, clearAdminToken, isAdminLoggedIn } from "@/lib/adminApi";

const NAV = [
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/support", label: "Support" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [supportUnread, setSupportUnread] = useState(0);

  useEffect(() => {
    if (!isAdminLoggedIn()) return;
    function load() {
      adminApi<{ count: number }>("/admin/support/unread-count")
        .then((r) => setSupportUnread(r.count))
        .catch(() => {});
    }
    load();
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, []);

  function logout() {
    clearAdminToken();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-[#F3EFE7] text-[#1B1F27]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <nav className="w-60 flex-none bg-[#0F1722] text-[#C9D1DD] flex flex-col gap-1 p-4">
        <div className="flex items-center gap-3 px-3 pb-6">
          <div className="w-9 h-9 rounded-[10px] bg-[#C99A4B] text-[#1B1305] font-bold text-lg flex items-center justify-center">
            L
          </div>
          <div>
            <div className="text-white font-semibold text-[17px]">Lotabot</div>
            <div className="text-[10.5px] uppercase tracking-wide text-[#8C98AA]">Espace admin</div>
          </div>
        </div>
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 min-h-[44px] rounded-[10px] font-medium ${
                active ? "bg-[#1C2839] text-white font-semibold" : "text-[#C9D1DD]"
              }`}
            >
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/support" && supportUnread > 0 && (
                <span className="min-w-[19px] h-[19px] px-1 rounded-full bg-[#C99A4B] text-[#1B1305] text-[11px] font-bold flex items-center justify-center">
                  {supportUnread}
                </span>
              )}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="mt-auto text-left px-3 min-h-[44px] rounded-[10px] text-[#C9D1DD] font-medium"
        >
          Se déconnecter
        </button>
      </nav>
      <main className="flex-1 min-w-0 p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
