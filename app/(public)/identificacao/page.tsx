import { Suspense } from 'react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { IdentificacaoForm } from '@/components/public/IdentificacaoForm'
import { Eyebrow } from '@/components/ui/Heading'

export default function IdentificacaoPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-7 px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Antes de continuar</Eyebrow>
          <h1 className="font-display text-3xl text-ink">Como podemos te chamar?</h1>
        </div>
        <Suspense fallback={null}>
          <IdentificacaoForm />
        </Suspense>
      </main>
    </>
  )
}
