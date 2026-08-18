import type { HTMLAttributes, ElementType } from "react";
import { cx } from "./utils";

type HeadingSize = "xl" | "lg" | "md";

const sizes: Record<HeadingSize, string> = {
  xl: "text-5xl sm:text-7xl leading-[0.98]",
  lg: "text-3xl sm:text-4xl leading-tight",
  md: "text-xl sm:text-2xl leading-snug",
};

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: ElementType;
  size?: HeadingSize;
};

export function Heading({ as: Tag = "h2", size = "lg", className, ...props }: HeadingProps) {
  return (
    <Tag
      className={cx("text-balance font-display font-medium text-ink", sizes[size], className)}
      {...props}
    />
  );
}

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  // accent-text (não accent-strong): em texto pequeno sobre pergaminho,
  // accent-strong só bate 3.5:1 (falha os 4.5:1 exigidos pra texto normal) —
  // ver auditoria de contraste da Fase 8. Passar className="text-accent"
  // continua funcionando pra usos sobre fundo escuro (hero), onde o dourado
  // original já passa (4.77:1).
  return (
    <span
      className={cx(
        "text-xs font-semibold uppercase tracking-[0.2em] text-accent-text",
        className
      )}
      {...props}
    />
  );
}
