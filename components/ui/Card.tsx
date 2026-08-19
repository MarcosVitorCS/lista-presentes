import type { HTMLAttributes } from "react";
import { cx } from "./utils";

type Tone = "canvas" | "canvas-alt";
type Elevation = "flat" | "raise" | "float";

// Sombra é opcional e discreta: no papel, o cartão se define pela borda.
// A elevação existe pra hierarquia (um cartão em destaque, um resultado
// aberto), não como decoração padrão — por isso "flat" é o default.
const elevations: Record<Elevation, string> = {
  flat: "",
  raise: "shadow-raise",
  float: "shadow-float",
};

export function Card({
  tone = "canvas",
  elevation = "flat",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone; elevation?: Elevation }) {
  return (
    <div
      className={cx(
        "rounded-[var(--radius-lg)] border border-canvas-line p-6",
        tone === "canvas" ? "bg-canvas" : "bg-canvas-alt",
        elevations[elevation],
        className
      )}
      {...props}
    />
  );
}
