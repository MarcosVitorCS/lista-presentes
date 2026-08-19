"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "./utils";

/**
 * Usa <dialog> nativo: foco preso, Esc fecha, semântica de modal e backdrop
 * já vêm do navegador — sem lib nenhuma. Fechar clicando fora funciona
 * porque o clique no backdrop registra no próprio elemento <dialog> (que é
 * do tamanho do conteúdo, centralizado por margin:auto), nunca nos filhos.
 *
 * ATENÇÃO ao mexer aqui: o p-0 no <dialog> e o padding no <div> interno são
 * o que mantém esse truque funcionando. Padding no próprio <dialog> faria a
 * borda do padding contar como clique no backdrop e o modal fecharia ao
 * clicar na sua própria margem.
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cx(
        "m-auto w-[min(92vw,440px)] rounded-[var(--radius-lg)] border border-canvas-line bg-canvas p-0 text-ink shadow-overlay backdrop:bg-ink-deep/60 backdrop:backdrop-blur-[2px] open:animate-fade-in-up",
        className
      )}
    >
      <div className="p-6">{children}</div>
    </dialog>
  );
}
