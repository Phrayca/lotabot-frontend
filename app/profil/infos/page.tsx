"use client";
import { useEffect, useState } from "react";
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
  selfieVerified: boolean;
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function InfosPage() {
  const toast = useToast();
  const [p, setP] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    api<Profile>("/profile")
      .then((data) => {
        setP(data);
        setFullName(data.fullName);
        setEmail(data.email);
        setDob(data.dob);
        setCity(data.city);
      })
      .catch((err) => toast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div className="w-16 h-16 rounded-full bg-[rgba(201,154,75,0.2)] text-goldbright flex items-center justify-center font-bold text-xl">
            {p ? initials(p.fullName) : "…"}
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast("Fonction photo à venir");
            }}
            className="text-goldbright font-semibold text-sm no-underline"
          >
            Changer la photo
          </a>
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
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px]">
            <span>Pièce d'identité (CNI/Passeport)</span>
            <Chip tone={p?.idVerified ? "green" : "gold"}>{p?.idVerified ? "Vérifié" : "En attente"}</Chip>
          </div>
          <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px]">
            <span>Selfie de vérification</span>
            <Chip tone={p?.selfieVerified ? "green" : "gold"}>{p?.selfieVerified ? "Vérifié" : "En attente"}</Chip>
          </div>
        </div>
        <Button onClick={save} className="mt-5">
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
