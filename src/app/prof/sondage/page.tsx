"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { KahootButton } from "@/components/KahootButton";
import { KahootCard } from "@/components/KahootCard";
import { KahootLogo } from "@/components/KahootLogo";
import { QuestionEditor } from "@/components/QuestionEditor";
import { LiveResultats } from "@/components/LiveResultats";
import { GroupesPanel } from "@/components/GroupesPanel";
import { useAuth } from "@/lib/auth-context";
import {
  arreterSondage,
  basculeResultats,
  ecouterParticipants,
  ecouterReponses,
  ecouterSondage,
  lancerSondage,
  majQuestions,
  majTitre,
  naviguerQuestion,
  questionVide,
} from "@/lib/sondages";
import type { Participant, Question, Reponse, Sondage } from "@/lib/types";

export default function PageSondage() {
  return (
    <Suspense fallback={<Loader />}>
      <PageSondageInner />
    </Suspense>
  );
}

function Loader() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="text-white/70 text-xl animate-pulse">Chargement…</div>
    </main>
  );
}

function PageSondageInner() {
  const search = useSearchParams();
  const router = useRouter();
  const id = search.get("id");
  const { user, loading, configured } = useAuth();

  const [sondage, setSondage] = useState<Sondage | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [reponses, setReponses] = useState<Reponse[]>([]);
  const [titreEdit, setTitreEdit] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [vue, setVue] = useState<"edition" | "live">("edition");
  const [showGroupes, setShowGroupes] = useState(false);

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/prof/login");
  }, [user, loading, configured, router]);

  useEffect(() => {
    if (!id || !user) return;
    const unsubS = ecouterSondage(id, setSondage);
    const unsubP = ecouterParticipants(id, setParticipants);
    const unsubR = ecouterReponses(id, setReponses);
    return () => {
      unsubS();
      unsubP();
      unsubR();
    };
  }, [id, user]);

  useEffect(() => {
    if (sondage && sondage.title !== titreEdit) {
      setTitreEdit(sondage.title);
    }
    // Bascule auto en live quand on lance
    if (sondage?.isLive) setVue("live");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sondage?.id, sondage?.isLive]);

  const currentQuestion = useMemo(() => {
    if (!sondage) return null;
    const idx = sondage.currentQuestionIndex;
    if (idx < 0 || idx >= sondage.questions.length) return null;
    return sondage.questions[idx];
  }, [sondage]);

  const reponsesQuestion = useMemo(() => {
    if (!sondage) return [];
    return reponses.filter(
      (r) => r.questionIndex === sondage.currentQuestionIndex
    );
  }, [reponses, sondage]);

  if (!id) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <KahootCard>Aucun sondage spécifié.</KahootCard>
      </main>
    );
  }

  if (!configured || loading || !user || !sondage) {
    return <Loader />;
  }

  async function handleSaveTitle() {
    if (!sondage || titreEdit === sondage.title) return;
    setSavingTitle(true);
    try {
      await majTitre(sondage.id, titreEdit);
    } finally {
      setSavingTitle(false);
    }
  }

  async function ajouterQuestion(type: Question["type"]) {
    if (!sondage) return;
    await majQuestions(sondage.id, [...sondage.questions, questionVide(type)]);
  }
  async function modifierQuestion(i: number, q: Question) {
    if (!sondage) return;
    const next = [...sondage.questions];
    next[i] = q;
    await majQuestions(sondage.id, next);
  }
  async function supprimerQuestion(i: number) {
    if (!sondage) return;
    await majQuestions(
      sondage.id,
      sondage.questions.filter((_, j) => j !== i)
    );
  }
  async function deplacer(i: number, dir: -1 | 1) {
    if (!sondage) return;
    const next = [...sondage.questions];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    await majQuestions(sondage.id, next);
  }

  async function handleLancer() {
    if (!sondage) return;
    if (sondage.questions.length === 0) {
      alert("Ajoute au moins une question avant de lancer le sondage.");
      return;
    }
    await lancerSondage(sondage.id);
  }
  async function handleArreter() {
    if (!sondage) return;
    if (!confirm("Arrêter le sondage ? Les apprenants seront déconnectés.")) return;
    await arreterSondage(sondage.id, sondage.pin);
    setVue("edition");
  }

  const peutEditer = !sondage.isLive;

  return (
    <main className="flex-1 px-4 md:px-6 py-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/prof">
          <KahootLogo size="sm" />
        </Link>
        <Link
          href="/prof"
          className="text-white/70 hover:text-white text-sm font-semibold"
        >
          ← Mes sondages
        </Link>
      </header>

      {/* Bandeau titre + actions */}
      <KahootCard className="flex flex-wrap items-center gap-3 justify-between">
        <input
          type="text"
          value={titreEdit}
          onChange={(e) => setTitreEdit(e.target.value)}
          onBlur={handleSaveTitle}
          disabled={!peutEditer || savingTitle}
          className="flex-1 min-w-[260px] text-3xl font-black bg-transparent border-b-2 border-white/20 focus:border-kahoot-yellow focus:outline-none px-2 py-1"
        />
        {sondage.isLive ? (
          <KahootButton color="red" size="lg" onClick={handleArreter}>
            ⏹ Arrêter
          </KahootButton>
        ) : (
          <KahootButton
            color="green"
            size="lg"
            onClick={handleLancer}
            disabled={sondage.questions.length === 0}
          >
            🚀 Lancer le sondage
          </KahootButton>
        )}
      </KahootCard>

      {/* PIN affiché si live */}
      {sondage.isLive && sondage.pin ? (
        <KahootCard className="text-center bg-kahoot-yellow/20 border-kahoot-yellow">
          <p className="text-white/80 font-bold uppercase text-sm tracking-widest">
            Code PIN à projeter
          </p>
          <p className="text-6xl md:text-7xl font-black tracking-widest text-kahoot-yellow my-2 animate-[pop_0.4s_ease-out]">
            {sondage.pin.replace(/(.{3})(.{3})/, "$1 $2")}
          </p>
          <p className="text-white/70">
            Les apprenants rejoignent sur{" "}
            <code className="bg-black/30 px-2 py-0.5 rounded font-bold">
              /jouer
            </code>{" "}
            avec ce code.
          </p>
          <p className="text-white/60 text-sm mt-2">
            {participants.length} participant{participants.length > 1 ? "s" : ""}{" "}
            connecté{participants.length > 1 ? "s" : ""}
          </p>
        </KahootCard>
      ) : null}

      {/* Onglets edition / live */}
      <div className="flex gap-2">
        <KahootButton
          color={vue === "edition" ? "blue" : "purple"}
          active={vue === "edition"}
          size="sm"
          onClick={() => setVue("edition")}
        >
          ✏️ Édition
        </KahootButton>
        {sondage.isLive ? (
          <KahootButton
            color={vue === "live" ? "green" : "purple"}
            active={vue === "live"}
            size="sm"
            onClick={() => setVue("live")}
          >
            📡 Direct
          </KahootButton>
        ) : null}
      </div>

      {/* Vue Édition */}
      {vue === "edition" ? (
        <section className="flex flex-col gap-4">
          {sondage.questions.length === 0 ? (
            <KahootCard className="text-center text-white/70">
              Aucune question pour l&apos;instant. Ajoute-en une ci-dessous !
            </KahootCard>
          ) : (
            sondage.questions.map((q, i) => (
              <QuestionEditor
                key={q.id}
                question={q}
                index={i}
                total={sondage.questions.length}
                onChange={(nq) => modifierQuestion(i, nq)}
                onSupprimer={() => supprimerQuestion(i)}
                onMonter={() => deplacer(i, -1)}
                onDescendre={() => deplacer(i, 1)}
                disabled={!peutEditer}
              />
            ))
          )}

          {peutEditer ? (
            <KahootCard>
              <h3 className="font-black uppercase mb-3">
                ➕ Ajouter une question
              </h3>
              <div className="flex flex-wrap gap-2">
                <KahootButton
                  color="red"
                  size="sm"
                  onClick={() => ajouterQuestion("qcm")}
                >
                  QCM
                </KahootButton>
                <KahootButton
                  color="blue"
                  size="sm"
                  onClick={() => ajouterQuestion("vrai-faux")}
                >
                  Vrai / Faux
                </KahootButton>
                <KahootButton
                  color="yellow"
                  size="sm"
                  onClick={() => ajouterQuestion("nuage-mots")}
                >
                  Nuage de mots
                </KahootButton>
                <KahootButton
                  color="green"
                  size="sm"
                  onClick={() => ajouterQuestion("evaluation")}
                >
                  Évaluation 1 → 5
                </KahootButton>
              </div>
            </KahootCard>
          ) : (
            <KahootCard className="text-center text-white/70 text-sm">
              Sondage en direct : édition désactivée. Arrête-le pour modifier
              les questions.
            </KahootCard>
          )}
        </section>
      ) : null}

      {/* Vue Live */}
      {vue === "live" && sondage.isLive ? (
        <LiveSection
          sondage={sondage}
          currentQuestion={currentQuestion}
          participants={participants}
          reponsesQuestion={reponsesQuestion}
          showGroupes={showGroupes}
          setShowGroupes={setShowGroupes}
        />
      ) : null}
    </main>
  );
}

function LiveSection({
  sondage,
  currentQuestion,
  participants,
  reponsesQuestion,
  showGroupes,
  setShowGroupes,
}: {
  sondage: Sondage;
  currentQuestion: Question | null;
  participants: Participant[];
  reponsesQuestion: Reponse[];
  showGroupes: boolean;
  setShowGroupes: (b: boolean) => void;
}) {
  const idx = sondage.currentQuestionIndex;
  const total = sondage.questions.length;
  const ontRepondu = new Set(reponsesQuestion.map((r) => r.participantId));
  const enAttente = participants.filter((p) => !ontRepondu.has(p.id));

  return (
    <section className="flex flex-col gap-4">
      {/* Navigation des questions */}
      <KahootCard className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <KahootButton
            color="purple"
            size="sm"
            onClick={() => naviguerQuestion(sondage.id, Math.max(0, idx - 1))}
            disabled={idx <= 0}
          >
            ← Précédente
          </KahootButton>
          <span className="font-bold">
            Question{" "}
            <span className="text-kahoot-yellow">{idx + 1}</span> / {total}
          </span>
          <KahootButton
            color="purple"
            size="sm"
            onClick={() =>
              naviguerQuestion(sondage.id, Math.min(total - 1, idx + 1))
            }
            disabled={idx >= total - 1}
          >
            Suivante →
          </KahootButton>
        </div>
        <KahootButton
          color={sondage.showResults ? "yellow" : "blue"}
          size="sm"
          onClick={() => basculeResultats(sondage.id, !sondage.showResults)}
          active={sondage.showResults}
        >
          {sondage.showResults ? "🙈 Cacher" : "👀 Afficher"} aux apprenants
        </KahootButton>
      </KahootCard>

      {currentQuestion ? (
        <KahootCard>
          <p className="text-white/60 uppercase text-xs font-bold tracking-widest">
            Question en cours
          </p>
          <h2 className="text-2xl md:text-3xl font-black mt-1 mb-4">
            {currentQuestion.question || (
              <span className="italic text-white/40">
                (énoncé non rempli)
              </span>
            )}
          </h2>
          <LiveResultats
            question={currentQuestion}
            reponses={reponsesQuestion}
          />
        </KahootCard>
      ) : null}

      {/* Statut participants */}
      <KahootCard>
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <p className="font-black text-xl">
              {reponsesQuestion.length} / {participants.length}
            </p>
            <p className="text-white/60 text-sm">
              ont répondu à cette question
            </p>
          </div>
          {enAttente.length > 0 ? (
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm text-white/70 font-bold mb-1">
                En attente :
              </p>
              <div className="flex flex-wrap gap-1">
                {enAttente.map((p) => (
                  <span
                    key={p.id}
                    className="bg-white/10 px-2 py-1 rounded-full text-xs font-bold"
                  >
                    {p.prenom}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-kahoot-green font-bold">
              ✨ Tout le monde a répondu !
            </p>
          )}
        </div>
      </KahootCard>

      {/* Bouton Groupes */}
      {currentQuestion && reponsesQuestion.length >= 2 ? (
        <KahootCard>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-xl font-black uppercase">
              🧩 Répartition en groupes
            </h3>
            <KahootButton
              color={showGroupes ? "purple" : "magenta"}
              size="sm"
              onClick={() => setShowGroupes(!showGroupes)}
              active={showGroupes}
            >
              {showGroupes ? "Masquer" : "Répartir en groupes"}
            </KahootButton>
          </div>
          {showGroupes ? (
            <div className="mt-4">
              <GroupesPanel
                question={currentQuestion}
                reponses={reponsesQuestion}
              />
            </div>
          ) : null}
        </KahootCard>
      ) : null}
    </section>
  );
}
