"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { KahootButton } from "@/components/KahootButton";
import { KahootCard } from "@/components/KahootCard";
import { KahootLogo } from "@/components/KahootLogo";
import { LiveResultats } from "@/components/LiveResultats";
import { KahootShape } from "@/components/Shapes";
import {
  ecouterReponses,
  ecouterSondage,
  envoyerReponse,
  lireSondageParPin,
} from "@/lib/sondages";
import type {
  Question,
  Reponse,
  Sondage,
} from "@/lib/types";
import {
  KAHOOT_COLOR_CLASSES,
  KAHOOT_COLORS,
  classNames,
  getOrCreateParticipantId,
  getParticipantPrenom,
  normaliserMot,
} from "@/lib/utils";

export default function VoterPage() {
  return (
    <Suspense fallback={<Loader />}>
      <VoterInner />
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

function VoterInner() {
  const router = useRouter();
  const search = useSearchParams();
  const pin = search.get("pin") ?? "";
  const [sondageId, setSondageId] = useState<string | null>(null);
  const [sondage, setSondage] = useState<Sondage | null>(null);
  const [reponses, setReponses] = useState<Reponse[]>([]);
  const [prenom, setPrenom] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string>("");

  useEffect(() => {
    setPrenom(getParticipantPrenom());
    setParticipantId(getOrCreateParticipantId());
  }, []);

  useEffect(() => {
    if (!pin) {
      router.replace("/jouer");
      return;
    }
    if (!prenom) return;
    lireSondageParPin(pin).then((id) => {
      if (!id) {
        router.replace("/jouer");
        return;
      }
      setSondageId(id);
    });
  }, [pin, prenom, router]);

  useEffect(() => {
    if (!sondageId) return;
    let stopped = false;
    let unsubS = () => {};
    let unsubR = () => {};

    // Dès que le sondage n'est plus live (ou doc supprimé), on désabonne
    // immédiatement pour éviter des "permission-denied" sur les listeners
    // (les rules Firestore exigent isLive == true côté apprenant).
    function teardown() {
      if (stopped) return;
      stopped = true;
      unsubS();
      unsubR();
    }

    unsubS = ecouterSondage(sondageId, (s) => {
      if (stopped) return;
      setSondage(s);
      if (!s || !s.isLive) teardown();
    });
    unsubR = ecouterReponses(sondageId, (r) => {
      if (stopped) return;
      setReponses(r);
    });

    return teardown;
  }, [sondageId]);

  // Si le prof arrête le sondage, on retourne à l'accueil
  useEffect(() => {
    if (sondage && !sondage.isLive) {
      const t = setTimeout(() => router.replace("/jouer"), 1500);
      return () => clearTimeout(t);
    }
  }, [sondage, router]);

  const currentQuestion = useMemo(() => {
    if (!sondage) return null;
    // Tant que le prof n'a pas explicitement lancé la question, l'apprenant attend
    if (!sondage.questionVisible) return null;
    const idx = sondage.currentQuestionIndex;
    if (idx < 0 || idx >= sondage.questions.length) return null;
    return sondage.questions[idx];
  }, [sondage]);

  const maReponse = useMemo(() => {
    if (!sondage || !participantId) return null;
    return reponses.find(
      (r) =>
        r.participantId === participantId &&
        r.questionIndex === sondage.currentQuestionIndex
    );
  }, [reponses, sondage, participantId]);

  const reponsesQuestion = useMemo(() => {
    if (!sondage) return [];
    return reponses.filter(
      (r) => r.questionIndex === sondage.currentQuestionIndex
    );
  }, [reponses, sondage]);

  async function envoyer(valeur: Reponse["valeur"]) {
    if (!sondage || !currentQuestion || !prenom || !participantId) return;
    await envoyerReponse(
      sondage.id,
      participantId,
      prenom,
      sondage.currentQuestionIndex,
      valeur
    );
  }

  if (!prenom) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <KahootCard className="max-w-md text-center">
          <p className="font-bold">
            On n&apos;a pas ton prénom — reviens à l&apos;écran d&apos;accueil.
          </p>
          <Link href="/jouer">
            <KahootButton color="blue" size="lg" className="mt-4">
              ← Saisir mon prénom
            </KahootButton>
          </Link>
        </KahootCard>
      </main>
    );
  }

  if (!sondage) return <Loader />;

  if (!sondage.isLive) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <KahootCard className="max-w-md text-center">
          <h1 className="text-2xl font-black uppercase">🏁 Sondage terminé</h1>
          <p className="text-white/80 mt-2">Merci pour ta participation !</p>
        </KahootCard>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 md:px-6 py-6 max-w-3xl mx-auto w-full flex flex-col gap-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <KahootLogo size="sm" />
        <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm font-bold">
          👤 {prenom}
        </div>
      </header>

      {currentQuestion ? (
        <>
          <KahootCard>
            <p className="text-white/60 uppercase text-xs font-bold tracking-widest">
              Question {sondage.currentQuestionIndex + 1} / {sondage.questions.length}
            </p>
            <h2 className="text-2xl md:text-3xl font-black mt-1">
              {currentQuestion.question || (
                <span className="italic text-white/40">(en attente…)</span>
              )}
            </h2>
          </KahootCard>

          {maReponse && !sondage.showResults ? (
            <KahootCard className="text-center">
              <div className="text-5xl mb-2 animate-[bounce-in_0.5s]">✅</div>
              <p className="font-black text-xl uppercase">Réponse envoyée !</p>
              <p className="text-white/70 mt-1">
                Attends que ton prof passe à la suite.
              </p>
            </KahootCard>
          ) : (
            <QuestionVote
              question={currentQuestion}
              maReponse={maReponse?.valeur ?? null}
              onValider={envoyer}
              showResults={sondage.showResults}
            />
          )}

          {sondage.showResults ? (
            <KahootCard>
              <p className="text-white/60 uppercase text-xs font-bold tracking-widest mb-2">
                Résultats
              </p>
              <LiveResultats
                question={currentQuestion}
                reponses={reponsesQuestion}
              />
            </KahootCard>
          ) : null}
        </>
      ) : (
        <KahootCard className="text-center">
          <div className="text-5xl animate-[float_3s_ease-in-out_infinite]">⏳</div>
          <p className="font-black text-xl uppercase mt-2">
            En attente du prof…
          </p>
        </KahootCard>
      )}
    </main>
  );
}

// === Composant de saisie selon le type de question ===

function QuestionVote({
  question,
  maReponse,
  onValider,
  showResults,
}: {
  question: Question;
  maReponse: Reponse["valeur"] | null;
  onValider: (valeur: Reponse["valeur"]) => void | Promise<void>;
  showResults: boolean;
}) {
  if (question.type === "qcm")
    return (
      <QCMVote
        q={question}
        maReponse={maReponse}
        onValider={onValider}
        disabled={showResults}
      />
    );
  if (question.type === "vrai-faux")
    return (
      <VraiFauxVote
        maReponse={maReponse}
        onValider={onValider}
        disabled={showResults}
      />
    );
  if (question.type === "nuage-mots")
    return (
      <NuageVote
        q={question}
        maReponse={maReponse}
        onValider={onValider}
        disabled={showResults}
      />
    );
  return (
    <EvaluationVote
      q={question}
      maReponse={maReponse}
      onValider={onValider}
      disabled={showResults}
    />
  );
}

function QCMVote({
  q,
  maReponse,
  onValider,
  disabled,
}: {
  q: Extract<Question, { type: "qcm" }>;
  maReponse: Reponse["valeur"] | null;
  onValider: (v: Reponse["valeur"]) => void | Promise<void>;
  disabled?: boolean;
}) {
  const multi = !!q.multiAllowed;
  const [selection, setSelection] = useState<number[]>(() => {
    if (Array.isArray(maReponse)) return maReponse as number[];
    if (typeof maReponse === "number") return [maReponse as number];
    return [];
  });

  function toggle(i: number) {
    if (multi) {
      setSelection((s) =>
        s.includes(i) ? s.filter((x) => x !== i) : [...s, i]
      );
    } else {
      onValider(i);
      setSelection([i]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        {q.options.map((opt, i) => {
          const color = KAHOOT_COLORS[i % 4];
          const palette = KAHOOT_COLOR_CLASSES[color];
          const isSel = selection.includes(i);
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              disabled={disabled}
              className={classNames(
                "rounded-2xl p-5 text-left flex items-center gap-3 font-black text-lg transition-transform active:translate-y-1",
                palette.bg,
                palette.shadow,
                isSel ? "ring-4 ring-white scale-[1.02]" : "",
                "disabled:opacity-60"
              )}
            >
              <KahootShape index={i} className="w-7 h-7 shrink-0" />
              <span>{opt || `Choix ${i + 1}`}</span>
            </button>
          );
        })}
      </div>

      {multi ? (
        <KahootButton
          color="white"
          size="lg"
          onClick={() => onValider(selection)}
          disabled={disabled || selection.length === 0}
        >
          Valider ma sélection
        </KahootButton>
      ) : null}
    </div>
  );
}

function VraiFauxVote({
  maReponse,
  onValider,
  disabled,
}: {
  maReponse: Reponse["valeur"] | null;
  onValider: (v: Reponse["valeur"]) => void | Promise<void>;
  disabled?: boolean;
}) {
  const sel = typeof maReponse === "boolean" ? maReponse : null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onValider(true)}
        disabled={disabled}
        className={classNames(
          "bg-kahoot-green kahoot-shadow-green rounded-2xl p-8 text-3xl font-black",
          sel === true ? "ring-4 ring-white scale-[1.02]" : ""
        )}
      >
        ✅ Vrai
      </button>
      <button
        onClick={() => onValider(false)}
        disabled={disabled}
        className={classNames(
          "bg-kahoot-red kahoot-shadow-red rounded-2xl p-8 text-3xl font-black",
          sel === false ? "ring-4 ring-white scale-[1.02]" : ""
        )}
      >
        ❌ Faux
      </button>
    </div>
  );
}

function NuageVote({
  q,
  maReponse,
  onValider,
  disabled,
}: {
  q: Extract<Question, { type: "nuage-mots" }>;
  maReponse: Reponse["valeur"] | null;
  onValider: (v: Reponse["valeur"]) => void | Promise<void>;
  disabled?: boolean;
}) {
  const n = q.maxMots ?? 3;
  const [mots, setMots] = useState<string[]>(() => {
    if (Array.isArray(maReponse) && typeof maReponse[0] === "string") {
      const arr = (maReponse as string[]).slice(0, n);
      while (arr.length < n) arr.push("");
      return arr;
    }
    return Array(n).fill("");
  });

  function setMot(i: number, val: string) {
    setMots((m) => {
      const next = [...m];
      next[i] = val;
      return next;
    });
  }

  const tousRemplis = mots.every((m) => normaliserMot(m).length > 0);

  return (
    <div className="flex flex-col gap-3">
      {mots.map((m, i) => (
        <input
          key={i}
          type="text"
          value={m}
          maxLength={30}
          onChange={(e) => setMot(i, e.target.value)}
          placeholder={`Mot ${i + 1}`}
          disabled={disabled}
          className="px-4 py-4 rounded-2xl bg-white/15 border-2 border-white/20 text-white text-lg font-bold focus:outline-none focus:border-kahoot-yellow placeholder-white/40"
        />
      ))}
      <KahootButton
        color="green"
        size="lg"
        disabled={disabled || !tousRemplis}
        onClick={() => onValider(mots.map((m) => m.trim()).filter(Boolean))}
      >
        Envoyer mes mots
      </KahootButton>
    </div>
  );
}

function EvaluationVote({
  q,
  maReponse,
  onValider,
  disabled,
}: {
  q: Extract<Question, { type: "evaluation" }>;
  maReponse: Reponse["valeur"] | null;
  onValider: (v: Reponse["valeur"]) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [notes, setNotes] = useState<Record<number, number>>(() => {
    if (maReponse && typeof maReponse === "object" && !Array.isArray(maReponse))
      return { ...(maReponse as Record<number, number>) };
    return {};
  });
  const tousNotes = q.items.every((_, i) => notes[i] >= 1 && notes[i] <= 5);

  return (
    <div className="flex flex-col gap-4">
      {q.items.map((item, idx) => (
        <div key={idx} className="kahoot-card p-4">
          <p className="font-extrabold mb-2">
            {item || `Critère ${idx + 1}`}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const colors = [
                "bg-kahoot-red",
                "bg-kahoot-magenta",
                "bg-kahoot-yellow",
                "bg-kahoot-blue",
                "bg-kahoot-green",
              ];
              const sel = notes[idx] === n;
              return (
                <button
                  key={n}
                  onClick={() =>
                    setNotes((prev) => ({ ...prev, [idx]: n }))
                  }
                  disabled={disabled}
                  className={classNames(
                    colors[n - 1],
                    "rounded-xl py-3 font-black text-xl transition-transform active:translate-y-1",
                    sel ? "ring-4 ring-white scale-[1.05]" : "opacity-80"
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p className="flex justify-between text-xs text-white/60 mt-1">
            <span>1 : critère absent</span>
            <span>5 : critère présent</span>
          </p>
        </div>
      ))}
      <KahootButton
        color="green"
        size="lg"
        disabled={disabled || !tousNotes}
        onClick={() => onValider(notes)}
      >
        Valider mes évaluations
      </KahootButton>
    </div>
  );
}
