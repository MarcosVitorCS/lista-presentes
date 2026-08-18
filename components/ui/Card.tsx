import type { HTMLAttributes } from "react";
import { cx } from "./utils";

type Tone = "canvas" | "canvas-alt";

export function Card({
  tone = "canvas",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      className={cx(
        "rounded-[var(--radius)] border border-canvas-line p-6",
        tone === "canvas" ? "bg-canvas" : "bg-canvas-alt",
        className
      )}
      {...props}
    />
  );
}
