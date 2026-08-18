import type { ButtonHTMLAttributes } from "react";
import { cx } from "./utils";

export type ButtonVariant = "solid" | "accent" | "line" | "ghost-dark";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-sans text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas cursor-pointer";

// accent usa text-ink-deep (não text-on-deep): dourado + creme pálido dá
// 2.43:1 (reprovado); dourado + verde-tinta dá 4.77:1 — ver auditoria de
// contraste da Fase 8. Mesma razão pro hover do "line" usar accent-text em
// vez de accent-strong (accent-strong só é seguro pra ícones/bordas, não
// texto).
const variants: Record<ButtonVariant, string> = {
  solid: "bg-ink-deep text-on-deep hover:bg-ink-deep-2",
  accent: "bg-accent text-ink-deep hover:bg-accent-strong",
  line: "border border-canvas-line text-ink bg-transparent hover:border-accent-strong hover:text-accent-text",
  "ghost-dark": "border border-on-deep-soft/40 text-on-deep bg-transparent hover:border-accent hover:bg-accent/10",
};

const sizes: Record<ButtonSize, string> = {
  md: "px-6 py-3",
  sm: "px-4 py-2 text-xs",
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
};

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
}
