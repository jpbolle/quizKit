/**
 * Formes Kahoot pour QCM : triangle, losange, cercle, carré.
 * Index 0..3 → ces 4 formes (et 4 couleurs).
 */
import type { ReactElement } from "react";

export const KAHOOT_SHAPES = ["triangle", "losange", "cercle", "carre"] as const;

export function KahootShape({
  index,
  className = "w-8 h-8",
}: {
  index: number;
  className?: string;
}): ReactElement {
  const shape = KAHOOT_SHAPES[index % 4];
  switch (shape) {
    case "triangle":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <polygon points="12,3 22,21 2,21" fill="currentColor" />
        </svg>
      );
    case "losange":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <polygon points="12,2 22,12 12,22 2,12" fill="currentColor" />
        </svg>
      );
    case "cercle":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle cx="12" cy="12" r="10" fill="currentColor" />
        </svg>
      );
    case "carre":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" />
        </svg>
      );
  }
}
