import type { ReactNode } from "react";
import { cx } from "./utils";

/**
 * Número + rótulo. Substitui três implementações locais que existiam
 * espalhadas (dashboard admin, confirmações) — nenhuma delas de fato exigia
 * um componente próprio, só tinham medo de que o Stat do kit não quebrasse
 * bem em grades estreitas (390px, 3-5 colunas). Esta versão herda o
 * comportamento das duas: wrapper min-w-0 (senão o item do grid ignora a
 * largura da track ao decidir quebrar linha) + rótulo com break-words e
 * tamanho responsivo, mas agora com tons semânticos pra não precisar
 * reimplementar de novo na próxima tela que precisar de "Confirmados" em
 * verde ou "Pendente" em âmbar.
 *
 * O número usa a serifada (font-display): dígito grande em serifada é o que
 * dá o tom editorial da marca, e como é texto grande o latão passa contraste
 * (WCAG exige 3:1 pra >=24px bold).
 */
const TONE_CLASS = {
  ink: "text-ink-deep",
  accent: "text-accent",
  "on-deep": "text-on-deep",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
} as const;

const SIZE_CLASS = {
  lg: "text-display-md",
  md: "text-2xl",
} as const;

export type StatTone = keyof typeof TONE_CLASS;

export function Stat({
  value,
  label,
  tone = "ink",
  size = "lg",
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  tone?: StatTone;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const labelTone = tone === "ink" ? "text-ink-soft" : tone === "on-deep" ? "text-on-deep-soft" : "text-ink-soft";

  return (
    <div className={cx("min-w-0 flex flex-col gap-0.5", className)}>
      <span className={cx("font-display leading-none tabular-nums", SIZE_CLASS[size], TONE_CLASS[tone])}>
        {value}
      </span>
      <span
        className={cx(
          "break-words text-[10px] uppercase leading-snug tracking-[0.03em] sm:text-xs sm:tracking-[0.08em]",
          labelTone
        )}
      >
        {label}
      </span>
    </div>
  );
}
