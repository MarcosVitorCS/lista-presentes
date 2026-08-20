import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { DEFAULT_EVENT_SLUG } from '@/lib/constants'

// Botão de retorno explícito — sem depender do usuário saber que clicar na
// marca também volta, ou usar o botão "voltar" do navegador.
//
// sticky: em catálogos longos (o de chá de cozinha passa de 60 itens) o
// caminho de volta desaparecia depois de duas rolagens. O fundo é
// semitransparente com blur pra não virar uma faixa opaca sobre o papel.
//
// A marca aqui é a da plataforma (Listaae), não o nome do casal: o nome do
// casal já aparece no eyebrow do PageHeader de cada página interna e no
// hero/rodapé da home. Antes o header repetia o nome do casal, que nesse
// ponto é a informação menos nova da tela.
//
// homeHref: "voltar"/logo levam pra home do EVENTO (/evento/[slug]), não
// pra `/` — desde que `/` virou a landing institucional da Listaae, ir pra
// lá no meio do fluxo de convidado seria trocar o evento por um pitch de
// produto. O default cobre os 4 call sites atuais (casamento, chá de
// cozinha, identificação, confirmar) sem precisar editar nenhum deles.
export function PublicHeader({
  homeHref = `/evento/${DEFAULT_EVENT_SLUG}`,
}: {
  homeHref?: string
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-canvas-line bg-canvas/85 px-5 py-3 backdrop-blur-md sm:px-8">
      <Link
        href={homeHref}
        className="-mx-2 flex min-h-11 items-center gap-1.5 px-2 text-sm text-ink-soft transition-colors hover:text-accent-text"
      >
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
        Início
      </Link>
      <span className="h-4 w-px bg-canvas-line" aria-hidden="true" />
      <Link href={homeHref} className="flex min-h-11 items-center" aria-label="Listaae — início">
        <Logo height={26} priority />
      </Link>
    </header>
  )
}
