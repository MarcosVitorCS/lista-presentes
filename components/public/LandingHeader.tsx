'use client'

import { useId, useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { Drawer } from '@/components/ui/Drawer'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

// Sem "voltar" aqui — esta é a raiz do site, não uma tela dentro de um
// fluxo de evento. Header próprio, simples: marca + "Entrar".
//
// "Entrar" abre o login num painel lateral (Drawer) em vez de navegar pra
// /admin/login — mais fluido, sem cortar a pessoa da landing pra ver um
// formulário. A rota /admin/login continua existindo normalmente (link
// direto, bookmark) e usa o mesmíssimo AdminLoginForm — só muda onde ele é
// renderizado, nunca a lógica de autenticação.
export function LandingHeader() {
  const [loginOpen, setLoginOpen] = useState(false)
  const headingId = useId()

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-canvas-line bg-canvas/85 px-5 py-3 backdrop-blur-md sm:px-8">
        <Logo height={26} priority />
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="flex min-h-11 items-center px-2 text-sm font-medium text-ink-soft transition-colors hover:text-accent-text"
        >
          Entrar
        </button>
      </header>

      <Drawer open={loginOpen} onClose={() => setLoginOpen(false)} labelledBy={headingId}>
        <AdminLoginForm headingId={headingId} />
      </Drawer>
    </>
  )
}
