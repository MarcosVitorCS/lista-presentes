import { Suspense } from 'react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { IdentificacaoForm } from '@/components/public/IdentificacaoForm'
import { Eyebrow, Heading } from '@/components/ui/Heading'

export default function IdentificacaoPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-7 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Antes de continuar</Eyebrow>
          <Heading as="h1" size="lg">
            Como podemos te chamar?
          </Heading>
        </div>
        <Suspense fallback={null}>
          <IdentificacaoForm />
        </Suspense>
      </main>
    </>
  )
}
