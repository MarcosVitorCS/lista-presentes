import { Heart, MapPin } from 'lucide-react'
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
    <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-canvas-line bg-canvas p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-strong/50 hover:shadow-[0_8px_24px_-12px_rgba(30,50,41,0.25)]">
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

      <div>
        <h3 className="font-display text-2xl font-medium text-ink">{occasion.name}</h3>
        {(date || time) && (
          <p className="mt-1 text-sm text-ink-soft">
            {date}
            {date && time && ' · '}
            {time}
          </p>
        )}
      </div>

      {occasion.description && <p className="text-sm text-ink-soft">{occasion.description}</p>}

      {(occasion.location_name || occasion.address) && (
        <div className="flex items-start gap-2 text-sm">
          <MapPin size={16} strokeWidth={1.6} className="mt-0.5 shrink-0 text-accent-strong" aria-hidden="true" />
          <span className="text-ink-soft">
            {occasion.location_name}
            {occasion.location_name && occasion.address && ' — '}
            {occasion.address}
          </span>
        </div>
      )}

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
    </div>
  )
}
