'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, ExternalLink } from 'lucide-react'

const CHIP_CLASS =
  'flex min-h-11 items-center gap-1.5 rounded-full border border-canvas-line bg-canvas px-4 text-xs font-semibold text-ink-soft transition-colors duration-[var(--duration-hover)] hover:border-accent-strong hover:text-ink'

/**
 * Ações que um admin faz o tempo todo e hoje exigiam navegar até a subpágina
 * certa pra fazer. Só o botão de copiar link precisa ser client — o resto é
 * link puro; mantido tudo num componente só pra ficar visualmente junto sem
 * poluir o dashboard com mais um Card.
 */
export function DashboardQuickActions({
  eventSlug,
  hasRsvp,
  pendingPixCount,
}: {
  eventSlug: string
  hasRsvp: boolean
  pendingPixCount: number
}) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    const url = `${window.location.origin}/evento/${eventSlug}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`/evento/${eventSlug}`} target="_blank" rel="noopener noreferrer" className={CHIP_CLASS}>
        <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
        Ver lista pública
      </a>
      <button type="button" onClick={copyLink} className={CHIP_CLASS}>
        {copied ? <Check size={14} strokeWidth={1.8} aria-hidden="true" /> : <Copy size={14} strokeWidth={1.8} aria-hidden="true" />}
        {copied ? 'Link copiado!' : 'Copiar link do evento'}
      </button>
      {hasRsvp && (
        <Link href="/admin/dashboard/confirmacoes" className={CHIP_CLASS}>
          Ver confirmações pendentes
        </Link>
      )}
      {pendingPixCount > 0 && (
        <Link href="/admin/dashboard/reservas" className={CHIP_CLASS}>
          Ver reservas pendentes
        </Link>
      )}
    </div>
  )
}
