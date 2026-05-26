"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KahootButton } from "@/components/KahootButton";
import { KahootCard } from "@/components/KahootCard";
import { KahootLogo } from "@/components/KahootLogo";
import { useAuth } from "@/lib/auth-context";
import {
  creerSondage,
  dupliquerSondage,
  listerSondagesProf,
  reinitialiserSondage,
  supprimerSondage,
} from "@/lib/sondages";
import type { Sondage } from "@/lib/types";

export default function ProfHomePage() {
  const router = useRouter();
  const { user, loading, configured } = useAuth();
  const [sondages, setSondages] = useState<Sondage[] | null>(null);
  const [nouveauTitre, setNouveauTitre] = useState("");
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/prof/login");
  }, [user, loading, configured, router]);

  useEffect(() => {
    if (!user) return;
    listerSondagesProf(user.uid).then(setSondages);
  }, [user]);

  async function handleCreer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !nouveauTitre.trim()) return;
    setChargement(true);
    try {
      const id = await creerSondage(
        user.email ?? "",
        user.uid,
        nouveauTitre.trim()
      );
      router.push(`/prof/sondage?id=${id}`);
    } finally {
      setChargement(false);
    }
  }

  async function handleSupprimer(id: string) {
    if (!confirm("Supprimer définitivement ce sondage ?")) return;
    await supprimerSondage(id);
    if (user) listerSondagesProf(user.uid).then(setSondages);
  }

  async function handleDupliquer(s: Sondage) {
    if (!user) return;
    const id = await dupliquerSondage(s, user.email ?? "", user.uid);
    router.push(`/prof/sondage?id=${id}`);
  }

  async function handleReinitialiser(s: Sondage) {
    if (
      !confirm(
        `Réinitialiser « ${s.title} » ? Cela efface tous les participants et leurs réponses. Les questions sont conservées.`
      )
    )
      return;
    await reinitialiserSondage(s.id, s.pin);
    if (user) listerSondagesProf(user.uid).then(setSondages);
  }

  if (!configured) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <KahootCard className="max-w-md text-center">
          <p className="font-bold text-kahoot-yellow">
            Firebase n&apos;est pas encore configuré.
          </p>
          <p className="text-white/80 mt-2 text-sm">
            Ajoute un fichier <code>.env.local</code> avec les clés Firebase.
          </p>
        </KahootCard>
      </main>
    );
  }

  if (loading || !user) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-white/70 text-xl animate-pulse">Chargement…</div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <Link href="/">
          <KahootLogo size="md" />
        </Link>
        <ProfBadge />
      </header>

      <KahootCard>
        <h1 className="text-3xl font-black uppercase mb-4">
          ➕ Nouveau sondage
        </h1>
        <form onSubmit={handleCreer} className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Titre du sondage (ex : préférences pédagogiques)"
            value={nouveauTitre}
            onChange={(e) => setNouveauTitre(e.target.value)}
            className="flex-1 min-w-[260px] px-5 py-4 rounded-2xl bg-white/15 border-2 border-white/20 placeholder-white/50 text-white text-lg font-semibold focus:border-kahoot-yellow focus:outline-none"
          />
          <KahootButton
            color="green"
            size="lg"
            type="submit"
            disabled={chargement || !nouveauTitre.trim()}
          >
            Créer
          </KahootButton>
        </form>
      </KahootCard>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-black uppercase">📋 Mes sondages</h2>

        {sondages === null ? (
          <p className="text-white/70 animate-pulse">Chargement…</p>
        ) : sondages.length === 0 ? (
          <KahootCard className="text-center text-white/70">
            Aucun sondage pour l&apos;instant. Crée-en un juste au-dessus !
          </KahootCard>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {sondages.map((s) => (
              <li key={s.id}>
                <div className="kahoot-card p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-extrabold flex-1">{s.title}</h3>
                    {s.isLive ? (
                      <span className="px-3 py-1 rounded-full bg-kahoot-green text-xs font-black uppercase animate-pulse">
                        ● Live
                      </span>
                    ) : null}
                  </div>
                  <p className="text-white/60 text-sm">
                    {s.questions.length} question
                    {s.questions.length > 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <Link
                      href={`/prof/sondage?id=${s.id}`}
                      className="flex-1 min-w-[100px]"
                    >
                      <KahootButton color="blue" size="sm" className="w-full">
                        Ouvrir
                      </KahootButton>
                    </Link>
                    <KahootButton
                      color="yellow"
                      size="sm"
                      onClick={() => handleDupliquer(s)}
                      aria-label="Dupliquer"
                      title="Dupliquer ce sondage"
                    >
                      📋
                    </KahootButton>
                    <KahootButton
                      color="purple"
                      size="sm"
                      onClick={() => handleReinitialiser(s)}
                      aria-label="Réinitialiser"
                      title="Effacer participants et réponses"
                    >
                      🔄
                    </KahootButton>
                    <KahootButton
                      color="red"
                      size="sm"
                      onClick={() => handleSupprimer(s.id)}
                      aria-label="Supprimer"
                      title="Supprimer définitivement"
                    >
                      🗑
                    </KahootButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function ProfBadge() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full border border-white/20">
      <span className="text-sm font-semibold">{user.email}</span>
      <button
        onClick={() => signOut()}
        className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full font-bold uppercase"
      >
        Déconnexion
      </button>
    </div>
  );
}
