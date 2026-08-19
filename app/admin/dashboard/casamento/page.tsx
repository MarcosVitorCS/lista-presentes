import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { GiftItemsManager } from '@/components/admin/GiftItemsManager'
import { GiftListSetup } from '@/components/admin/GiftListSetup'
import { PageHeader } from '@/components/ui/PageHeader'

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
      <div className="flex flex-col gap-6">
        <PageHeader
          titleAs="h2"
          eyebrow="Lista de presentes"
          title="Casamento"
          description="A lista ainda não existe. Crie para começar a cadastrar itens."
        />
        <GiftListSetup eventId={event.id} slug="casamento" type="quota" name="Casamento" />
      </div>
    )
  }

  const { data: items } = await supabase.from('gift_items').select('*').eq('list_id', list.id).order('name')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titleAs="h2"
        eyebrow="Lista de presentes"
        title="Casamento"
        description="Defina o preço por cota (obrigatório para reserva via PIX) e a quantidade total de cotas."
      />
      <GiftItemsManager listId={list.id} eventId={event.id} items={items ?? []} />
    </div>
  )
}
