import { Gift, Heart, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_EVENT_SLUG } from '@/lib/constants'
import { Section } from '@/components/ui/Section'
import { Heading, Eyebrow } from '@/components/ui/Heading'
import { buttonVariants } from '@/components/ui/Button'
import { Countdown } from '@/components/public/Countdown'
import { OccasionCard } from '@/components/public/OccasionCard'
import { Reveal } from '@/components/ui/Reveal'
import { InstagramIcon, FacebookIcon, YoutubeIcon, WhatsappIcon } from '@/components/ui/SocialIcons'

const SOCIAL_LINKS = [
  { key: 'instagram_url', label: 'Instagram', Icon: InstagramIcon },
  { key: 'facebook_url', label: 'Facebook', Icon: FacebookIcon },
  { key: 'youtube_url', label: 'YouTube', Icon: YoutubeIcon },
  { key: 'whatsapp_url', label: 'WhatsApp', Icon: WhatsappIcon },
] as const

const STEPS = [
  { n: 'I', text: 'Escolha um presente' },
  { n: 'II', text: 'Informe seus dados' },
  { n: 'III', text: 'Reserve o presente' },
  { n: 'IV', text: 'Pronto ❤' },
]

export default async function HomePage() {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select(
      'id, name, event_date, description, image_url, hero_label, instagram_url, facebook_url, youtube_url, whatsapp_url'
    )
    .eq('slug', DEFAULT_EVENT_SLUG)
    .maybeSingle()

  if (!event) {
    return (
      <Section tone="canvas" className="flex-1">
        <p className="text-ink-soft">Evento não encontrado.</p>
      </Section>
    )
  }

  const [{ data: occasions }, { data: giftLists }] = await Promise.all([
    supabase
      .from('event_occasions')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('gift_lists')
      .select('id, slug, type, name, description')
      .eq('event_id', event.id)
      .eq('is_active', true),
  ])

  const listsWithCounts = await Promise.all(
    (giftLists ?? []).map(async (list) => {
      const { count } = await supabase
        .from('gift_items_public')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', list.id)
      return { ...list, count: count ?? 0 }
    })
  )

  const formattedDate = event.event_date
    ? new Date(`${event.event_date}T00:00:00`)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .split('/')
    : null

  return (
    <>
      {/* ---------- Hero ---------- */}
      <Section tone="ink-deep" className="hero-glow py-20 sm:py-32">
        <div className="flex flex-col items-center gap-7 text-center">
          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage, dimensão fixa via CSS
            <img
              src={event.image_url}
              alt={event.name}
              className="h-28 w-28 rounded-full border-2 border-accent object-cover sm:h-32 sm:w-32"
            />
          )}
          <Eyebrow className="text-accent">{event.hero_label}</Eyebrow>
          <Heading as="h1" size="xl" className="text-on-deep">
            {event.name.split(' & ').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <em className="px-1 font-normal not-italic text-on-deep-soft">&amp;</em>}
              </span>
            ))}
          </Heading>
          <p className="max-w-[34ch] text-balance text-base text-on-deep-soft sm:text-lg">
            {event.description || 'Estamos contando os dias para viver esse momento com você.'}
          </p>

          {formattedDate && (
            <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.06em] text-on-deep">
              <span>{formattedDate[0]}</span>
              <span className="h-1 w-1 rounded-full bg-accent" />
              <span>{formattedDate[1]}</span>
              <span className="h-1 w-1 rounded-full bg-accent" />
              <span>{formattedDate[2]}</span>
            </div>
          )}

          {event.event_date && (
            <div className="mt-1">
              <Countdown targetDate={`${event.event_date}T00:00:00`} />
            </div>
          )}

          {listsWithCounts.length > 0 && (
            <a
              href="#lista-de-presentes"
              className={buttonVariants({ variant: 'ghost-dark', className: 'mt-3' })}
            >
              Ver a lista de presentes
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </a>
          )}
        </div>
      </Section>

      {/* ---------- RSVP (só se ALGUMA ocasião tiver ativado) ---------- */}
      {occasions?.some((o) => o.allow_rsvp) && (
        <div className="border-b border-canvas-line bg-canvas-alt px-5 py-4 text-center text-sm text-ink-soft sm:px-8">
          Convidado? Você recebeu um link individual de confirmação de presença pelo WhatsApp ou
          e-mail — é só abrir esse link pra confirmar.
        </div>
      )}

      {/* ---------- Nossos Momentos ---------- */}
      {occasions && occasions.length > 0 && (
        <Section tone="canvas">
          <Reveal>
            <div className="mb-10 flex flex-col gap-2 sm:mb-14">
              <Eyebrow>Nossos momentos</Eyebrow>
              <Heading as="h2">Dois encontros, um só motivo</Heading>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {occasions.map((occasion, i) => (
              <Reveal key={occasion.id} delayMs={i * 90}>
                <OccasionCard occasion={occasion} />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ---------- Lista de presentes ---------- */}
      {listsWithCounts.length > 0 && (
        <Section tone="canvas-alt" id="lista-de-presentes">
          <Reveal>
            <div className="mb-10 flex flex-col gap-2 sm:mb-14">
              <Eyebrow>Lista de presentes</Eyebrow>
              <Heading as="h2">Escolha uma lista</Heading>
            </div>
          </Reveal>
          <Reveal delayMs={90} className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-canvas-line">
            {listsWithCounts.map((list, i) => {
              const href = list.type === 'quota' ? '/casamento' : '/cha-de-cozinha'
              const Icon = list.type === 'quota' ? Heart : Gift
              return (
                <a
                  key={list.id}
                  href={href}
                  className={`group flex items-center gap-4 bg-canvas px-5 py-5 transition-colors hover:bg-canvas-alt sm:px-7 ${i > 0 ? 'border-t border-canvas-line' : ''}`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas-alt text-accent-strong transition-transform duration-300 group-hover:scale-110">
                    <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-sans text-base font-semibold text-ink">{list.name}</span>
                    {list.description && (
                      <span className="mt-0.5 block text-sm text-ink-soft">{list.description}</span>
                    )}
                  </span>
                  <span className="hidden shrink-0 text-xs text-ink-soft sm:inline">
                    {list.count} {list.count === 1 ? 'item' : 'itens'}
                  </span>
                  <ArrowRight
                    size={16}
                    strokeWidth={1.8}
                    className="shrink-0 text-accent-strong transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </a>
              )
            })}
          </Reveal>
        </Section>
      )}

      {/* ---------- Como funciona ---------- */}
      <Section tone="canvas">
        <Reveal>
          <div className="mb-10 flex flex-col gap-2 sm:mb-14">
            <Eyebrow>Como funciona</Eyebrow>
            <Heading as="h2">Quatro passos, sem complicação</Heading>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delayMs={i * 80}>
              <span className="font-display text-2xl italic text-accent-strong">{step.n}.</span>
              <p className="mt-1.5 text-sm text-ink-soft">{step.text}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-ink-deep py-14 text-center text-on-deep-soft">
        <p className="font-display text-2xl italic text-on-deep">{event.name}</p>
        {formattedDate && (
          <p className="mt-1.5 text-xs tracking-[0.14em]">{formattedDate.join(' · ')}</p>
        )}
        <p className="mx-auto mt-5 max-w-[30ch] text-sm">Obrigado por fazer parte desse momento.</p>

        {SOCIAL_LINKS.some(({ key }) => event[key]) && (
          <div className="mt-6 flex items-center justify-center gap-4">
            {SOCIAL_LINKS.map(({ key, label, Icon }) => {
              const url = event[key]
              if (!url) return null
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-on-deep-soft/30 text-on-deep-soft transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon size={16} strokeWidth={1.6} />
                </a>
              )
            })}
          </div>
        )}
      </footer>
    </>
  )
}
