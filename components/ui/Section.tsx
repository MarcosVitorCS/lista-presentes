import type { HTMLAttributes } from "react";
import { Container } from "./Container";
import { cx } from "./utils";

type SectionTone = "canvas" | "canvas-alt" | "ink-deep";

const toneClasses: Record<SectionTone, string> = {
  canvas: "bg-canvas text-ink",
  "canvas-alt": "bg-canvas-alt text-ink",
  "ink-deep": "bg-ink-deep text-on-deep",
};

export function Section({
  tone = "canvas",
  className,
  children,
  containerClassName,
  ...props
}: HTMLAttributes<HTMLElement> & { tone?: SectionTone; containerClassName?: string }) {
  return (
    <section className={cx("py-16 sm:py-24", toneClasses[tone], className)} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
