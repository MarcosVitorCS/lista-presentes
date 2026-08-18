import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Botão de retorno explícito — sem depender do usuário saber que clicar na
// marca também volta, ou usar o botão "voltar" do navegador.
export function PublicHeader() {
  return (
    <header className="flex items-center gap-4 border-b border-canvas-line px-5 py-4 sm:px-8">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent-text"
      >
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
        Início
      </Link>
      <span className="h-4 w-px bg-canvas-line" aria-hidden="true" />
      <Link href="/" className="font-display text-lg italic text-ink">
        Rafaely &amp; Vitor
      </Link>
    </header>
  )
}
