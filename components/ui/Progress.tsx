import { cx } from "./utils";

export function Progress({
  value,
  label,
  valueText,
  className,
}: {
  value: number;
  /** Descreve o que está progredindo, pro leitor de tela. */
  label?: string;
  /**
   * Sobrescreve o "N%" anunciado pro leitor de tela. Existe pra quando
   * `value` não é uma porcentagem real, e sim um degrau simbólico (ex.:
   * ReservationProgress, que nunca expõe a fração exata de reserva por
   * privacidade) — anunciar "40%" nesse caso implicaria uma precisão que
   * não existe.
   */
  valueText?: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cx("h-1.5 w-full overflow-hidden rounded-full bg-canvas-alt", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={valueText ?? `${Math.round(clamped)}%`}
    >
      <div
        // bg-accent-strong e não bg-accent: o latão claro contra a trilha de
        // pergaminho dá 2.30:1 e reprova os 3:1 exigidos pra elemento gráfico
        // que carrega informação. accent-strong dá 3.20:1.
        className="h-full rounded-full bg-accent-strong transition-[width] duration-500 ease-[var(--ease-out)]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
