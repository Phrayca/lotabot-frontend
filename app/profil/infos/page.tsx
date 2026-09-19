"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { BackHeader, Button, Chip, FieldLabel } from "@/components/ui";
import { useToast } from "@/components/Toast";

type Profile = {
  fullName: string;
  phone: string;
  email: string;
  dob: string;
  city: string;
  idVerified: boolean;
  avatarData?: string | null;
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

const MAX_AVATAR_BYTES = 900_000; // marge sous la limite raisonnable pour stocker en base

export default function InfosPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [p, setP] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [avatarData, setAvatarData] = useState<string | null | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api<Profile>("/profile")
      .then((data) => {
        setP(data);
        setFullName(data.fullName);
        setEmail(data.email);
        setDob(data.dob);
        setCity(data.city);
        setAvatarData(data.avatarData);
      })
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickPhoto() {
    fileInputRef.current?.click();
  }

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      toast("Cette photo est trop lourde, choisis-en une plus légère");
      return;
    }
    setUploading(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const data = await api<Profile>("/profile", { method: "PUT", body: { avatarData: dataUrl } });
      setAvatarData(data.avatarData);
      toast("Photo mise à jour");
    } catch (err: any) {
      toast(err.message || "Impossible de mettre à jour la photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    try {
      const data = await api<Profile>("/profile", { method: "PUT", body: { fullName, email, dob, city } });
      setP(data);
      toast("Informations enregistrées");
    } catch (err: any) {
      toast(err.message);
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto pb-10">
      <BackHeader title="Informations personnelles" backHref="/profil" />
      <div className="px-5">
        <div className="flex items-center gap-3 mb-4.5">
          <div className="w-16 h-16 rounded-full bg-[rgba(201,154,75,0.2)] text-goldbright flex items-center justify-center font-bold text-xl overflow-hidden flex-none">
            {avatarData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarData} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : p ? (
              initials(p.fullName)
            ) : (
              "…"
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhotoSelected}
          />
          <button
            onClick={pickPhoto}
            disabled={uploading}
            className="text-goldbright font-semibold text-sm disabled:opacity-50"
          >
            {uploading ? "Envoi…" : "Changer la photo"}
          </button>
        </div>
        <div className="flex flex-col gap-3.5">
          <div>
            <FieldLabel>Nom complet</FieldLabel>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Numéro de téléphone</FieldLabel>
            <input type="tel" value={p?.phone ?? ""} disabled />
          </div>
          <div>
            <FieldLabel>Adresse e-mail</FieldLabel>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Date de naissance</FieldLabel>
            <input type="text" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="jj/mm/aaaa" />
          </div>
          <div>
            <FieldLabel>Ville de résidence</FieldLabel>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <h3 className="heading-font text-[15px] mt-5.5 mb-2.5">Vérification d'identité</h3>
        <p className="text-dim text-[13px] -mt-1.5 mb-3">
          Requise pour activer les retraits et sécuriser ton compte.
        </p>
        <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px]">
          <span>Pièce d'identité (CNI/Passeport)</span>
          <Chip tone={p?.idVerified ? "green" : "gold"}>{p?.idVerified ? "Vérifié" : "En attente"}</Chip>
        </div>
        <Button onClick={save} className="mt-5">
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
