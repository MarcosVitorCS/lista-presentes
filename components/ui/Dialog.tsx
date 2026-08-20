"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { cx } from "./utils";

// WAAPI não resolve custom properties do CSS — precisa de um valor literal.
// Espelha --ease-out do globals.css de propósito; se um dia mudar lá, mudar
// aqui também.
const EASE_OUT = "cubic-bezier(0.2, 0.7, 0.3, 1)";
const DURATION_OPEN_MS = 300; // espelha --duration-morph
const DURATION_CLOSE_MS = 250; // saída um pouco mais rápida que a entrada, de propósito

/**
 * Só roda a animação de origem (FLIP) quando faz sentido: elemento de
 * origem existe e está mesmo na tela, sem prefers-reduced-motion, e não em
 * telas pequenas (lá a classe gift-dialog já vira bottom sheet, tratado
 * inteiramente em CSS — ver .gift-dialog em globals.css).
 */
function canFlip(origin: HTMLElement | null): origin is HTMLElement {
  if (!origin || !origin.isConnected) return false
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (!window.matchMedia("(min-width: 768px)").matches) return false;
  const rect = origin.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

// FLIP: mede onde o elemento de origem está (First) e onde o dialog já
// está renderizado, centralizado (Last), calcula o delta (Invert) e anima
// dessa posição invertida de volta pro natural (Play). transform-origin
// precisa ser 0 0 explícito — com o padrão (centro), o mesmo delta escala
// pro ponto errado e o movimento "nada" em vez de crescer limpo a partir
// do card.
function computeFlipTransform(origin: HTMLElement, dialog: HTMLDialogElement) {
  const originRect = origin.getBoundingClientRect();
  const dialogRect = dialog.getBoundingClientRect();
  const dx = originRect.left - dialogRect.left;
  const dy = originRect.top - dialogRect.top;
  const scaleX = originRect.width / dialogRect.width;
  const scaleY = originRect.height / dialogRect.height;
  return `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
}

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
 *
 * `originRef` é opcional e aditivo: sem ele, o comportamento é exatamente o
 * de sempre (fade simples, sem animação de saída) — os outros usos deste
 * componente (ex.: InvitationsManager) não mudam em nada. Com ele, no
 * desktop o dialog nasce visualmente da posição/tamanho do elemento
 * apontado (o card inteiro, não um botão específico) via Web Animations
 * API, e o fechamento espera a animação reversa terminar antes de chamar
 * dialog.close() de verdade — por isso onCancel intercepta o Esc nativo
 * (que fecharia na hora, sem dar tempo da animação rodar) e delega pro
 * mesmo caminho controlado do botão/backdrop.
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  className,
  children,
  originRef,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
  originRef?: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      animationRef.current?.cancel();
      animationRef.current = null;

      const origin = originRef?.current ?? null;
      if (canFlip(origin)) {
        dialog.style.transformOrigin = "0 0";
        const anim = dialog.animate(
          [
            { transform: computeFlipTransform(origin, dialog), opacity: 0.5 },
            { transform: "none", opacity: 1 },
          ],
          { duration: DURATION_OPEN_MS, easing: EASE_OUT, fill: "forwards" }
        );
        animationRef.current = anim;
        anim.finished
          .then(() => {
            // Sem transform inline sobrando: se a janela for redimensionada
            // depois, o dialog deve continuar centralizado normalmente por
            // CSS, não preso numa transform de um clique antigo.
            dialog.style.transform = "";
            dialog.style.transformOrigin = "";
          })
          .catch(() => {});
      }
    }

    if (!open && dialog.open) {
      animationRef.current?.cancel();
      animationRef.current = null;

      const origin = originRef?.current ?? null;
      if (canFlip(origin)) {
        dialog.style.transformOrigin = "0 0";
        const anim = dialog.animate(
          [
            { transform: "none", opacity: 1 },
            { transform: computeFlipTransform(origin, dialog), opacity: 0.5 },
          ],
          { duration: DURATION_CLOSE_MS, easing: EASE_OUT, fill: "forwards" }
        );
        animationRef.current = anim;
        anim.finished.then(() => dialog.close()).catch(() => dialog.close());
      } else {
        dialog.close();
      }
    }
  }, [open, originRef]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={(event) => {
        // preventDefault: sem isso, Esc fecha o <dialog> nativo na hora,
        // sem dar tempo nenhum da animação de saída rodar. onClose (que só
        // muda o estado do componente pai) segue o mesmo caminho controlado
        // do clique no backdrop/botão Cancelar.
        event.preventDefault();
        onClose();
      }}
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
