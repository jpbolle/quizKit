"use client";

import { useEffect, useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import type { Question } from "@/lib/types";
import { KahootButton } from "./KahootButton";
import { KahootShape } from "./Shapes";
import { KAHOOT_COLOR_CLASSES, KAHOOT_COLORS } from "@/lib/utils";

type DebouncedTextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value: string;
  onCommit: (v: string) => void;
  delay?: number;
};

/**
 * Input texte découplé d'une source distante (Firestore) :
 * - garde un état local pendant la frappe (pas de round-trip qui casse les dead keys ^ ¨ `)
 * - re-synchronise depuis la prop quand l'utilisateur n'est pas en train d'éditer
 * - commit débouncé + commit immédiat sur blur
 */
function DebouncedTextInput({
  value,
  onCommit,
  delay = 400,
  onBlur,
  ...rest
}: DebouncedTextInputProps) {
  const [local, setLocal] = useState(value);
  const composingRef = useRef(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dirtyRef.current && !composingRef.current) {
      setLocal(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function schedule(v: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      dirtyRef.current = false;
      onCommit(v);
    }, delay);
  }

  return (
    <input
      {...rest}
      value={local}
      onChange={(e) => {
        const v = e.target.value;
        dirtyRef.current = true;
        setLocal(v);
        if (!composingRef.current) schedule(v);
      }}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(e) => {
        composingRef.current = false;
        const v = (e.target as HTMLInputElement).value;
        setLocal(v);
        schedule(v);
      }}
      onBlur={(e) => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (dirtyRef.current) {
          dirtyRef.current = false;
          onCommit(e.currentTarget.value);
        }
        onBlur?.(e);
      }}
    />
  );
}

interface Props {
  question: Question;
  index: number;
  total: number;
  onChange: (q: Question) => void;
  onSupprimer: () => void;
  onMonter: () => void;
  onDescendre: () => void;
  disabled?: boolean;
}

export function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onSupprimer,
  onMonter,
  onDescendre,
  disabled,
}: Props) {
  const typeLabel: Record<Question["type"], string> = {
    qcm: "QCM",
    "vrai-faux": "Vrai / Faux",
    "nuage-mots": "Nuage de mots",
    evaluation: "Évaluation 1 → 5",
  };

  return (
    <div className="kahoot-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="bg-kahoot-yellow text-kahoot-purple-dark font-black w-9 h-9 rounded-full flex items-center justify-center">
            {index + 1}
          </span>
          <span className="font-bold text-white/80 uppercase text-sm tracking-wide">
            {typeLabel[question.type]}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMonter}
            disabled={disabled || index === 0}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 font-bold"
            aria-label="Monter"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onDescendre}
            disabled={disabled || index === total - 1}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 font-bold"
            aria-label="Descendre"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onSupprimer}
            disabled={disabled}
            className="px-3 py-1 rounded-lg bg-kahoot-red/80 hover:bg-kahoot-red font-bold disabled:opacity-30"
            aria-label="Supprimer la question"
          >
            🗑
          </button>
        </div>
      </div>

      <DebouncedTextInput
        type="text"
        placeholder="Énoncé de la question…"
        value={question.question}
        onCommit={(v) => onChange({ ...question, question: v })}
        disabled={disabled}
        className="px-4 py-3 rounded-xl bg-white/15 border-2 border-white/20 placeholder-white/50 text-white text-lg font-semibold focus:border-kahoot-yellow focus:outline-none"
      />

      {question.type === "qcm" ? (
        <QCMEditor q={question} onChange={onChange} disabled={disabled} />
      ) : null}
      {question.type === "vrai-faux" ? (
        <VraiFauxApercu />
      ) : null}
      {question.type === "nuage-mots" ? (
        <NuageMotsEditor q={question} onChange={onChange} disabled={disabled} />
      ) : null}
      {question.type === "evaluation" ? (
        <EvaluationEditor q={question} onChange={onChange} disabled={disabled} />
      ) : null}
    </div>
  );
}

function QCMEditor({
  q,
  onChange,
  disabled,
}: {
  q: Extract<Question, { type: "qcm" }>;
  onChange: (q: Question) => void;
  disabled?: boolean;
}) {
  function setOption(i: number, val: string) {
    const opts = [...q.options];
    opts[i] = val;
    onChange({ ...q, options: opts });
  }
  function addOption() {
    if (q.options.length >= 4) return;
    onChange({ ...q, options: [...q.options, ""] });
  }
  function removeOption(i: number) {
    if (q.options.length <= 2) return;
    onChange({ ...q, options: q.options.filter((_, j) => j !== i) });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        {q.options.map((opt, i) => {
          const color = KAHOOT_COLORS[i % 4];
          const palette = KAHOOT_COLOR_CLASSES[color];
          return (
            <div
              key={i}
              className={`flex items-center gap-2 p-3 rounded-2xl ${palette.bg} ${palette.shadow}`}
            >
              <span className="text-white">
                <KahootShape index={i} />
              </span>
              <DebouncedTextInput
                type="text"
                placeholder={`Choix ${i + 1}`}
                value={opt}
                onCommit={(v) => setOption(i, v)}
                disabled={disabled}
                className="flex-1 px-3 py-2 rounded-lg bg-black/20 placeholder-white/50 text-white font-bold focus:outline-none focus:bg-black/30"
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                disabled={disabled || q.options.length <= 2}
                className="text-white/80 hover:text-white px-2 disabled:opacity-30"
                aria-label="Supprimer le choix"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <KahootButton
          color="purple"
          size="sm"
          onClick={addOption}
          disabled={disabled || q.options.length >= 4}
        >
          + Choix
        </KahootButton>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!q.multiAllowed}
            onChange={(e) => onChange({ ...q, multiAllowed: e.target.checked })}
            disabled={disabled}
            className="w-5 h-5 accent-kahoot-yellow"
          />
          <span className="text-sm font-semibold">
            Plusieurs réponses autorisées
          </span>
        </label>
      </div>
    </div>
  );
}

function VraiFauxApercu() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-kahoot-green kahoot-shadow-green rounded-2xl p-4 text-center font-black text-xl">
        ✅ Vrai
      </div>
      <div className="bg-kahoot-red kahoot-shadow-red rounded-2xl p-4 text-center font-black text-xl">
        ❌ Faux
      </div>
    </div>
  );
}

function NuageMotsEditor({
  q,
  onChange,
  disabled,
}: {
  q: Extract<Question, { type: "nuage-mots" }>;
  onChange: (q: Question) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2">
        <span className="text-sm font-semibold">Nombre de mots demandés :</span>
        <input
          type="number"
          min={1}
          max={10}
          value={q.maxMots ?? 3}
          onChange={(e) =>
            onChange({ ...q, maxMots: Math.max(1, Number(e.target.value)) })
          }
          disabled={disabled}
          className="w-20 px-3 py-2 rounded-xl bg-white/15 border-2 border-white/20 text-white font-bold focus:outline-none focus:border-kahoot-yellow"
        />
      </label>
      <span className="text-xs text-white/60">
        Chaque apprenant saisira ce nombre de mots-clés.
      </span>
    </div>
  );
}

function EvaluationEditor({
  q,
  onChange,
  disabled,
}: {
  q: Extract<Question, { type: "evaluation" }>;
  onChange: (q: Question) => void;
  disabled?: boolean;
}) {
  function setItem(i: number, val: string) {
    const items = [...q.items];
    items[i] = val;
    onChange({ ...q, items });
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-white/70">
        Chaque item sera évalué de <b>1</b> (critère absent) à <b>5</b> (critère
        présent).
      </p>
      {q.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-kahoot-yellow font-bold w-6">{i + 1}.</span>
          <DebouncedTextInput
            type="text"
            value={item}
            onCommit={(v) => setItem(i, v)}
            placeholder={`Critère ${i + 1}`}
            disabled={disabled}
            className="flex-1 px-3 py-2 rounded-xl bg-white/15 border-2 border-white/20 text-white font-semibold focus:outline-none focus:border-kahoot-yellow"
          />
          <button
            type="button"
            onClick={() =>
              onChange({ ...q, items: q.items.filter((_, j) => j !== i) })
            }
            disabled={disabled || q.items.length <= 1}
            className="text-white/70 hover:text-white px-2 disabled:opacity-30"
          >
            ×
          </button>
        </div>
      ))}
      <KahootButton
        color="purple"
        size="sm"
        onClick={() => onChange({ ...q, items: [...q.items, ""] })}
        disabled={disabled}
        className="self-start"
      >
        + Critère
      </KahootButton>
    </div>
  );
}
