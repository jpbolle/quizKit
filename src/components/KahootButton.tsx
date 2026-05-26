"use client";

import { classNames, KAHOOT_COLOR_CLASSES, type KahootColor } from "@/lib/utils";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: KahootColor | "magenta" | "white" | "purple";
  size?: "sm" | "md" | "lg" | "xl";
  icon?: ReactNode;
  active?: boolean;
}

export function KahootButton({
  color = "blue",
  size = "md",
  icon,
  active,
  children,
  className,
  ...rest
}: Props) {
  const sizeCls = {
    sm: "px-4 py-2 text-sm rounded-xl",
    md: "px-6 py-3 text-base rounded-2xl",
    lg: "px-8 py-4 text-lg rounded-2xl",
    xl: "px-10 py-6 text-2xl rounded-3xl",
  }[size];

  const palette: Record<string, { bg: string; shadow: string; text: string }> = {
    red: { bg: "bg-kahoot-red", shadow: "kahoot-shadow-red", text: "text-white" },
    blue: { bg: "bg-kahoot-blue", shadow: "kahoot-shadow-blue", text: "text-white" },
    yellow: { bg: "bg-kahoot-yellow", shadow: "kahoot-shadow-yellow", text: "text-white" },
    green: { bg: "bg-kahoot-green", shadow: "kahoot-shadow-green", text: "text-white" },
    magenta: { bg: "bg-kahoot-magenta", shadow: "kahoot-shadow-red", text: "text-white" },
    purple: { bg: "bg-kahoot-purple-light", shadow: "kahoot-shadow-purple", text: "text-white" },
    white: { bg: "bg-white", shadow: "kahoot-shadow-purple", text: "text-kahoot-purple-dark" },
  };

  const c = palette[color] ?? palette.blue;
  const klassColor = KAHOOT_COLOR_CLASSES[color as KahootColor];

  return (
    <button
      {...rest}
      className={classNames(
        "relative inline-flex items-center justify-center gap-2 font-extrabold uppercase tracking-wide",
        "transition-transform duration-100 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed",
        "hover:-translate-y-0.5",
        sizeCls,
        c.bg,
        c.text,
        c.shadow,
        klassColor?.ring && active ? `ring-4 ${klassColor.ring}` : "",
        active ? "ring-4 ring-white/70" : "",
        className
      )}
    >
      {icon ? <span className="text-xl">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
