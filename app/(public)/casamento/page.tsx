import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGuestSession } from '@/lib/dal/guest-session'
import { DEFAULT_EVENT_SLUG } from '@/lib/constants'
import { QuotaItemCard } from '@/components/public/QuotaItemCard'
import { PublicHeader } from '@/components/public/PublicHeader'
import { EmptyState } from '@/components/public/EmptyState'
import { Eyebrow } from '@/components/ui/Heading'

export default async function CasamentoPage() {
  const guestSession = await getGuestSession()
  if (!guestSession) {
    redirect('/identificacao?next=/casamento')
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
    .eq('type', 'quota')
    .eq('is_active', true)
    .maybeSingle()

  const { data: items } = list
    ? await supabase.from('gift_items_public').select('*').eq('list_id', list.id).order('name')
    : { data: null }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-2">
          <Eyebrow>{event.name}</Eyebrow>
          <h1 className="font-display text-4xl text-ink">Casamento</h1>
          {list?.description && <p className="text-ink-soft">{list.description}</p>}
          <p className="text-sm text-ink-soft">
            Presenteie com uma ou mais cotas via PIX — a plataforma não processa pagamento, apenas
            registra sua contribuição.
          </p>
        </div>

        {!items?.length ? (
          <EmptyState message="A lista está sendo preparada com carinho. Volte em breve. ❤" />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <QuotaItemCard
                key={item.id}
                item={item}
                pix={{ key: event.pix_key, ownerName: event.pix_owner_name, qrCodeUrl: event.pix_qr_code_url }}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
