"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, isAdminLoggedIn, setAdminToken } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn()) router.replace("/admin");
  }, [router]);

  async function login() {
    setError("");
    if (!email.trim() || !password) {
      setError("E-mail et mot de passe requis.");
      return;
    }
    setLoading(true);
    try {
      const data = await adminApi<{ token: string }>("/admin/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      setAdminToken(data.token);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0F1722] px-6"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-[10px] bg-[#C99A4B] text-[#1B1305] font-bold text-xl flex items-center justify-center">
            L
          </div>
          <div className="text-white font-semibold text-xl">Lotabot admin</div>
        </div>
        <div className="bg-[#16202E] border border-[#22303F] rounded-2xl p-6 flex flex-col gap-3.5">
          <div>
            <label className="block text-[#8C98AA] text-[12.5px] mb-1.5" htmlFor="admin-email">
              E-mail
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={(e) => e.key === "Enter" && login()}
              className="w-full min-h-[44px] px-3.5 rounded-[10px] bg-[#0F1722] border border-[#22303F] text-white text-[14px] outline-none"
            />
          </div>
          <div>
            <label className="block text-[#8C98AA] text-[12.5px] mb-1.5" htmlFor="admin-password">
              Mot de passe
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              className="w-full min-h-[44px] px-3.5 rounded-[10px] bg-[#0F1722] border border-[#22303F] text-white text-[14px] outline-none"
            />
          </div>
          {error && <p className="text-[#E07A5F] text-[13px] m-0">{error}</p>}
          <button
            onClick={login}
            disabled={loading}
            className="min-h-[44px] rounded-[10px] bg-[#C99A4B] text-[#1B1305] font-bold text-[14px] disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
