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
  return (
    <span
      className={cx(
        "text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong",
        className
      )}
      {...props}
    />
  );
}
