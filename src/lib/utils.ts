export function genPin(length = 6): string {
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10).toString();
  }
  return pin;
}

export function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const PARTICIPANT_KEY = "quizkit:participantId";
const PARTICIPANT_PRENOM_KEY = "quizkit:participantPrenom";

export function getOrCreateParticipantId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(PARTICIPANT_KEY);
  if (!id) {
    id = genId();
    localStorage.setItem(PARTICIPANT_KEY, id);
  }
  return id;
}

export function setParticipantPrenom(prenom: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PARTICIPANT_PRENOM_KEY, prenom);
}

export function getParticipantPrenom(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PARTICIPANT_PRENOM_KEY);
}

export function classNames(...arr: (string | false | undefined | null)[]) {
  return arr.filter(Boolean).join(" ");
}

export const KAHOOT_COLORS = ["red", "blue", "yellow", "green"] as const;
export type KahootColor = (typeof KAHOOT_COLORS)[number];

export const KAHOOT_COLOR_CLASSES: Record<
  KahootColor,
  { bg: string; shadow: string; ring: string }
> = {
  red: {
    bg: "bg-kahoot-red",
    shadow: "kahoot-shadow-red",
    ring: "ring-red-200",
  },
  blue: {
    bg: "bg-kahoot-blue",
    shadow: "kahoot-shadow-blue",
    ring: "ring-blue-200",
  },
  yellow: {
    bg: "bg-kahoot-yellow",
    shadow: "kahoot-shadow-yellow",
    ring: "ring-yellow-200",
  },
  green: {
    bg: "bg-kahoot-green",
    shadow: "kahoot-shadow-green",
    ring: "ring-green-200",
  },
};

/** Normalise un mot pour le nuage (minuscule, sans accents, trim) */
export function normaliserMot(mot: string): string {
  return mot
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
