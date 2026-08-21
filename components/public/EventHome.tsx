import { Gift, Heart, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Section } from '@/components/ui/Section'
import { Heading, Eyebrow } from '@/components/ui/Heading'
import { buttonVariants } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
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

/**
 * Eyebrow + título de seção. Aparecia três vezes nesta página, cada vez com o
 * mesmo bloco copiado — e por isso com margem inferior propensa a divergir.
 * Local ao arquivo de propósito: é composição de página, não peça de kit.
 */
function SectionIntro({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <Reveal>
      <div className="mb-10 flex max-w-[34ch] flex-col gap-2 sm:mb-14">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading as="h2">{title}</Heading>
      </div>
    </Reveal>
  )
}

/**
 * Home de UM evento específico — movida de app/(public)/page.tsx (que hoje
 * virou a landing institucional da Listaae) para cá, parametrizada por slug
 * em vez de importar DEFAULT_EVENT_SLUG direto. Nenhuma query, nenhum JSX e
 * nenhum comentário mudou de comportamento nessa extração — só o parâmetro.
 *
 * Usada por app/(public)/evento/[slug]/page.tsx.
 */
export async function EventHome({ slug }: { slug: string }) {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select(
      'id, name, event_date, description, image_url, hero_label, instagram_url, facebook_url, youtube_url, whatsapp_url'
    )
    .eq('slug', slug)
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
      {/* ---------- Marca da plataforma ---------- */}
      {/* A home não tem PublicHeader (o hero é o topo), então a marca entra
          numa faixa própria em cima do verde-tinta — discreta, sem competir
          com o retrato e os nomes do casal, que são o assunto da página. */}
      <div className="flex items-center justify-center bg-ink-deep px-5 pt-4 sm:pt-5">
        <Logo tone="light" height={22} priority className="opacity-85" />
      </div>

      {/* ---------- Hero ---------- */}
      {/*
        Hierarquia do hero, de cima pra baixo (empilhado, <lg): retrato →
        ocasião → nomes → frase → data → contagem → ação. A partir de lg, com
        foto, a composição vira duas colunas assimétricas (texto à esquerda,
        foto grande à direita) — mesmo breakpoint usado no catálogo (item 1
        desta rodada) pro mesmo raciocínio: abaixo de lg o bloco de texto
        (heading com "&" decorativo, eyebrow, descrição, data, countdown)
        precisa da largura cheia pra não espremer contra a foto. Sem foto,
        colapsa pro layout 100% texto de sempre — nunca reserva vão vazio.
        O halo (.hero-glow, ancorado em 82% -10% no CSS) já cai perto de onde
        a foto fica nessa composição, não precisa reposicionar nada.
      */}
      <Section tone="ink-deep" rhythm="lg" className="hero-glow">
        <div
          className={`flex flex-col items-center gap-7 text-center sm:gap-8 ${
            event.image_url ? 'lg:flex-row lg:items-center lg:gap-14 lg:text-left' : ''
          }`}
        >
          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage; fetchPriority/loading explícitos porque é a imagem LCP da página
            <img
              src={event.image_url}
              alt={event.name}
              fetchPriority="high"
              loading="eager"
              className="h-36 w-36 shrink-0 rounded-full border-2 border-accent object-cover shadow-overlay sm:h-40 sm:w-40 lg:order-2 lg:h-auto lg:w-[42%] lg:max-w-none lg:aspect-[3/4] lg:rounded-[var(--radius-lg)] lg:border lg:border-accent/40"
            />
          )}

          <div
            className={`flex flex-col items-center gap-7 text-center sm:gap-8 ${
              event.image_url ? 'lg:order-1 lg:flex-1 lg:items-start lg:text-left' : ''
            }`}
          >
            <Eyebrow className="text-accent">{event.hero_label}</Eyebrow>
            <Heading as="h1" size="xl" className="text-on-deep">
              {event.name.split(' & ').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <em className="px-1 font-normal not-italic text-on-deep-soft">&amp;</em>
                  )}
                </span>
              ))}
            </Heading>
            <p className="max-w-[34ch] text-balance text-body-md text-on-deep-soft sm:text-body-lg">
              {event.description || 'Estamos contando os dias para viver esse momento com você.'}
            </p>

            {formattedDate && (
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-on-deep-soft">
                <span>{formattedDate[0]}</span>
                <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
                <span>{formattedDate[1]}</span>
                <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
                <span>{formattedDate[2]}</span>
              </div>
            )}

            {event.event_date && (
              <div className="mt-2">
                <Countdown targetDate={`${event.event_date}T00:00:00`} />
              </div>
            )}

            {listsWithCounts.length > 0 && (
              <a
                href="#lista-de-presentes"
                className={buttonVariants({ variant: 'ghost-dark', className: 'mt-4' })}
              >
                Ver a lista de presentes
                <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* ---------- RSVP (só se ALGUMA ocasião tiver ativado) ---------- */}
      {occasions?.some((o) => o.allow_rsvp) && (
        <div className="border-b border-canvas-line bg-canvas-alt px-5 py-4 text-center text-caption text-ink-soft sm:px-8">
          <p className="mx-auto max-w-[62ch]">
            Convidado? Você recebeu um link individual de confirmação de presença pelo WhatsApp ou
            e-mail — é só abrir esse link pra confirmar.
          </p>
        </div>
      )}

      {/* ---------- Nossos Momentos ---------- */}
      {occasions && occasions.length > 0 && (
        <Section tone="canvas">
          <SectionIntro eyebrow="Nossos momentos" title="Dois encontros, um só motivo" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {occasions.map((occasion, i) => (
              <Reveal key={occasion.id} delayMs={i * 90} className="h-full">
                <OccasionCard occasion={occasion} />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ---------- Lista de presentes ---------- */}
      {listsWithCounts.length > 0 && (
        <Section tone="canvas-alt" id="lista-de-presentes">
          <SectionIntro eyebrow="Lista de presentes" title="Escolha uma lista" />
          <Reveal
            delayMs={90}
            className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-canvas-line"
          >
            {listsWithCounts.map((list, i) => {
              // /evento/[slug]/[list-slug]: preserva o contexto do evento na
              // URL, o que é o que torna isso seguro pra múltiplos eventos
              // (duas listas "cha-de-cozinha" de eventos diferentes não
              // colidem — ver app/(public)/evento/[slug]/[list]/page.tsx).
              const href = `/evento/${slug}/${list.slug}`
              const Icon = list.type === 'quota' ? Heart : Gift
              return (
                <a
                  key={list.id}
                  href={href}
                  className={`group flex min-h-16 items-center gap-4 bg-canvas px-5 py-5 transition-colors duration-[var(--duration-hover)] hover:bg-canvas-alt sm:px-7 ${i > 0 ? 'border-t border-canvas-line' : ''}`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas-alt text-accent-strong transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-110">
                    <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-sans text-body-md font-semibold text-ink">
                      {list.name}
                    </span>
                    {list.description && (
                      <span className="mt-0.5 block text-caption text-ink-soft">
                        {list.description}
                      </span>
                    )}
                  </span>
                  {/*
                    A contagem de itens aparece a partir de sm. No mobile ela
                    era a primeira coisa a comprimir o nome da lista — e é a
                    informação menos decisiva da linha.
                  */}
                  <span className="hidden shrink-0 text-xs text-ink-soft sm:inline">
                    {list.count} {list.count === 1 ? 'item' : 'itens'}
                  </span>
                  <ArrowRight
                    size={16}
                    strokeWidth={1.8}
                    className="shrink-0 text-accent-strong transition-transform duration-[var(--duration-hover)] ease-[var(--ease-out)] group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </a>
              )
            })}
          </Reveal>
        </Section>
      )}

      {/* ---------- Como funciona ---------- */}
      <Section tone="canvas" rhythm="tight">
        <SectionIntro eyebrow="Como funciona" title="Quatro passos, sem complicação" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-8">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delayMs={i * 80}>
              {/* O numeral vira borda inferior de latão: dá um marcador de
                  passo sem gastar um ícone ou um cartão por item. */}
              <span className="font-display text-display-md italic text-accent-strong">
                {step.n}.
              </span>
              <p className="mt-1.5 border-t border-canvas-line pt-3 text-caption text-ink-soft">
                {step.text}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-ink-deep py-14 text-center text-on-deep-soft sm:py-16">
        <p className="font-display text-display-md italic text-on-deep">{event.name}</p>
        {formattedDate && (
          <p className="mt-1.5 text-xs tracking-[0.14em]">{formattedDate.join(' · ')}</p>
        )}
        <p className="mx-auto mt-5 max-w-[30ch] text-caption">
          Obrigado por fazer parte desse momento.
        </p>

        {/* Assinatura da plataforma: o rodapé é onde a marca pode aparecer
            por extenso sem disputar atenção com o evento. */}
        <div className="mx-auto mt-10 flex max-w-[280px] flex-col items-center gap-2.5 border-t border-on-deep-soft/25 pt-6">
          <span className="text-[10px] uppercase tracking-[0.18em] text-on-deep-soft/75">
            Lista de presentes feita no
          </span>
          <Logo tone="light" height={24} className="opacity-90" />
        </div>

        {SOCIAL_LINKS.some(({ key }) => event[key]) && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {SOCIAL_LINKS.map(({ key, label, Icon }) => {
              const url = event[key]
              if (!url) return null
              return (
                // h-11 w-11 (44px) em vez de h-9 w-9: são os alvos de toque
                // mais apertados da página pública. O círculo visível continua
                // menor — cresce a área, não o desenho.
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-on-deep-soft transition-colors duration-[var(--duration-hover)] hover:text-accent"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-on-deep-soft/30 transition-colors duration-[var(--duration-hover)] hover:border-accent">
                    <Icon size={16} strokeWidth={1.6} />
                  </span>
                </a>
              )
            })}
          </div>
        )}
      </footer>
    </>
  )
}
