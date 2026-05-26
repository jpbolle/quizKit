"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Groupe, GroupingMode, Question, Reponse } from "@/lib/types";
import { cleCanonique, formaterValeur, repartir } from "@/lib/groupes";
import { KahootButton } from "./KahootButton";

interface Props {
  question: Question;
  reponses: Reponse[];
}

interface GroupeEditable {
  id: string;
  label: string;
  membres: Groupe["membres"];
  /** null = pas de recette ; sinon liste de clés canoniques de valeurs à mixer dans ce groupe */
  recette: Set<string> | null;
  /** UI : panneau « recette » ouvert ou non */
  recetteOuverte: boolean;
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

function nouvelId() {
  return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function shuffleInplace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function GroupesPanel({ question, reponses }: Props) {
  const [mode, setMode] = useState<GroupingMode>("identique");
  const [taille, setTaille] = useState(4);
  const [seed, setSeed] = useState(0);
  const [groupes, setGroupes] = useState<GroupeEditable[]>([]);
  const [editeManuel, setEditeManuel] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Liste des valeurs distinctes apparues dans les réponses (clé + label)
  const valeurs = useMemo(() => {
    const m = new Map<string, { cle: string; label: string; count: number }>();
    for (const r of reponses) {
      const cle = cleCanonique(question, r.valeur);
      const label = formaterValeur(question, r.valeur);
      if (!m.has(cle)) m.set(cle, { cle, label, count: 0 });
      m.get(cle)!.count++;
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [question, reponses]);

  // Refs vers les dernières props (pour générer dans des callbacks sans re-trigger)
  const reponsesRef = useRef(reponses);
  useEffect(() => {
    reponsesRef.current = reponses;
  }, [reponses]);
  const questionRef = useRef(question);
  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  function regenerer() {
    const q = questionRef.current;
    const reps = reponsesRef.current;
    const result = repartir(q, reps, mode, taille);
    setGroupes(
      result.map((g) => ({
        id: nouvelId(),
        label: g.label,
        membres: g.membres,
        recette: null,
        recetteOuverte: false,
      }))
    );
    setEditeManuel(false);
  }

  // Regen complet quand les paramètres changent (pas quand reponses change)
  useEffect(() => {
    regenerer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, taille, seed]);

  // Ajout auto des nouveaux votants quand reponses change
  useEffect(() => {
    setGroupes((prev) => {
      if (prev.length === 0) return prev;
      const dejaPlaces = new Set(
        prev.flatMap((g) => g.membres.map((m) => m.participantId))
      );
      const q = questionRef.current;
      const nouveaux = reponses.filter(
        (r) => !dejaPlaces.has(r.participantId)
      );
      if (nouveaux.length === 0) return prev;
      const next = prev.map((g) => ({ ...g, membres: [...g.membres] }));
      for (const r of nouveaux) {
        const cle = cleCanonique(q, r.valeur);
        // 1) groupes avec recette qui accepte cette valeur
        const candidatsRecette = next.filter(
          (g) => g.recette && g.recette.has(cle)
        );
        // 2) sinon, groupes sans recette
        const candidatsSansRecette = next.filter((g) => !g.recette);
        const pool =
          candidatsRecette.length > 0
            ? candidatsRecette
            : candidatsSansRecette.length > 0
              ? candidatsSansRecette
              : next;
        const cible = pool.reduce((min, g) =>
          g.membres.length < min.membres.length ? g : min
        , pool[0]);
        cible.membres.push({
          participantId: r.participantId,
          prenom: r.participantPrenom,
          valeurAffichee: formaterValeur(q, r.valeur),
        });
      }
      return next;
    });
  }, [reponses]);

  // === Drag & Drop ===
  const dragRef = useRef<{
    fromGroupId: string;
    participantId: string;
  } | null>(null);

  function handleDragStart(
    e: React.DragEvent<HTMLLIElement>,
    fromGroupId: string,
    participantId: string
  ) {
    dragRef.current = { fromGroupId, participantId };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", participantId);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, toId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTargetId !== toId) setDropTargetId(toId);
  }

  function handleDragLeave() {
    setDropTargetId(null);
  }

  function handleDrop(toGroupId: string) {
    const drag = dragRef.current;
    setDropTargetId(null);
    dragRef.current = null;
    if (!drag) return;
    if (drag.fromGroupId === toGroupId) return;
    setGroupes((prev) => {
      const fromIdx = prev.findIndex((g) => g.id === drag.fromGroupId);
      const toIdx = prev.findIndex((g) => g.id === toGroupId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const membre = prev[fromIdx].membres.find(
        (m) => m.participantId === drag.participantId
      );
      if (!membre) return prev;
      return prev.map((g, i) => {
        if (i === fromIdx)
          return {
            ...g,
            membres: g.membres.filter(
              (m) => m.participantId !== drag.participantId
            ),
          };
        if (i === toIdx) return { ...g, membres: [...g.membres, membre] };
        return g;
      });
    });
    setEditeManuel(true);
  }

  function ajouterGroupe() {
    setGroupes((prev) => [
      ...prev,
      {
        id: nouvelId(),
        label: `Équipe ${prev.length + 1}`,
        membres: [],
        recette: null,
        recetteOuverte: false,
      },
    ]);
    setEditeManuel(true);
  }

  function supprimerGroupe(id: string) {
    setGroupes((prev) => prev.filter((g) => g.id !== id));
    setEditeManuel(true);
  }

  function viderGroupe(id: string) {
    setGroupes((prev) =>
      prev.map((g) => (g.id === id ? { ...g, membres: [] } : g))
    );
    setEditeManuel(true);
  }

  function viderTout() {
    setGroupes((prev) => prev.map((g) => ({ ...g, membres: [] })));
    setEditeManuel(true);
  }

  function toggleRecetteOuverte(id: string) {
    setGroupes((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, recetteOuverte: !g.recetteOuverte } : g
      )
    );
  }

  function toggleRecetteValeur(groupId: string, cle: string) {
    setGroupes((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const actuelle = g.recette ?? new Set<string>();
        const next = new Set(actuelle);
        if (next.has(cle)) next.delete(cle);
        else next.add(cle);
        return { ...g, recette: next.size === 0 ? null : next };
      })
    );
    setEditeManuel(true);
  }

  function effacerRecette(groupId: string) {
    setGroupes((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, recette: null } : g))
    );
    setEditeManuel(true);
  }

  /**
   * Remplit automatiquement les groupes ayant une recette, en piochant dans
   * les participants encore non assignés. Round-robin sur les valeurs de
   * chaque recette jusqu'à atteindre la taille cible.
   */
  function remplirAuto() {
    setGroupes((prev) => {
      const q = questionRef.current;
      const reps = reponsesRef.current;
      const placed = new Set<string>();
      prev.forEach((g) => g.membres.forEach((m) => placed.add(m.participantId)));

      // Pool par valeur (mélangé)
      const pools = new Map<string, Reponse[]>();
      for (const r of reps) {
        if (placed.has(r.participantId)) continue;
        const cle = cleCanonique(q, r.valeur);
        if (!pools.has(cle)) pools.set(cle, []);
        pools.get(cle)!.push(r);
      }
      for (const arr of pools.values()) shuffleInplace(arr);

      const next = prev.map((g) => ({ ...g, membres: [...g.membres] }));

      // Étape 1 : groupes avec recette
      for (const g of next) {
        if (!g.recette || g.recette.size === 0) continue;
        const valeursR = [...g.recette];
        let cycle = 0;
        let ajoute = true;
        while (g.membres.length < taille && ajoute) {
          ajoute = false;
          for (let i = 0; i < valeursR.length && g.membres.length < taille; i++) {
            const v = valeursR[(cycle + i) % valeursR.length];
            const pool = pools.get(v);
            if (pool && pool.length > 0) {
              const r = pool.shift()!;
              g.membres.push({
                participantId: r.participantId,
                prenom: r.participantPrenom,
                valeurAffichee: formaterValeur(q, r.valeur),
              });
              placed.add(r.participantId);
              ajoute = true;
            }
          }
          cycle++;
        }
      }

      // Étape 2 : reste → groupes sans recette (au plus petit)
      const sansRecette = next.filter((g) => !g.recette);
      if (sansRecette.length > 0) {
        const restants: Reponse[] = [];
        for (const arr of pools.values()) restants.push(...arr);
        shuffleInplace(restants);
        for (const r of restants) {
          const cible = sansRecette.reduce((min, g) =>
            g.membres.length < min.membres.length ? g : min
          , sansRecette[0]);
          cible.membres.push({
            participantId: r.participantId,
            prenom: r.participantPrenom,
            valeurAffichee: formaterValeur(q, r.valeur),
          });
        }
      }
      return next;
    });
    setEditeManuel(true);
  }

  const yAUneRecette = groupes.some((g) => g.recette && g.recette.size > 0);

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

        <KahootButton color="yellow" size="sm" onClick={() => setSeed((s) => s + 1)}>
          🎲 Re-tirer
        </KahootButton>

        <KahootButton color="white" size="sm" onClick={ajouterGroupe}>
          ➕ Groupe vide
        </KahootButton>

        {mode === "different" && yAUneRecette ? (
          <KahootButton color="green" size="sm" onClick={remplirAuto}>
            📥 Remplir auto (recettes)
          </KahootButton>
        ) : null}

        {groupes.some((g) => g.membres.length > 0) ? (
          <KahootButton color="purple" size="sm" onClick={viderTout}>
            🧹 Tout vider
          </KahootButton>
        ) : null}
      </div>

      {mode === "different" && valeurs.length > 1 ? (
        <p className="text-xs text-white/60">
          💡 Pour apparier différemment par groupe : clique sur{" "}
          <strong>🎯 Recette</strong> dans une carte, coche les valeurs à mixer,
          puis <strong>📥 Remplir auto</strong>. Ex : groupe 1 (A+B), groupe 2
          (A+C), groupe 3 (B+C).
        </p>
      ) : null}

      {editeManuel ? (
        <p className="text-xs text-white/70 italic">
          ✏️ Répartition modifiée manuellement. « 🎲 Re-tirer » repart d&apos;une
          répartition automatique.
        </p>
      ) : null}

      {groupes.length === 0 ? (
        <p className="text-white/70 italic">
          Pas encore assez de réponses pour répartir.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupes.map((g, i) => {
            const surligne = dropTargetId === g.id;
            const labelsRecette =
              g.recette && g.recette.size > 0
                ? [...g.recette]
                    .map(
                      (cle) =>
                        valeurs.find((v) => v.cle === cle)?.label ?? cle
                    )
                : null;
            return (
              <div
                key={g.id}
                onDragOver={(e) => handleDragOver(e, g.id)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(g.id)}
                className={
                  `${COULEURS_GROUPES[i % COULEURS_GROUPES.length]} ${OMBRES[i % OMBRES.length]} ` +
                  "rounded-2xl p-4 flex flex-col gap-2 transition-all " +
                  (surligne ? "ring-4 ring-white scale-[1.02]" : "")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-black uppercase text-lg">{g.label}</h4>
                  <div className="flex gap-1">
                    {mode === "different" && valeurs.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => toggleRecetteOuverte(g.id)}
                        className={
                          "text-xs font-bold px-2 py-1 rounded-lg " +
                          (g.recette && g.recette.size > 0
                            ? "bg-white text-kahoot-purple-dark"
                            : "bg-black/30 text-white/80 hover:bg-black/40")
                        }
                        title="Définir une recette pour ce groupe"
                      >
                        🎯
                      </button>
                    ) : null}
                    {g.membres.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => viderGroupe(g.id)}
                        className="text-white/70 hover:text-white text-xs font-bold bg-black/30 px-2 py-1 rounded-lg"
                        title="Vider ce groupe"
                      >
                        🧹
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => supprimerGroupe(g.id)}
                        className="text-white/70 hover:text-white text-xs font-bold bg-black/30 px-2 py-1 rounded-lg"
                        title="Supprimer ce groupe vide"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Recette : panneau d'édition */}
                {g.recetteOuverte && mode === "different" ? (
                  <div className="bg-black/30 rounded-xl p-2 flex flex-wrap gap-1 items-center">
                    {valeurs.map((v) => {
                      const actif = g.recette?.has(v.cle) ?? false;
                      return (
                        <button
                          key={v.cle}
                          type="button"
                          onClick={() => toggleRecetteValeur(g.id, v.cle)}
                          className={
                            "px-2 py-0.5 rounded-full text-xs font-bold border " +
                            (actif
                              ? "bg-kahoot-yellow text-kahoot-purple-dark border-kahoot-yellow"
                              : "bg-white/10 border-white/30 text-white/70")
                          }
                        >
                          {v.label}
                        </button>
                      );
                    })}
                    {g.recette && g.recette.size > 0 ? (
                      <button
                        type="button"
                        onClick={() => effacerRecette(g.id)}
                        className="text-white/60 hover:text-white text-xs underline ml-1"
                      >
                        Effacer
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {/* Recette : récap quand fermée */}
                {!g.recetteOuverte && labelsRecette ? (
                  <p className="text-xs text-white/80">
                    🎯 Mix : {labelsRecette.join(" + ")}
                  </p>
                ) : null}

                <ul className="flex flex-col gap-1 min-h-[2rem]">
                  {g.membres.map((m) => (
                    <li
                      key={m.participantId}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, g.id, m.participantId)
                      }
                      className="bg-black/25 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none"
                    >
                      <span className="font-bold">{m.prenom}</span>
                      {mode === "different" ? (
                        <span className="text-white/80 text-xs truncate max-w-[60%]">
                          {m.valeurAffichee}
                        </span>
                      ) : null}
                    </li>
                  ))}
                  {g.membres.length === 0 ? (
                    <li className="text-white/60 italic text-xs px-2 py-1">
                      Dépose un apprenant ici
                    </li>
                  ) : null}
                </ul>
                <p className="text-xs text-white/80 font-bold mt-auto">
                  {g.membres.length} membre{g.membres.length > 1 ? "s" : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-white/50">
        Astuce : glisse-dépose un prénom d&apos;un groupe à l&apos;autre pour
        ajuster manuellement. (Souris ou trackpad — pas de glisser tactile pour
        le moment.)
      </p>
    </div>
  );
}
