import { Progress } from '@/components/ui/Progress'

type DemandLevel = 'sold_out' | 'almost_gone' | 'some_reserved' | 'available'

// Nunca uma fração exata (ver migration 00008 e o comentário de
// gift_items_public): degraus fixos por bucket, não um cálculo em cima de
// um número real de reserva — o bucket em si já é o dado real, só
// deliberadamente grosseiro. "sold_out" não é renderizado aqui: os dois
// cards já têm um estado próprio de "indisponível"/"já reservado", então
// duplicar a mensagem só adicionaria ruído.
const STEPS: Record<Exclude<DemandLevel, 'sold_out'>, { value: number; message: string } | null> = {
  available: null,
  some_reserved: { value: 40, message: 'Sendo escolhido agora' },
  almost_gone: { value: 85, message: 'Última unidade disponível' },
}

export function ReservationProgress({ demandLevel }: { demandLevel: DemandLevel }) {
  if (demandLevel === 'sold_out') return null

  const step = STEPS[demandLevel]
  if (!step) return null

  return (
    <div className="flex flex-col gap-1">
      <Progress value={step.value} label={step.message} valueText={step.message} />
      <p className="text-[11px] text-ink-soft">{step.message}</p>
    </div>
  )
}
