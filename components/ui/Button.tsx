import type { ButtonHTMLAttributes } from "react";
import { cx } from "./utils";

export type ButtonVariant = "solid" | "accent" | "line" | "ghost-dark";
export type ButtonSize = "md" | "sm";

// min-h-11 (44px) em md e min-h-10 (40px) em sm: touch target adequado no
// mobile sem inflar botões secundários densos do admin.
// Foco não é declarado aqui — :focus-visible global em globals.css cuida de
// todo elemento focável do produto com o mesmo anel de latão.
const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-sans font-semibold tracking-wide transition-all duration-[var(--duration-hover)] ease-[var(--ease-out)] active:scale-[0.97] active:duration-[var(--duration-tap)] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer";

// accent usa text-ink-deep (não text-on-deep): dourado + creme pálido dá
// 2.43:1 (reprovado); dourado + verde-tinta dá 4.77:1. Mesma razão pro hover
// do "line" usar accent-text em vez de accent-strong (accent-strong só é
// seguro pra ícones/bordas, não texto).
const variants: Record<ButtonVariant, string> = {
  solid: "bg-ink-deep text-on-deep hover:bg-ink-deep-2 hover:shadow-float",
  accent: "bg-accent text-ink-deep hover:bg-accent-strong hover:shadow-float",
  line: "border border-canvas-line text-ink bg-transparent hover:border-accent-strong hover:text-accent-text",
  "ghost-dark": "border border-on-deep-soft/40 text-on-deep bg-transparent hover:border-accent hover:bg-accent/10",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-6 py-3 text-sm",
  sm: "min-h-10 px-4 py-2 text-xs",
};

export function buttonVariants({
  variant = "solid",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cx(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Mostra o spinner e desabilita o botão. Serve pra useActionState/pending
   * de Server Action sem cada call site inventar o seu próprio estado.
   * O texto do botão fica no lugar (não é trocado por "Enviando...") pra
   * largura não pular — a mudança é só o spinner + opacidade.
   */
  loading?: boolean;
};

export function Button({ variant, size, className, loading, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
