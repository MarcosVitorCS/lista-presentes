import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { GiftItemsManager } from '@/components/admin/GiftItemsManager'
import { GiftListSetup } from '@/components/admin/GiftListSetup'
import { Heading } from '@/components/ui/Heading'

export default async function AdminChaDeCozinhaPage() {
  const event = await getAdminEvent()
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('gift_lists')
    .select('id, name')
    .eq('event_id', event.id)
    .eq('type', 'physical')
    .maybeSingle()

  if (!list) {
    return (
      <div className="flex flex-col gap-4">
        <Heading as="h2" size="md">Chá de Cozinha</Heading>
        <GiftListSetup eventId={event.id} slug="cha-de-cozinha" type="physical" name="Chá de Cozinha" />
      </div>
    )
  }

  const { data: items } = await supabase.from('gift_items').select('*').eq('list_id', list.id).order('name')

  return (
    <div className="flex flex-col gap-6">
      <Heading as="h2" size="md">Chá de Cozinha</Heading>
      <GiftItemsManager listId={list.id} eventId={event.id} items={items ?? []} />
    </div>
  )
}
