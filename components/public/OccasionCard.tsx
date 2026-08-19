import { Heart, MapPin, CheckCircle2 } from 'lucide-react'
import { resolveMapsUrl } from '@/lib/maps'
import { buttonVariants } from '@/components/ui/Button'
import type { Database } from '@/types/database'

type Occasion = Database['public']['Tables']['event_occasions']['Row']

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatTime(value: string | null) {
  if (!value) return null
  return value.slice(0, 5)
}

export function OccasionCard({ occasion }: { occasion: Occasion }) {
  const mapsUrl = resolveMapsUrl(occasion.google_maps_url, occasion.address)
  const date = formatDate(occasion.occasion_date)
  const time = formatTime(occasion.occasion_time)

  return (
    // A sombra do hover agora vem do token (--shadow-float) em vez de um
    // valor arbitrário; e mt-auto no rodapé do cartão alinha os botões "Como
    // chegar" de dois cartões lado a lado mesmo com descrições de tamanhos
    // diferentes — antes cada um parava numa altura distinta.
    <div className="flex h-full flex-col gap-4 rounded-[var(--radius-lg)] border border-canvas-line bg-canvas p-6 transition-all duration-[var(--duration-hover)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-accent-strong/50 hover:shadow-float sm:p-7">
      {occasion.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage, dimensões variáveis
        <img
          src={occasion.image_url}
          alt=""
          className="h-40 w-full rounded-[var(--radius)] object-cover"
        />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent text-accent-strong">
          <Heart size={15} strokeWidth={1.6} aria-hidden="true" />
        </span>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="font-display text-display-md font-medium text-ink">{occasion.name}</h3>
        {(date || time) && (
          <p className="text-caption text-ink-soft">
            {date}
            {date && time && ' · '}
            {time}
          </p>
        )}
      </div>

      {occasion.description && (
        <p className="text-body-md text-ink-soft">{occasion.description}</p>
      )}

      {(occasion.location_name || occasion.address) && (
        <div className="flex items-start gap-2 text-caption">
          <MapPin
            size={16}
            strokeWidth={1.6}
            className="mt-0.5 shrink-0 text-accent-strong"
            aria-hidden="true"
          />
          <span className="text-ink-soft">
            {occasion.location_name}
            {occasion.location_name && occasion.address && ' — '}
            {occasion.address}
          </span>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-1">
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'line', size: 'sm', className: 'self-start' })}
          >
            Como chegar
          </a>
        )}

        {occasion.allow_rsvp && (
          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <CheckCircle2 size={14} strokeWidth={1.8} className="text-success" aria-hidden="true" />
            Confirmação de presença disponível — use o link enviado a você.
          </p>
        )}
      </div>
    </div>
  )
}
