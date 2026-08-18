import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { GiftItemsManager } from '@/components/admin/GiftItemsManager'
import { GiftListSetup } from '@/components/admin/GiftListSetup'

export default async function AdminCasamentoPage() {
  const event = await getAdminEvent()
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('gift_lists')
    .select('id, name')
    .eq('event_id', event.id)
    .eq('type', 'quota')
    .maybeSingle()

  if (!list) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-zinc-900">Casamento</h2>
        <GiftListSetup eventId={event.id} slug="casamento" type="quota" name="Casamento" />
      </div>
    )
  }

  const { data: items } = await supabase.from('gift_items').select('*').eq('list_id', list.id).order('name')

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-zinc-900">Casamento</h2>
      <p className="text-sm text-zinc-500">
        Defina o preço por cota (obrigatório para reserva via PIX) e a quantidade total de cotas.
      </p>
      <GiftItemsManager listId={list.id} eventId={event.id} items={items ?? []} />
    </div>
  )
}
