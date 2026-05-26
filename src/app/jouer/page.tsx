"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KahootButton } from "@/components/KahootButton";
import { KahootCard } from "@/components/KahootCard";
import { KahootLogo } from "@/components/KahootLogo";
import {
  isFirebaseConfigured,
} from "@/lib/firebase";
import {
  lireSondageParPin,
  rejoindreSondage,
} from "@/lib/sondages";
import {
  getOrCreateParticipantId,
  getParticipantPrenom,
  setParticipantPrenom,
} from "@/lib/utils";

export default function JoinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [prenom, setPrenom] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [etape, setEtape] = useState<"pin" | "prenom">("pin");

  useEffect(() => {
    const p = getParticipantPrenom();
    if (p) setPrenom(p);
  }, []);

  async function handleValidPin(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!isFirebaseConfigured()) {
      setErreur("L'application n'est pas encore configurée.");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setErreur("Le code PIN doit faire 6 chiffres.");
      return;
    }
    setChargement(true);
    try {
      const id = await lireSondageParPin(pin);
      if (!id) {
        setErreur("Ce code PIN ne correspond à aucun sondage en cours.");
        return;
      }
      setEtape("prenom");
    } catch (e) {
      setErreur(
        e instanceof Error ? e.message : "Erreur lors de la vérification du PIN."
      );
    } finally {
      setChargement(false);
    }
  }

  async function handleValidPrenom(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    const p = prenom.trim();
    if (p.length < 1) {
      setErreur("Saisis ton prénom.");
      return;
    }
    if (p.length > 30) {
      setErreur("Prénom trop long (30 caractères max).");
      return;
    }
    setChargement(true);
    try {
      const sondageId = await lireSondageParPin(pin);
      if (!sondageId) {
        setErreur("Le sondage n'est plus actif.");
        setEtape("pin");
        return;
      }
      const participantId = getOrCreateParticipantId();
      setParticipantPrenom(p);
      await rejoindreSondage(sondageId, participantId, p);
      router.push(`/jouer/voter?pin=${pin}`);
    } catch (e) {
      setErreur(
        e instanceof Error ? e.message : "Erreur lors de la connexion au sondage."
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
      <Link href="/" className="hover:opacity-80 animate-[float_3s_ease-in-out_infinite]">
        <KahootLogo size="md" />
      </Link>

      <KahootCard className="w-full max-w-md">
        {etape === "pin" ? (
          <form onSubmit={handleValidPin} className="flex flex-col gap-5">
            <div className="text-center">
              <h1 className="text-3xl font-black uppercase">Code PIN</h1>
              <p className="text-white/80 mt-2">
                Entre le code à 6 chiffres affiché par ton prof.
              </p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="text-center text-5xl md:text-6xl font-black tracking-widest px-4 py-6 rounded-2xl bg-white/15 border-2 border-white/20 placeholder-white/30 text-white focus:border-kahoot-yellow focus:outline-none"
            />
            {erreur ? (
              <p className="text-kahoot-red font-bold text-sm bg-kahoot-red/15 border-2 border-kahoot-red rounded-xl p-3 animate-[shake_0.5s_ease-in-out]">
                {erreur}
              </p>
            ) : null}
            <KahootButton
              color="green"
              size="lg"
              type="submit"
              disabled={chargement || pin.length !== 6}
            >
              {chargement ? "…" : "Valider"}
            </KahootButton>
          </form>
        ) : (
          <form onSubmit={handleValidPrenom} className="flex flex-col gap-5">
            <div className="text-center">
              <h1 className="text-3xl font-black uppercase">Ton prénom</h1>
              <p className="text-white/80 mt-2">
                Apparaîtra à l&apos;écran avec tes réponses.
              </p>
            </div>
            <input
              type="text"
              autoFocus
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Ex : Camille"
              maxLength={30}
              className="text-center text-3xl font-black px-4 py-5 rounded-2xl bg-white/15 border-2 border-white/20 placeholder-white/30 text-white focus:border-kahoot-yellow focus:outline-none"
            />
            {erreur ? (
              <p className="text-kahoot-red font-bold text-sm bg-kahoot-red/15 border-2 border-kahoot-red rounded-xl p-3 animate-[shake_0.5s_ease-in-out]">
                {erreur}
              </p>
            ) : null}
            <KahootButton
              color="green"
              size="lg"
              type="submit"
              disabled={chargement || prenom.trim().length === 0}
            >
              {chargement ? "…" : "C'est parti !"}
            </KahootButton>
            <button
              type="button"
              onClick={() => setEtape("pin")}
              className="text-white/60 hover:text-white text-sm"
            >
              ← Changer de PIN
            </button>
          </form>
        )}
      </KahootCard>

      <Link href="/" className="text-white/60 hover:text-white text-sm">
        ← Accueil
      </Link>
    </main>
  );
}
