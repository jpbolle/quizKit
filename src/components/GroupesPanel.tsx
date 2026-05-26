"use client";

import { useMemo, useState } from "react";
import type { GroupingMode, Question, Reponse } from "@/lib/types";
import { repartir } from "@/lib/groupes";
import { KahootButton } from "./KahootButton";

interface Props {
  question: Question;
  reponses: Reponse[];
}

const COULEURS_GROUPES = [
  "bg-kahoot-red",
  "bg-kahoot-blue",
  "bg-kahoot-yellow",
  "bg-kahoot-green",
  "bg-kahoot-magenta",
  "bg-kahoot-purple-light",
];

const OMBRES = [
  "kahoot-shadow-red",
  "kahoot-shadow-blue",
  "kahoot-shadow-yellow",
  "kahoot-shadow-green",
  "kahoot-shadow-red",
  "kahoot-shadow-purple",
];

export function GroupesPanel({ question, reponses }: Props) {
  const [mode, setMode] = useState<GroupingMode>("identique");
  const [taille, setTaille] = useState(4);
  const [seed, setSeed] = useState(0);

  const groupes = useMemo(() => {
    // seed force le re-calcul (et donc un nouveau shuffle pour le mode "different")
    void seed;
    return repartir(question, reponses, mode, taille);
  }, [question, reponses, mode, taille, seed]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-extrabold uppercase text-sm tracking-wide text-white/80">
          Critère de regroupement :
        </span>
        <KahootButton
          color={mode === "identique" ? "green" : "purple"}
          size="sm"
          onClick={() => setMode("identique")}
          active={mode === "identique"}
        >
          🟰 Réponses identiques
        </KahootButton>
        <KahootButton
          color={mode === "different" ? "magenta" : "purple"}
          size="sm"
          onClick={() => setMode("different")}
          active={mode === "different"}
        >
          🌈 Réponses variées
        </KahootButton>

        {mode === "different" && (
          <label className="flex items-center gap-2 text-sm font-semibold">
            Taille cible :
            <input
              type="number"
              min={2}
              max={10}
              value={taille}
              onChange={(e) =>
                setTaille(Math.max(2, Math.min(10, Number(e.target.value))))
              }
              className="w-16 px-2 py-1 rounded-lg bg-white/15 border-2 border-white/20 text-white font-bold focus:outline-none focus:border-kahoot-yellow"
            />
          </label>
        )}

        <KahootButton
          color="yellow"
          size="sm"
          onClick={() => setSeed((s) => s + 1)}
        >
          🎲 Re-tirer
        </KahootButton>
      </div>

      {groupes.length === 0 ? (
        <p className="text-white/70 italic">
          Pas encore assez de réponses pour répartir.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupes.map((g, i) => (
            <div
              key={i}
              className={`${COULEURS_GROUPES[i % COULEURS_GROUPES.length]} ${OMBRES[i % OMBRES.length]} rounded-2xl p-4 flex flex-col gap-2`}
            >
              <h4 className="font-black uppercase text-lg">{g.label}</h4>
              <ul className="flex flex-col gap-1">
                {g.membres.map((m) => (
                  <li
                    key={m.participantId}
                    className="bg-black/25 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2"
                  >
                    <span className="font-bold">{m.prenom}</span>
                    {mode === "different" ? (
                      <span className="text-white/80 text-xs truncate max-w-[60%]">
                        {m.valeurAffichee}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-white/80 font-bold mt-auto">
                {g.membres.length} membre{g.membres.length > 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
