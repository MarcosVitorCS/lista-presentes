import type { ReactNode } from 'react'

/**
 * Estado vazio. `action` é opcional e serve pro caso em que o vazio tem
 * saída (limpar o filtro de preço, por exemplo) — antes o usuário via a
 * mensagem e tinha que descobrir sozinho como voltar a ver itens.
 */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-canvas-line bg-canvas-alt px-6 py-12 text-center">
      <p className="mx-auto max-w-[36ch] text-body-md text-ink-soft">{message}</p>
      {action}
    </div>
  )
}
