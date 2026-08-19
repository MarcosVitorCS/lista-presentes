import type { ButtonHTMLAttributes } from "react";
import { cx } from "./utils";

// h-11 w-11 (44px) e não h-9 w-9: 36px reprova o mínimo de touch target, e
// esses botões (fechar, remover convidado) são justamente os mais usados no
// celular. O ícone dentro continua pequeno — cresce a área, não o desenho.
export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string }) {
  return (
    <button
      className={cx(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-canvas-line text-ink-soft transition-colors duration-[var(--duration-hover)] hover:border-accent-strong hover:text-accent-strong disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    />
  );
}
