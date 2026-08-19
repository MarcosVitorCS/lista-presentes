'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Navegação do admin. Client component por um motivo só: marcar a rota atual
 * (usePathname). Antes os seis links tinham exatamente o mesmo peso visual em
 * toda página — não havia como saber onde você estava sem ler a URL.
 *
 * No mobile a lista rola na horizontal em vez de quebrar em três linhas
 * (flex-wrap fazia o cabeçalho ocupar meia tela em 390px). `no-scrollbar`
 * já existe em globals.css. `min-w-0` é essencial aqui: este <ul> divide a
 * linha com o botão "Sair" dentro de um flex container (ver layout.tsx) —
 * sem min-w-0, o item flex não encolhe abaixo da largura do conteúdo e o
 * overflow-x-auto nunca entra em ação, estourando por baixo do botão.
 */
export function AdminNav({ items }: { items: ReadonlyArray<{ href: string; label: string }> }) {
  const pathname = usePathname()

  return (
    <ul className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto sm:flex-wrap">
      {items.map((item) => {
        // Comparação exata: /admin/dashboard é prefixo de todas as outras
        // rotas, então startsWith marcaria "Painel" como ativo em toda página.
        const active = pathname === item.href
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center whitespace-nowrap rounded-[var(--radius)] px-3 text-sm transition-colors duration-[var(--duration-hover)] ${
                active
                  ? 'bg-on-deep/10 font-semibold text-on-deep'
                  : 'text-on-deep-soft hover:text-on-deep'
              }`}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
