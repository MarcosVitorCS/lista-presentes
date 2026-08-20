"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "./utils";

/**
 * Painel lateral (slide-over) — mesma técnica de <dialog> nativo do
 * Dialog.tsx (foco preso, Esc fecha, backdrop de graça), só que ancorado na
 * borda direita da tela em vez de centralizado, e ocupando a largura toda
 * no mobile (onde "menos da metade da tela" não sobra espaço nenhum pra um
 * formulário). Mesmo cuidado do Dialog: p-0 no <dialog>, padding só no div
 * interno — senão o clique na própria margem do dialog conta como clique
 * no backdrop e fecha sozinho.
 */
export function Drawer({
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
        // max-w-none/max-h-none: o <dialog> nativo vem com max-width/max-height
        // padrão do navegador (pra nunca estourar a viewport quando
        // centralizado) — sem isso, w-full/h-dvh não conseguem valer 100%.
        "m-0 ml-auto h-dvh max-h-none w-full max-w-none border-l border-canvas-line bg-canvas p-0 text-ink shadow-overlay backdrop:bg-ink-deep/60 backdrop:backdrop-blur-[2px] open:animate-slide-in-right sm:w-[min(92vw,420px)] sm:rounded-l-[var(--radius-lg)]",
        className
      )}
    >
      <div className="relative flex h-full flex-col overflow-y-auto p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-[var(--duration-hover)] hover:bg-canvas-alt hover:text-ink"
        >
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        {children}
      </div>
    </dialog>
  );
}
