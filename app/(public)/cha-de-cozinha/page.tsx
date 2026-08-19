import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGuestSession } from '@/lib/dal/guest-session'
import { DEFAULT_EVENT_SLUG } from '@/lib/constants'
import { GiftItemCard } from '@/components/public/GiftItemCard'
import { GiftCatalog } from '@/components/public/GiftCatalog'
import { PublicHeader } from '@/components/public/PublicHeader'
import { EmptyState } from '@/components/public/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function ChaDeCozinhaPage() {
  // "Antes de acessar as listas" o convidado precisa se identificar — não é
  // uma checagem de autorização (guest não autentica), só a regra de produto
  // de exigir nome/contato antes do acesso.
  const guestSession = await getGuestSession()
  if (!guestSession) {
    redirect('/identificacao?next=/cha-de-cozinha')
  }

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, name, pix_key, pix_owner_name, pix_qr_code_url')
    .eq('slug', DEFAULT_EVENT_SLUG)
    .maybeSingle()

  if (!event) {
    redirect('/')
  }

  const { data: list } = await supabase
    .from('gift_lists')
    .select('id, name, description')
    .eq('event_id', event.id)
    .eq('type', 'physical')
    .eq('is_active', true)
    .maybeSingle()

  const { data: items } = list
    ? await supabase.from('gift_items_public').select('*').eq('list_id', list.id).order('name')
    : { data: null }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-5 py-[var(--spacing-section)] sm:px-8">
        <PageHeader eyebrow={event.name} title="Chá de Cozinha" description={list?.description ?? undefined} />

        {!items?.length ? (
          <EmptyState message="A lista está sendo preparada com carinho. Volte em breve. ❤" />
        ) : (
          <GiftCatalog
            items={items}
            pix={{ key: event.pix_key, ownerName: event.pix_owner_name, qrCodeUrl: event.pix_qr_code_url }}
            ItemCard={GiftItemCard}
          />
        )}
      </main>
    </>
  )
}
