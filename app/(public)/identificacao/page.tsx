import { Suspense } from 'react'
import { IdentificacaoForm } from '@/components/public/IdentificacaoForm'

export default function IdentificacaoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <p className="text-sm uppercase tracking-widest text-zinc-500">Antes de continuar</p>
        <h1 className="text-2xl font-semibold text-zinc-900">Como podemos te chamar?</h1>
      </div>
      <Suspense fallback={null}>
        <IdentificacaoForm />
      </Suspense>
    </main>
  )
}
