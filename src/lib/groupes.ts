import type {
  Groupe,
  GroupingMode,
  Question,
  Reponse,
} from "./types";

/**
 * Renvoie une représentation textuelle / canonique de la réponse,
 * utilisée pour grouper et afficher.
 */
export function formaterValeur(q: Question, valeur: Reponse["valeur"]): string {
  switch (q.type) {
    case "qcm": {
      if (Array.isArray(valeur)) {
        const idxs = valeur as number[];
        return idxs
          .map((i) => q.options[i] ?? `?${i}`)
          .sort()
          .join(" + ") || "—";
      }
      const idx = valeur as number;
      return q.options[idx] ?? `?${idx}`;
    }
    case "vrai-faux":
      return (valeur as boolean) ? "Vrai" : "Faux";
    case "nuage-mots":
      return (valeur as string[]).join(", ") || "—";
    case "evaluation": {
      const map = valeur as Record<number, number>;
      return q.items
        .map((it, i) => `${it}: ${map[i] ?? "—"}`)
        .join(" • ");
    }
  }
}

/**
 * Donne une clé canonique stable pour regrouper des réponses identiques.
 * Pour le nuage de mots, on prend l'ensemble trié des mots.
 * Pour l'évaluation, on prend la concaténation triée des notes.
 */
function cleCanonique(q: Question, valeur: Reponse["valeur"]): string {
  switch (q.type) {
    case "qcm": {
      if (Array.isArray(valeur)) {
        return [...(valeur as number[])].sort((a, b) => a - b).join(",");
      }
      return String(valeur);
    }
    case "vrai-faux":
      return String(Boolean(valeur));
    case "nuage-mots":
      return [...(valeur as string[])]
        .map((m) => m.trim().toLowerCase())
        .sort()
        .join("|");
    case "evaluation": {
      const map = valeur as Record<number, number>;
      return q.items.map((_, i) => map[i] ?? 0).join(",");
    }
  }
}

/**
 * Regroupe les participants par réponse identique.
 */
export function regrouperIdentique(
  q: Question,
  reponses: Reponse[]
): Groupe[] {
  const buckets = new Map<
    string,
    { valeurAffichee: string; membres: Groupe["membres"] }
  >();
  for (const r of reponses) {
    const cle = cleCanonique(q, r.valeur);
    const label = formaterValeur(q, r.valeur);
    if (!buckets.has(cle)) {
      buckets.set(cle, { valeurAffichee: label, membres: [] });
    }
    buckets.get(cle)!.membres.push({
      participantId: r.participantId,
      prenom: r.participantPrenom,
      valeurAffichee: label,
    });
  }
  let i = 1;
  return [...buckets.values()]
    .sort((a, b) => b.membres.length - a.membres.length)
    .map((b) => ({
      label: `Groupe ${i++} — ${b.valeurAffichee}`,
      membres: b.membres,
    }));
}

/**
 * Crée des groupes diversifiés (réponses différentes).
 * Stratégie : on répartit en distribuant chaque bucket en round-robin.
 * @param taillePref taille cible des groupes
 */
export function regrouperDifferent(
  q: Question,
  reponses: Reponse[],
  taillePref = 4
): Groupe[] {
  const buckets = new Map<string, Groupe["membres"]>();
  for (const r of reponses) {
    const cle = cleCanonique(q, r.valeur);
    if (!buckets.has(cle)) buckets.set(cle, []);
    buckets.get(cle)!.push({
      participantId: r.participantId,
      prenom: r.participantPrenom,
      valeurAffichee: formaterValeur(q, r.valeur),
    });
  }
  const ordered = [...buckets.values()].sort((a, b) => b.length - a.length);
  const total = reponses.length;
  const nbGroupes = Math.max(1, Math.round(total / Math.max(1, taillePref)));
  const groupes: Groupe["membres"][] = Array.from(
    { length: nbGroupes },
    () => []
  );

  // Mélange aléatoire à l'intérieur de chaque bucket pour éviter biais
  for (const b of ordered) shuffle(b);

  let cursor = 0;
  for (const bucket of ordered) {
    for (const membre of bucket) {
      // Trouve le groupe le moins rempli, en évitant si possible un doublon de valeur
      let bestIdx = cursor % nbGroupes;
      let bestScore = -Infinity;
      for (let i = 0; i < nbGroupes; i++) {
        const idx = (cursor + i) % nbGroupes;
        const g = groupes[idx];
        const dejaCetteValeur = g.some(
          (m) => m.valeurAffichee === membre.valeurAffichee
        );
        const score = -g.length * 10 - (dejaCetteValeur ? 5 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = idx;
        }
      }
      groupes[bestIdx].push(membre);
      cursor++;
    }
  }
  return groupes
    .filter((g) => g.length > 0)
    .map((membres, i) => ({
      label: `Équipe ${i + 1}`,
      membres,
    }));
}

export function repartir(
  q: Question,
  reponses: Reponse[],
  mode: GroupingMode,
  taillePref = 4
): Groupe[] {
  if (mode === "identique") return regrouperIdentique(q, reponses);
  return regrouperDifferent(q, reponses, taillePref);
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
