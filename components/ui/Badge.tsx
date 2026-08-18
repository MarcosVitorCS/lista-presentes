import type { HTMLAttributes } from "react";
import { cx } from "./utils";

export type BadgeTone = "success" | "warning" | "danger" | "neutral";

// Cor semântica (status) é sempre separada do acento de marca (--color-accent)
// — nunca usar o latão para indicar sucesso/erro/pendência.
const tones: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-canvas-alt text-ink-soft",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
