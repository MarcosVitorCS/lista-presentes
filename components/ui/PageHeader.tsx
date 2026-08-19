import type { ReactNode } from "react";
import { Eyebrow, Heading } from "./Heading";
import { cx } from "./utils";

/**
 * Cabeçalho de página do admin: eyebrow + título + descrição + ação à
 * direita. Repetido em seis telas, cada uma com espaçamento próprio.
 *
 * A ação cai abaixo do título no mobile (flex-col) e vai pra direita a
 * partir de sm — sem isso, um botão longo estourava a largura em 390px.
 */
export function PageHeader({
  eyebrow,
  title,
  titleAs = "h1",
  description,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  /** O admin já tem um h1 no layout, então suas páginas passam "h2". */
  titleAs?: "h1" | "h2";
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col gap-4 border-b border-canvas-line pb-6 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading as={titleAs} size="lg">
          {title}
        </Heading>
        {description ? (
          <p className="max-w-prose text-body-md text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}
