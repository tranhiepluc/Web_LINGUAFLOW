"use client";

import * as React from "react";

export interface KeyboardBinding {
  key: string;
  action: () => void;
  label: string;
  repeat?: boolean;
}

export function useKeyboardBindings(bindings: KeyboardBinding[], enabled = true) {
  const ref = React.useRef(bindings);
  ref.current = bindings;

  React.useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      for (const binding of ref.current) {
        if (e.key.toLowerCase() !== binding.key.toLowerCase()) continue;
        if (binding.key === " " || binding.key === "Spacebar") {
          if (isTyping) continue;
          e.preventDefault();
        }
        binding.action();
        break;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled]);
}

export function KeyboardShortcuts({ bindings }: { bindings: KeyboardBinding[] }) {
  return (
    <div className="hidden items-center gap-1.5 md:flex" aria-hidden>
      {bindings.map((b) => (
        <span key={b.key} className="flex items-center gap-1 rounded-lg bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          <kbd>{b.key === " " ? "Space" : b.key === "ArrowRight" ? "→" : b.key}</kbd>
          <span>{b.label}</span>
        </span>
      ))}
    </div>
  );
}