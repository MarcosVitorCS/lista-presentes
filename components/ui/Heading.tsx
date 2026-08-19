import type { HTMLAttributes, ElementType } from "react";
import { cx } from "./utils";

type HeadingSize = "xl" | "lg" | "md" | "sm";

// Os degraus vêm da escala tipográfica de globals.css (@theme inline), que
// já carrega line-height e tracking — nada de leading solto no call site.
// "sm" é novo: título de cartão do catálogo e de linha de tabela, que antes
// caíam em "md" e ficavam grandes demais.
const sizes: Record<HeadingSize, string> = {
  xl: "text-display-lg sm:text-display-xl",
  lg: "text-display-md sm:text-display-lg",
  md: "text-xl sm:text-display-md",
  sm: "text-lg",
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
  // accent-strong só bate 3.5:1 (falha os 4.5:1 exigidos pra texto normal).
  // Passar className="text-accent" continua funcionando pra usos sobre fundo
  // escuro (hero), onde o dourado original já passa (4.77:1).
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
