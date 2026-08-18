import type { ButtonHTMLAttributes } from "react";
import { cx } from "./utils";

export type ButtonVariant = "solid" | "accent" | "line" | "ghost-dark";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-sans text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas cursor-pointer";

const variants: Record<ButtonVariant, string> = {
  solid: "bg-ink-deep text-on-deep hover:bg-ink-deep-2",
  accent: "bg-accent text-on-deep hover:bg-accent-strong",
  line: "border border-canvas-line text-ink bg-transparent hover:border-accent-strong hover:text-accent-strong",
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
