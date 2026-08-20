import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { EventHome } from '@/components/public/EventHome'

/**
 * Endereço estável de UM evento — separado da home institucional da Listaae
 * (app/(public)/page.tsx). Hoje só existe /evento/rafaely-e-vitor, mas a
 * rota já é dirigida por slug: um evento novo só precisa de uma linha em
 * `events`, nenhuma mudança de código aqui.
 *
 * Nenhuma lógica própria — só resolve o slug da URL e repassa pro mesmo
 * componente que renderizava em `/` antes desta mudança (EventHome).
 */
export async function generateMetadata(props: PageProps<'/evento/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('name, description')
    .eq('slug', slug)
    .maybeSingle()

  if (!event) return {}

  return {
    title: event.name,
    description: event.description ?? undefined,
  }
}

export default async function EventoPage(props: PageProps<'/evento/[slug]'>) {
  const { slug } = await props.params
  return <EventHome slug={slug} />
}
