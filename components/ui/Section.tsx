import type { HTMLAttributes } from "react";
import { Container } from "./Container";
import { cx } from "./utils";

type SectionTone = "canvas" | "canvas-alt" | "ink-deep";
type SectionRhythm = "base" | "lg" | "tight";

const toneClasses: Record<SectionTone, string> = {
  canvas: "bg-canvas text-ink",
  "canvas-alt": "bg-canvas-alt text-ink",
  "ink-deep": "bg-ink-deep text-on-deep",
};

// Ritmo vertical tokenizado. Antes era py-16 sm:py-24 fixo pra toda seção,
// o que dava o mesmo peso a um hero e a uma nota de rodapé. "tight" existe
// pra seções de apoio (avisos, links) que não merecem respiro de capítulo.
const rhythmClasses: Record<SectionRhythm, string> = {
  tight: "py-10 sm:py-14",
  base: "py-section sm:py-section-lg",
  lg: "py-section-lg sm:py-[8rem]",
};

export function Section({
  tone = "canvas",
  rhythm = "base",
  className,
  children,
  containerClassName,
  ...props
}: HTMLAttributes<HTMLElement> & {
  tone?: SectionTone;
  rhythm?: SectionRhythm;
  containerClassName?: string;
}) {
  return (
    <section className={cx(rhythmClasses[rhythm], toneClasses[tone], className)} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
