import type { ReactNode } from "react";
import { cx } from "./utils";

/**
 * Número + rótulo. O dashboard e o hero montavam isso à mão, cada um com
 * seu próprio tamanho de fonte — o resultado era que o mesmo tipo de dado
 * tinha três pesos visuais diferentes.
 *
 * O número usa a serifada (font-display): dígito grande em serifada é o que
 * dá o tom editorial da marca, e como é texto grande o latão passa contraste
 * (WCAG exige 3:1 pra >=24px bold).
 */
export function Stat({
  value,
  label,
  tone = "ink",
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  tone?: "ink" | "accent" | "on-deep";
  className?: string;
}) {
  const valueTone =
    tone === "accent" ? "text-accent" : tone === "on-deep" ? "text-on-deep" : "text-ink-deep";
  const labelTone = tone === "ink" ? "text-ink-soft" : "text-on-deep-soft";

  return (
    <div className={cx("flex flex-col gap-0.5", className)}>
      <span className={cx("font-display text-3xl font-medium leading-none", valueTone)}>{value}</span>
      <span className={cx("text-caption", labelTone)}>{label}</span>
    </div>
  );
}
