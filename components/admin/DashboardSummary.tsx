import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Stat } from '@/components/ui/Stat'
import type { EventTiming, GiftStats, RsvpStats } from '@/lib/dal/dashboard-stats'

/**
 * Nível 1 (saudação + contagem regressiva) e nível 2 (poucos destaques +
 * andamento + insights) do dashboard executivo. Nível 3 (financeiro, top
 * itens, RSVP por ocasião) vive em DashboardDetails — mantido separado pra
 * este componente continuar respondendo só "como está o meu evento?" sem
 * virar uma parede de cards.
 */
export function DashboardSummary({
  eventName,
  timing,
  gift,
  rsvp,
  pendingPixCount,
}: {
  eventName: string
  timing: EventTiming | null
  gift: GiftStats
  rsvp: RsvpStats | null
  pendingPixCount: number
}) {
  // Cada insight só existe quando o dado por trás faz sentido de mostrar —
  // nunca uma mensagem genérica só pra preencher espaço.
  const insights: string[] = []
  if (pendingPixCount > 0) {
    insights.push(
      `Você ${pendingPixCount === 1 ? 'tem 1 pagamento PIX aguardando' : `tem ${pendingPixCount} pagamentos PIX aguardando`} confirmação.`
    )
  }
  if (rsvp && rsvp.totalInvited > 0 && rsvp.totalPending > 0) {
    const pctPending = Math.round((rsvp.totalPending / rsvp.totalInvited) * 100)
    insights.push(`${pctPending}% dos convidados ainda não responderam.`)
  }
  const hottestList = gift.byList
    .filter((list) => list.total > 0 && list.pct < 100)
    .sort((a, b) => b.pct - a.pct)[0]
  if (hottestList && hottestList.pct >= 40) {
    insights.push(`A lista ${hottestList.name} está ${hottestList.pct}% reservada.`)
  }
  if (timing && timing.daysRemaining >= 0) {
    insights.push(
      timing.daysRemaining === 0
        ? 'É hoje!'
        : `Faltam ${timing.daysRemaining} ${timing.daysRemaining === 1 ? 'dia' : 'dias'} para ${timing.label === 'evento' ? 'o evento' : timing.label}.`
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-caption text-ink-soft">Olá! Aqui está a situação de</p>
        <h2 className="font-display text-display-md text-ink-deep">{eventName}</h2>
      </div>

      <Card elevation="raise" className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Presentes escolhidos" value={`${gift.reservedPct}%`} />
          <Stat label="Reservas pendentes" value={pendingPixCount} tone={pendingPixCount > 0 ? 'warning' : 'ink'} />
          {rsvp ? (
            <>
              <Stat label="Confirmações RSVP" value={`${rsvp.pct}%`} tone="success" />
              <Stat label="Pessoas confirmadas" value={rsvp.totalPeopleConfirmed} tone="success" />
            </>
          ) : (
            <Stat label="Disponíveis" value={gift.availableUnits} className="col-span-2" />
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-canvas-line pt-5">
          <Progress value={gift.reservedPct} label="Presentes reservados no geral" />
          {rsvp && <Progress value={rsvp.pct} label="Confirmações de presença" />}
        </div>

        {insights.length > 0 && (
          <ul className="flex flex-col gap-2 border-t border-canvas-line pt-5 text-sm text-ink-soft">
            {insights.map((insight) => (
              <li key={insight} className="flex items-baseline gap-2">
                <span className="text-accent-strong" aria-hidden="true">
                  ·
                </span>
                {insight}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
