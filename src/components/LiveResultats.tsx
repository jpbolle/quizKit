"use client";

import type { Question, Reponse } from "@/lib/types";
import { KAHOOT_COLORS, KAHOOT_COLOR_CLASSES, normaliserMot } from "@/lib/utils";
import { KahootShape } from "./Shapes";

interface Props {
  question: Question;
  reponses: Reponse[];
}

export function LiveResultats({ question, reponses }: Props) {
  switch (question.type) {
    case "qcm":
      return <ResultatsQCM q={question} reponses={reponses} />;
    case "vrai-faux":
      return <ResultatsVraiFaux reponses={reponses} />;
    case "nuage-mots":
      return <ResultatsNuage q={question} reponses={reponses} />;
    case "evaluation":
      return <ResultatsEvaluation q={question} reponses={reponses} />;
  }
}

function GroupeReponse({
  bg,
  shadow,
  icon,
  label,
  prenoms,
}: {
  bg: string;
  shadow: string;
  icon: React.ReactNode;
  label: string;
  prenoms: string[];
}) {
  return (
    <div className={`rounded-2xl p-4 ${bg} ${shadow} flex flex-col gap-2`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-extrabold uppercase">
          {icon}
          <span>{label}</span>
        </div>
        <span className="bg-black/30 px-3 py-1 rounded-full text-sm font-black">
          {prenoms.length}
        </span>
      </div>
      {prenoms.length === 0 ? (
        <p className="text-white/60 text-sm italic">— en attente —</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {prenoms.map((p, i) => (
            <li
              key={`${p}-${i}`}
              className="bg-black/30 px-3 py-1 rounded-full text-sm font-bold animate-[bounce-in_0.4s_ease-out]"
            >
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultatsQCM({
  q,
  reponses,
}: {
  q: Extract<Question, { type: "qcm" }>;
  reponses: Reponse[];
}) {
  // groupBy option -> prenoms
  const buckets: string[][] = q.options.map(() => []);
  for (const r of reponses) {
    if (Array.isArray(r.valeur)) {
      for (const idx of r.valeur as number[]) {
        if (buckets[idx]) buckets[idx].push(r.participantPrenom);
      }
    } else {
      const idx = r.valeur as number;
      if (buckets[idx]) buckets[idx].push(r.participantPrenom);
    }
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {q.options.map((opt, i) => {
        const color = KAHOOT_COLORS[i % 4];
        const palette = KAHOOT_COLOR_CLASSES[color];
        return (
          <GroupeReponse
            key={i}
            bg={palette.bg}
            shadow={palette.shadow}
            icon={<KahootShape index={i} className="w-5 h-5" />}
            label={opt || `Choix ${i + 1}`}
            prenoms={buckets[i]}
          />
        );
      })}
    </div>
  );
}

function ResultatsVraiFaux({ reponses }: { reponses: Reponse[] }) {
  const vrai = reponses
    .filter((r) => r.valeur === true)
    .map((r) => r.participantPrenom);
  const faux = reponses
    .filter((r) => r.valeur === false)
    .map((r) => r.participantPrenom);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <GroupeReponse
        bg="bg-kahoot-green"
        shadow="kahoot-shadow-green"
        icon={<span>✅</span>}
        label="Vrai"
        prenoms={vrai}
      />
      <GroupeReponse
        bg="bg-kahoot-red"
        shadow="kahoot-shadow-red"
        icon={<span>❌</span>}
        label="Faux"
        prenoms={faux}
      />
    </div>
  );
}

function ResultatsNuage({
  q,
  reponses,
}: {
  q: Extract<Question, { type: "nuage-mots" }>;
  reponses: Reponse[];
}) {
  // Compteur par mot normalisé (et on garde le label original le plus fréquent)
  const counts = new Map<string, { count: number; label: string; prenoms: string[] }>();
  for (const r of reponses) {
    const mots = (r.valeur as string[]) || [];
    for (const m of mots) {
      if (!m || !m.trim()) continue;
      const key = normaliserMot(m);
      if (!counts.has(key)) {
        counts.set(key, { count: 0, label: m.trim(), prenoms: [] });
      }
      const entry = counts.get(key)!;
      entry.count++;
      entry.prenoms.push(r.participantPrenom);
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1].count - a[1].count);
  const max = sorted[0]?.[1].count ?? 1;
  const palettes = ["bg-kahoot-red", "bg-kahoot-blue", "bg-kahoot-yellow", "bg-kahoot-green", "bg-kahoot-magenta", "bg-kahoot-purple-light"];

  if (sorted.length === 0) {
    return (
      <p className="text-white/70 italic">
        Aucun mot pour l&apos;instant — invitez les apprenants à répondre !
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 justify-center bg-white/5 rounded-2xl p-6 min-h-32">
        {sorted.map(([key, entry], i) => {
          const ratio = entry.count / max;
          const size = 1 + ratio * 2.2; // 1rem -> 3.2rem
          return (
            <span
              key={key}
              className={`px-4 py-2 rounded-2xl font-black ${palettes[i % palettes.length]} kahoot-shadow-purple animate-[bounce-in_0.4s_ease-out]`}
              style={{ fontSize: `${size}rem`, lineHeight: 1.1 }}
              title={`${entry.count} occurrence${entry.count > 1 ? "s" : ""}`}
            >
              {entry.label} <span className="text-white/70 text-sm">×{entry.count}</span>
            </span>
          );
        })}
      </div>

      <details className="bg-white/5 rounded-xl p-3">
        <summary className="cursor-pointer font-bold">
          Détail par apprenant (qui a écrit quoi ?)
        </summary>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {reponses.map((r) => (
            <li
              key={r.id}
              className="bg-white/10 px-3 py-2 rounded-lg flex items-center justify-between gap-2"
            >
              <span className="font-bold">{r.participantPrenom}</span>
              <span className="text-white/80 text-sm">
                {(r.valeur as string[]).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </details>

      {/* maxMots tip (utilise q pour ESLint) */}
      <p className="text-xs text-white/40 text-center">
        {q.maxMots ?? 3} mot{(q.maxMots ?? 3) > 1 ? "s" : ""} demandé
        {(q.maxMots ?? 3) > 1 ? "s" : ""} par apprenant.
      </p>
    </div>
  );
}

function ResultatsEvaluation({
  q,
  reponses,
}: {
  q: Extract<Question, { type: "evaluation" }>;
  reponses: Reponse[];
}) {
  // Pour chaque item : moyenne + répartition 1..5 avec prénoms
  return (
    <div className="flex flex-col gap-4">
      {q.items.map((item, idx) => {
        const buckets: string[][] = [[], [], [], [], []]; // 1..5
        let somme = 0;
        let n = 0;
        for (const r of reponses) {
          const map = (r.valeur as Record<number, number>) || {};
          const note = map[idx];
          if (note >= 1 && note <= 5) {
            buckets[note - 1].push(r.participantPrenom);
            somme += note;
            n++;
          }
        }
        const moyenne = n > 0 ? (somme / n).toFixed(2) : "—";
        return (
          <div key={idx} className="kahoot-card p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="font-extrabold">{item || `Critère ${idx + 1}`}</h4>
              <span className="bg-kahoot-yellow text-kahoot-purple-dark font-black px-3 py-1 rounded-full text-sm">
                Moy. {moyenne} / 5
              </span>
            </div>
            <div className="grid gap-2 grid-cols-1 md:grid-cols-5">
              {buckets.map((prenoms, i) => {
                const colors = [
                  "bg-kahoot-red",
                  "bg-kahoot-magenta",
                  "bg-kahoot-yellow",
                  "bg-kahoot-blue",
                  "bg-kahoot-green",
                ];
                return (
                  <div
                    key={i}
                    className={`${colors[i]} rounded-xl p-2 flex flex-col gap-1 min-h-20`}
                  >
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>{i + 1} / 5</span>
                      <span className="bg-black/30 px-2 rounded-full">
                        {prenoms.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {prenoms.map((p, j) => (
                        <span
                          key={j}
                          className="text-xs bg-black/25 px-2 py-0.5 rounded-full font-bold"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
