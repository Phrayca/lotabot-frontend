"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

const MAX_SOURCE_BYTES = 15_000_000; // fichier d'origine, avant compression
const MAX_DOC_PDF_BYTES = 4_000_000; // les PDF ne sont pas compressés

// Redimensionne et compresse une image côté navigateur avant envoi, pour que
// même une photo de téléphone de plusieurs Mo passe sans problème.
function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossible de traiter cette image"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Fichier illisible"));
    reader.readAsDataURL(file);
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function InfosPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [p, setP] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [avatarData, setAvatarData] = useState<string | null | undefined>(undefined);
  const [idVerified, setIdVerified] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    api<Profile>("/profile")
      .then((data) => {
        setP(data);
        setFullName(data.fullName);
        setEmail(data.email);
        setDob(data.dob);
        setCity(data.city);
        setAvatarData(data.avatarData);
        setIdVerified(data.idVerified);
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
    if (file.size > MAX_SOURCE_BYTES) {
      toast("Cette photo est trop lourde, choisis-en une plus légère");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await compressImage(file, 500, 0.82);
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

  function pickDocument() {
    docInputRef.current?.click();
  }

  async function onDocumentSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SOURCE_BYTES) {
      toast("Ce fichier est trop lourd, choisis-en un plus léger");
      return;
    }
    setUploadingDoc(true);
    try {
      let dataUrl: string;
      if (file.type.startsWith("image/")) {
        dataUrl = await compressImage(file, 1400, 0.85);
      } else {
        if (file.size > MAX_DOC_PDF_BYTES) {
          toast("Ce PDF est trop lourd, choisis-en un plus léger (4 Mo max)");
          setUploadingDoc(false);
          return;
        }
        dataUrl = await readAsDataUrl(file);
      }
      const data = await api<Profile>("/profile", { method: "PUT", body: { idDocumentData: dataUrl } });
      setIdVerified(data.idVerified);
      toast("Document reçu, profil vérifié");
    } catch (err: any) {
      toast(err.message || "Impossible d'envoyer le document");
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
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

        <Link href="/profil/mot-de-passe" className="block text-goldbright text-[13.5px] font-semibold mt-4">
          Changer mon mot de passe
        </Link>

        <h3 className="heading-font text-[15px] mt-5.5 mb-2.5">Vérification d'identité</h3>
        <p className="text-dim text-[13px] -mt-1.5 mb-3">
          Requise pour activer les retraits et sécuriser ton compte.
        </p>
        <input
          ref={docInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={onDocumentSelected}
        />
        <div
          onClick={idVerified || uploadingDoc ? undefined : pickDocument}
          className={`flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px] ${
            idVerified ? "" : "cursor-pointer"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{idVerified ? "✅" : "📄"}</span>
            <div>
              <div className="text-[14.5px]">Pièce d'identité (CNI/Passeport)</div>
              {!idVerified && (
                <div className="text-[12px] text-dim mt-0.5">
                  {uploadingDoc ? "Envoi en cours…" : "Appuie pour envoyer une photo ou un scan"}
                </div>
              )}
            </div>
          </div>
          <Chip tone={idVerified ? "green" : "gold"}>{idVerified ? "Vérifié" : "En attente"}</Chip>
        </div>
        <Button onClick={save} className="mt-5">
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
