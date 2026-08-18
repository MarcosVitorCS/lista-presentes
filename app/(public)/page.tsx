import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_EVENT_SLUG } from '@/lib/constants'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('name, event_date')
    .eq('slug', DEFAULT_EVENT_SLUG)
    .maybeSingle()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col gap-4">
        <p className="text-sm uppercase tracking-widest text-zinc-500">Lista de presentes</p>
        <h1 className="text-3xl font-semibold text-zinc-900 sm:text-4xl">
          {event?.name ?? 'Rafaely & Vitor'}
        </h1>
        <p className="text-zinc-600">Escolha uma das listas para ver os presentes disponíveis.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/cha-de-cozinha"
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Chá de Cozinha
        </Link>
        <Link
          href="/casamento"
          className="rounded-md border border-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-900 transition-opacity hover:opacity-90"
        >
          Casamento
        </Link>
      </div>
    </main>
  )
}
