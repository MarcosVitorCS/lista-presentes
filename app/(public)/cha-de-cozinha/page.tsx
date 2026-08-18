import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGuestSession } from '@/lib/dal/guest-session'
import { DEFAULT_EVENT_SLUG } from '@/lib/constants'
import { GiftItemCard } from '@/components/public/GiftItemCard'

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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-widest text-zinc-500">{event.name}</p>
        <h1 className="text-3xl font-semibold text-zinc-900">Chá de Cozinha</h1>
        {list?.description && <p className="text-zinc-600">{list.description}</p>}
      </div>

      {!items?.length ? (
        <p className="text-zinc-500">Nenhum item disponível no momento.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <GiftItemCard
              key={item.id}
              item={item}
              pix={{ key: event.pix_key, ownerName: event.pix_owner_name, qrCodeUrl: event.pix_qr_code_url }}
            />
          ))}
        </div>
      )}
    </main>
  )
}
