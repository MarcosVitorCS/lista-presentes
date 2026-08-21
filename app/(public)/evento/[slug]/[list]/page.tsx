import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGuestSession } from '@/lib/dal/guest-session'
import { QuotaItemCard } from '@/components/public/QuotaItemCard'
import { GiftItemCard } from '@/components/public/GiftItemCard'
import { GiftCatalog } from '@/components/public/GiftCatalog'
import { PublicHeader } from '@/components/public/PublicHeader'
import { EmptyState } from '@/components/public/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { LIST_MAIN_CLASS } from '@/lib/ui/list-layout'

/**
 * Rota canônica de uma lista de presentes — substitui as antigas /casamento
 * e /cha-de-cozinha (que agora só redirecionam pra cá, ver
 * app/(public)/casamento/page.tsx). Resolve por slug de verdade em vez de
 * `type`, o que é o que torna isso seguro pra múltiplos eventos: duas
 * empresas/casais diferentes podem ter uma lista "cha-de-cozinha" sem
 * colidir, porque a busca é sempre event_id + slug (gift_lists tem
 * unique(event_id, slug) no banco — a mesma combinação nunca aponta pra
 * duas listas).
 *
 * Segurança por design, não por checagem extra: como o filtro de lista já
 * inclui `.eq('event_id', event.id)`, é estruturalmente impossível essa
 * query devolver uma lista de outro evento só porque o slug bate — ela
 * simplesmente não aparece no resultado, e cai no notFound() abaixo.
 */
export default async function ListaPage(props: PageProps<'/evento/[slug]/[list]'>) {
  const { slug: eventSlug, list: listSlug } = await props.params

  const guestSession = await getGuestSession()
  if (!guestSession) {
    redirect(`/identificacao?next=/evento/${eventSlug}/${listSlug}`)
  }

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, name, pix_key, pix_owner_name, pix_qr_code_url')
    .eq('slug', eventSlug)
    .maybeSingle()

  if (!event) notFound()

  const { data: list } = await supabase
    .from('gift_lists')
    .select('id, name, description, type')
    .eq('event_id', event.id)
    .eq('slug', listSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (!list) notFound()

  const { data: items } = await supabase
    .from('gift_items_public')
    .select('*')
    .eq('list_id', list.id)
    .order('name')

  const ItemCard = list.type === 'quota' ? QuotaItemCard : GiftItemCard

  return (
    <>
      <PublicHeader homeHref={`/evento/${eventSlug}`} />
      <main className={LIST_MAIN_CLASS}>
        <PageHeader eyebrow={event.name} title={list.name} description={list.description ?? undefined} />
        {list.type === 'quota' && (
          <p className="text-caption text-ink-soft">
            Presenteie com uma ou mais cotas via PIX — a plataforma não processa pagamento, apenas
            registra sua contribuição.
          </p>
        )}

        {!items?.length ? (
          <EmptyState message="A lista está sendo preparada com carinho. Volte em breve. ❤" />
        ) : (
          <GiftCatalog
            items={items}
            pix={{ key: event.pix_key, ownerName: event.pix_owner_name, qrCodeUrl: event.pix_qr_code_url }}
            ItemCard={ItemCard}
          />
        )}
      </main>
    </>
  )
}
