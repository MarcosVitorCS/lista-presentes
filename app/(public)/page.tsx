import Link from 'next/link'
import {
  ArrowRight,
  Heart,
  Gift,
  PartyPopper,
  GraduationCap,
  Briefcase,
  Sparkles,
} from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Heading, Eyebrow } from '@/components/ui/Heading'
import { buttonVariants } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Home institucional da Listaae (o produto) — não depende de nenhum evento.
 * Antes desta mudança, `/` renderizava o evento único hardcoded (ver
 * components/public/EventHome.tsx, para onde essa lógica foi movida e agora
 * vive em /evento/[slug]). Esta página não faz nenhuma query ao Supabase.
 */

const HOW_IT_WORKS = [
  { n: 'I', text: 'Crie seu evento' },
  { n: 'II', text: 'Personalize sua experiência' },
  { n: 'III', text: 'Compartilhe com seus convidados' },
  { n: 'IV', text: 'Gerencie tudo em um só lugar' },
]

const AUDIENCES = [
  { label: 'Casamentos', Icon: Heart },
  { label: 'Chás de cozinha', Icon: Gift },
  { label: 'Aniversários', Icon: PartyPopper },
  { label: 'Formaturas', Icon: GraduationCap },
  { label: 'Eventos corporativos', Icon: Briefcase },
  { label: 'Outros eventos', Icon: Sparkles },
] as const

// Só recursos que já existem de verdade no produto — nada de promessa.
const FEATURES = [
  'Página personalizada do evento',
  'Lista de presentes',
  'Reservas de presentes',
  'Pagamento/declaração via PIX',
  'Confirmação de presença',
  'Gestão de convidados',
  'Dashboard administrativo',
  'Informações de data e localização',
  'Múltiplas ocasiões dentro de um evento',
  'Experiência otimizada para celular',
]

/**
 * Eyebrow + título de seção — mesmo padrão local usado em EventHome, pra
 * manter a mesma assinatura tipográfica entre a home institucional e a
 * home de evento.
 */
function SectionIntro({
  eyebrow,
  title,
  tone = 'ink',
}: {
  eyebrow: string
  title: string
  tone?: 'ink' | 'on-deep'
}) {
  return (
    <Reveal>
      <div className="mb-10 flex max-w-[38ch] flex-col gap-2 sm:mb-14">
        <Eyebrow className={tone === 'on-deep' ? 'text-accent' : undefined}>{eyebrow}</Eyebrow>
        <Heading as="h2" className={tone === 'on-deep' ? 'text-on-deep' : undefined}>
          {title}
        </Heading>
      </div>
    </Reveal>
  )
}

// Sem "voltar" aqui — esta é a raiz do site, não uma tela dentro de um
// fluxo de evento. Header próprio, simples: marca + "Entrar" (login do
// admin, já existe e continua funcionando exatamente como hoje).
function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-canvas-line bg-canvas/85 px-5 py-3 backdrop-blur-md sm:px-8">
      <Logo height={26} priority />
      <Link
        href="/admin/login"
        className="flex min-h-11 items-center px-2 text-sm font-medium text-ink-soft transition-colors hover:text-accent-text"
      >
        Entrar
      </Link>
    </header>
  )
}

export default function HomePage() {
  return (
    <>
      <LandingHeader />

      {/* ---------- Hero ---------- */}
      <Section tone="ink-deep" rhythm="lg" className="hero-glow">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-7">
          <Eyebrow className="text-accent">A plataforma para o seu evento</Eyebrow>
          <Heading as="h1" size="xl" className="text-on-deep">
            Do convite <em className="font-normal not-italic text-on-deep-soft">à</em> celebração.
          </Heading>
          <p className="max-w-[42ch] text-balance text-body-md text-on-deep-soft sm:text-body-lg">
            Uma experiência mais simples para quem organiza e mais especial para quem participa.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <a href="#como-funciona" className={buttonVariants({ variant: 'accent' })}>
              Conheça a Listaae
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </a>
            <a href="#comecar" className={buttonVariants({ variant: 'ghost-dark' })}>
              Quero criar meu evento
            </a>
          </div>
        </div>
      </Section>

      {/* ---------- Como funciona ---------- */}
      <Section tone="canvas" id="como-funciona">
        <SectionIntro eyebrow="Como funciona" title="Da ideia ao dia da celebração" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-8">
          {HOW_IT_WORKS.map((step, i) => (
            <Reveal key={step.n} delayMs={i * 80}>
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

      {/* ---------- Para quem é ---------- */}
      <Section tone="canvas-alt">
        <SectionIntro
          eyebrow="Para quem é"
          title="Feita para começar num casamento. Pronta para qualquer celebração."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {AUDIENCES.map(({ label, Icon }, i) => (
            <Reveal key={label} delayMs={i * 60} className="h-full">
              <Card className="flex h-full flex-col items-center gap-3 py-7 text-center">
                <Icon size={22} strokeWidth={1.6} className="text-accent-strong" aria-hidden="true" />
                <span className="font-sans text-sm font-semibold text-ink">{label}</span>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------- Recursos ---------- */}
      <Section tone="canvas">
        <SectionIntro eyebrow="Recursos" title="Tudo o que um evento precisa, num lugar só" />
        <Reveal>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span
                  className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-strong"
                  aria-hidden="true"
                />
                <span className="text-body-md text-ink">{feature}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {/* ---------- Experiência do convidado ---------- */}
      <Section tone="canvas-alt">
        <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-2 sm:gap-16">
          <Reveal>
            <div className="flex max-w-[38ch] flex-col gap-4">
              <Eyebrow>Experiência do convidado</Eyebrow>
              <Heading as="h2">Ser convidado também devia ser simples.</Heading>
              <p className="text-body-md text-ink-soft">
                Um link, direto no celular. Sem senha, sem criar conta. O convidado vê a data, o
                local, confirma presença e — se quiser — escolhe um presente. Em menos de um
                minuto.
              </p>
            </div>
          </Reveal>
          <Reveal delayMs={90}>
            <div className="rounded-[var(--radius-lg)] border border-canvas-line bg-canvas p-6 shadow-raise">
              <p className="text-caption text-ink-soft">O convidado recebe um link pessoal e:</p>
              <ul className="mt-4 flex flex-col gap-3">
                {['Vê as informações do evento', 'Confirma presença', 'Escolhe um presente'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-3 border-t border-canvas-line pt-3 first:border-t-0 first:pt-0">
                      <ArrowRight size={14} strokeWidth={1.8} className="shrink-0 text-accent-strong" aria-hidden="true" />
                      <span className="text-sm text-ink">{item}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---------- Experiência do organizador ---------- */}
      <Section tone="ink-deep">
        <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-2 sm:gap-16">
          <Reveal delayMs={90} className="order-2 sm:order-1">
            <div className="rounded-[var(--radius-lg)] border border-on-deep-soft/20 bg-ink-deep-2 p-6">
              <p className="text-caption text-on-deep-soft">Em um painel só, você acompanha:</p>
              <ul className="mt-4 flex flex-col gap-3">
                {['Convidados', 'Confirmações', 'Presentes', 'Reservas', 'Informações do evento'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-3 border-t border-on-deep-soft/15 pt-3 first:border-t-0 first:pt-0">
                      <ArrowRight size={14} strokeWidth={1.8} className="shrink-0 text-accent" aria-hidden="true" />
                      <span className="text-sm text-on-deep">{item}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </Reveal>
          <Reveal className="order-1 sm:order-2">
            <div className="flex max-w-[38ch] flex-col gap-4">
              <Eyebrow className="text-accent">Experiência do organizador</Eyebrow>
              <Heading as="h2" className="text-on-deep">
                Tudo sobre o seu evento, sem planilha paralela.
              </Heading>
              <p className="text-body-md text-on-deep-soft">
                Convidados, confirmações, presentes e reservas — tudo em tempo real, num painel
                só. Sem perguntar &ldquo;quem confirmou mesmo?&rdquo; pela quinta vez na semana.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---------- CTA final ---------- */}
      <Section tone="ink-deep" id="comecar" className="border-t border-on-deep-soft/15">
        <div className="flex flex-col items-center gap-6 text-center">
          <Heading as="h2" size="xl" className="max-w-[24ch] text-on-deep">
            Seu evento merece uma experiência à altura.
          </Heading>
          <a
            href="mailto:ola@listaae.com.br"
            className={buttonVariants({ variant: 'accent', className: 'mt-2' })}
          >
            Começar com a Listaae
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </div>
      </Section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-ink-deep py-10 text-center text-on-deep-soft sm:py-12">
        <Logo tone="light" height={22} className="mx-auto opacity-85" />
        <p className="mx-auto mt-5 max-w-[36ch] text-caption">
          Listaae — do convite à celebração, em um lugar só.
        </p>
      </footer>
    </>
  )
}
