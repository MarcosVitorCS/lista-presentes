import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Heading'
import { Progress } from '@/components/ui/Progress'
import type { FinancialStats, RsvpStats, TopItem } from '@/lib/dal/dashboard-stats'

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Nível 3: informação complementar, não a primeira coisa que o admin vê.
 * Cada bloco só aparece se tiver dado real por trás — sem reserva PIX,
 * financeiro some inteiro; sem item reservado, "mais escolhidos" some; com
 * uma ocasião só de RSVP, o breakdown por ocasião não acrescenta nada sobre
 * o que o resumo já mostrou, então também some.
 */
export function DashboardDetails({
  financial,
  topItems,
  rsvp,
}: {
  financial: FinancialStats | null
  topItems: TopItem[]
  rsvp: RsvpStats | null
}) {
  const showRsvpBreakdown = rsvp && rsvp.occasions.length > 1

  if (!financial && topItems.length === 0 && !showRsvpBreakdown) return null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {financial && (
        <Card className="flex flex-col gap-4">
          <Eyebrow>Financeiro (PIX)</Eyebrow>
          {/* Distinção visual explícita entre reserva/pendente/confirmado —
              o pedido foi claro em não misturar esses três conceitos. */}
          <dl className="flex flex-col gap-2.5 text-sm">
            <Row label="Total declarado" value={formatBRL(financial.totalDeclared)} />
            <Row label="Confirmado" value={formatBRL(financial.confirmedValue)} tone="success" />
            <Row
              label={`Pendente (${financial.pendingCount} ${financial.pendingCount === 1 ? 'reserva' : 'reservas'})`}
              value={formatBRL(financial.pendingValue)}
              tone="warning"
            />
          </dl>
        </Card>
      )}

      {topItems.length > 0 && (
        <Card className="flex flex-col gap-4">
          <Eyebrow>Presentes mais escolhidos</Eyebrow>
          <ul className="flex flex-col gap-2.5 text-sm">
            {topItems.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4">
                <span className="truncate text-ink">{item.name}</span>
                <span className="shrink-0 tabular-nums text-ink-soft">
                  {item.reserved} {item.reserved === 1 ? 'unidade' : 'unidades'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {showRsvpBreakdown && (
        <Card className="flex flex-col gap-4 lg:col-span-2">
          <Eyebrow>Confirmação de presença por ocasião</Eyebrow>
          <div className="flex flex-col gap-4">
            {rsvp!.occasions.map((occasion) => (
              <div key={occasion.occasionId} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium text-ink">{occasion.name}</span>
                  <span className="tabular-nums text-ink-soft">
                    {occasion.confirmed}/{occasion.invited} confirmados
                  </span>
                </div>
                <Progress value={occasion.pct} label={`Confirmações — ${occasion.name}`} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warning' }) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-ink'
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-canvas-line pb-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`text-right font-medium tabular-nums ${toneClass}`}>{value}</dd>
    </div>
  )
}
