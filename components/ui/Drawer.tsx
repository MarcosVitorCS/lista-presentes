"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "./utils";

/**
 * Painel lateral (slide-over) — mesma base de <dialog> nativo do Dialog.tsx
 * (foco preso, Esc fecha, semântica de modal de graça), ancorado na borda
 * direita em vez de centralizado, ocupando a largura toda no mobile.
 *
 * Animação de entrada E saída via @starting-style + transition-behavior:
 * allow-discrete (classe .drawer-panel, definida em globals.css) — é a
 * técnica atual pra animar abertura/fechamento de <dialog> nativo só com
 * CSS. dialog.close() some com o atributo [open] na hora, mas
 * allow-discrete nas propriedades discretas (display/overlay) segura a
 * remoção do dialog até a transição de saída terminar — sem isso, fechar
 * cortaria a animação no meio. Navegador sem suporte (raro) só perde a
 * animação: abre/fecha instantâneo, nunca quebrado.
 *
 * Mesmo cuidado do Dialog: p-0 no <dialog>, padding só no div interno —
 * senão o clique na própria margem do dialog conta como clique no backdrop
 * e fecha sozinho.
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
        "drawer-panel group m-0 ml-auto h-dvh max-h-none w-full max-w-none border-l border-canvas-line bg-canvas p-0 text-ink shadow-overlay sm:w-[min(92vw,420px)] sm:rounded-l-[var(--radius-lg)]",
        className
      )}
    >
      {/* Conteúdo aparece um instante depois do painel começar a deslizar
          (delay curto) — a sensação de profundidade que separa "painel
          entrando" de "conteúdo dentro dele acomodando". drawer-content
          (globals.css) em vez de group-open:animate-fade-in-up: essa
          segunda forma não funciona porque animate-fade-in-up é uma classe
          escrita à mão, não um utilitário que o Tailwind reconhece — ele só
          sabe prefixar variante em utilitário próprio, então a combinação
          fica no HTML sem gerar CSS nenhum (confirmado: animationName
          computado ficava "none"). */}
      <div className="drawer-content relative flex h-full flex-col overflow-y-auto p-6 sm:p-8">
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
