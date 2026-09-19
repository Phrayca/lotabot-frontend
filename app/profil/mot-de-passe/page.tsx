"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { BackHeader, Button, FieldLabel } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function ChangePasswordPage() {
  const toast = useToast();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (newPassword.length < 4) {
      setError("Le nouveau mot de passe doit faire au moins 4 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
      toast("Mot de passe changé");
      router.push("/profil/infos");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto pb-10">
      <BackHeader title="Changer mon mot de passe" backHref="/profil/infos" />
      <div className="px-5 flex flex-col gap-3.5">
        <div>
          <FieldLabel>Mot de passe actuel</FieldLabel>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Nouveau mot de passe</FieldLabel>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Confirmer le nouveau mot de passe</FieldLabel>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        {error && <p className="text-red text-[13px]">{error}</p>}
        <Button onClick={submit} disabled={loading}>
          {loading ? "Enregistrement…" : "Changer le mot de passe"}
        </Button>
      </div>
    </div>
  );
}
