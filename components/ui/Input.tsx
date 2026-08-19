import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
} from "react";
import { cx } from "./utils";

// bg-field (branco) e não bg-canvas: dentro de um mundo de pergaminho, o
// branco puro é o que sinaliza "isto é editável".
// border-field-line (não canvas-line): a borda de um campo identifica um
// componente interativo e precisa de 3:1 — canvas-line dá 1.28:1.
// placeholder em ink-soft cheio, sem /60: com alpha o texto caía pra 2.62:1.
// min-h-11 = 44px de touch target. Foco vem do :focus-visible global, mas
// input também responde a :focus (teclado virtual / clique) — daí os dois.
export const fieldClasses =
  "w-full min-h-11 rounded-[var(--radius)] border border-field-line bg-field px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft transition-[border-color,box-shadow] duration-[var(--duration-hover)] focus:border-accent-strong focus:outline-none focus:ring-3 focus:ring-accent/30 aria-invalid:border-danger aria-invalid:focus:ring-danger/25";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldClasses, className)} {...props} />;
}

// A seta nativa do select não é estilizável de forma consistente entre
// navegadores, então mantemos a nativa (appearance padrão) e só alinhamos
// borda, altura e superfície ao resto dos campos. pr-8 abre espaço pra ela.
export const selectClasses = fieldClasses + ' pr-8'

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(selectClasses, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldClasses, "min-h-24 py-2", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx("text-sm font-medium text-ink", className)} {...props} />;
}

/**
 * Rótulo + campo + dica + erro, com a fiação de acessibilidade já feita:
 * htmlFor/id, aria-describedby apontando pra dica e pro erro, aria-invalid
 * quando há erro, e role="alert" na mensagem (o leitor de tela anuncia sem
 * o usuário precisar reencontrar o campo).
 *
 * Existe porque os cinco formulários do produto repetiam essa mesma
 * montagem à mão, cada um com um detalhe faltando.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Recebe as props de acessibilidade já calculadas. */
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": true | undefined;
  }) => ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && !error ? (
        <span id={hintId} className="text-caption text-ink-soft">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" className="text-caption font-medium text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
