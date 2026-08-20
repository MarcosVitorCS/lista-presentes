import Link from 'next/link'
import {
  ArrowRight,
  Heart,
  Gift,
  PartyPopper,
  GraduationCap,
  Briefcase,
  Sparkles,
  Mail,
} from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Heading, Eyebrow } from '@/components/ui/Heading'
import { buttonVariants } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'
import { Reveal } from '@/components/ui/Reveal'
import { InstagramIcon } from '@/components/ui/SocialIcons'
import { ContactForm } from '@/components/public/ContactForm'

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

// Só perguntas sobre o que o produto já faz — nada de recurso futuro
// apresentado como se já existisse.
const FAQS = [
  {
    q: 'O que é a Listaae?',
    a: 'Uma plataforma para criar a experiência digital completa do seu evento: informações, convidados, confirmação de presença e lista de presentes, tudo em um lugar só.',
  },
  {
    q: 'Para quais tipos de eventos posso usar?',
    a: 'Casamentos, chás de cozinha, aniversários, formaturas, eventos corporativos e outras celebrações — a plataforma não é exclusiva de casamento.',
  },
  {
    q: 'Preciso instalar algum aplicativo?',
    a: 'Não. Tanto quem organiza quanto quem é convidado usam a Listaae direto do navegador, no celular ou no computador.',
  },
  {
    q: 'Meus convidados precisam criar uma conta?',
    a: 'Não. Cada convidado só informa nome e contato — sem senha, sem cadastro — para confirmar presença ou ver a lista de presentes.',
  },
  {
    q: 'Posso usar lista de presentes e confirmação de presença juntas?',
    a: 'Sim. Seu evento pode ter as duas ativadas, só uma delas, ou nenhuma — você decide o que faz sentido.',
  },
  {
    q: 'Posso personalizar meu evento?',
    a: 'Sim: nome, data, local, foto e descrição são seus. Você também pode organizar mais de um momento dentro do mesmo evento, como um chá de cozinha antes do casamento.',
  },
  {
    q: 'A Listaae funciona pelo celular?',
    a: 'Sim — a experiência foi pensada primeiro para celular, tanto para quem organiza quanto para quem é convidado.',
  },
  {
    q: 'Como funciona a confirmação de presença?',
    a: 'Cada pessoa autorizada por quem organiza recebe um link individual para confirmar presença — não é "quantos vêm", é "quem vem", nominalmente.',
  },
  {
    q: 'Como funciona a lista de presentes?',
    a: 'Convidados escolhem e reservam presentes com controle real de estoque (sem duas pessoas levando o mesmo item) ou contribuem com cotas via PIX.',
  },
  {
    q: 'Como faço para começar?',
    a: 'Preencha o formulário abaixo ou escreva para listaae.eventos@gmail.com — entramos em contato para configurar o seu evento.',
  },
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

      {/* ---------- Recursos ---------- */}
      <Section tone="canvas-alt" id="recursos">
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
      <Section tone="canvas">
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
            <div className="rounded-[var(--radius-lg)] border border-canvas-line bg-canvas-alt p-6 shadow-raise">
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

      {/* ---------- Para quem é ---------- */}
      <Section tone="canvas">
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

      {/* ---------- FAQ ---------- */}
      <Section tone="canvas-alt" id="faq">
        <SectionIntro eyebrow="Perguntas frequentes" title="Tudo o que você precisa saber antes de começar" />
        <Reveal>
          <div className="mx-auto flex max-w-[68ch] flex-col">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group border-b border-canvas-line py-4 first:pt-0 last:border-b-0"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <span className="font-sans text-sm font-semibold text-ink sm:text-body-md">
                    {faq.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-ink-soft transition-transform duration-[var(--duration-hover)] group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-body-md text-ink-soft">{faq.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ---------- CTA final: formulário de interesse comercial ---------- */}
      <Section tone="ink-deep" id="comecar" className="border-t border-on-deep-soft/15">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-8">
          <Reveal>
            <div className="flex flex-col items-center gap-3 text-center">
              <Eyebrow className="text-accent">Vamos conversar</Eyebrow>
              <Heading as="h2" size="xl" className="max-w-[20ch] text-on-deep">
                Vamos criar seu evento?
              </Heading>
              <p className="max-w-[46ch] text-body-md text-on-deep-soft">
                Conta pra gente um pouco sobre o seu evento — a gente entra em contato pra
                mostrar como a Listaae pode ajudar.
              </p>
            </div>
          </Reveal>
          <Reveal delayMs={90} className="w-full">
            <div className="w-full rounded-[var(--radius-lg)] border border-on-deep-soft/15 bg-canvas p-6 shadow-overlay sm:p-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-ink-deep py-12 text-on-deep-soft sm:py-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-5 text-center sm:px-8">
          <Logo tone="light" height={22} className="opacity-85" />
          <p className="max-w-[36ch] text-caption">
            Listaae — do convite à celebração, em um lugar só.
          </p>

          {/* Ícones de contato — mesmo tratamento visual do rodapé de
              EventHome.tsx (alvo de toque 44px, círculo visível 36px),
              replicado aqui de propósito em vez de importado: contextos
              diferentes (institucional vs. evento), sem acoplar os dois. */}
          <div className="flex items-center gap-2">
            <a
              href="https://www.instagram.com/listaae"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da Listaae"
              className="flex h-11 w-11 items-center justify-center rounded-full text-on-deep-soft transition-colors duration-[var(--duration-hover)] hover:text-accent"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-on-deep-soft/30 transition-colors duration-[var(--duration-hover)] hover:border-accent">
                <InstagramIcon size={16} strokeWidth={1.6} />
              </span>
            </a>
            <a
              href="mailto:listaae.eventos@gmail.com"
              aria-label="E-mail da Listaae"
              className="flex h-11 w-11 items-center justify-center rounded-full text-on-deep-soft transition-colors duration-[var(--duration-hover)] hover:text-accent"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-on-deep-soft/30 transition-colors duration-[var(--duration-hover)] hover:border-accent">
                <Mail size={16} strokeWidth={1.6} aria-hidden="true" />
              </span>
            </a>
          </div>

          <nav
            aria-label="Navegação do rodapé"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-caption"
          >
            <a href="#como-funciona" className="transition-colors hover:text-on-deep">
              Como funciona
            </a>
            <a href="#recursos" className="transition-colors hover:text-on-deep">
              Recursos
            </a>
            <a href="#faq" className="transition-colors hover:text-on-deep">
              Perguntas frequentes
            </a>
            <a href="#comecar" className="transition-colors hover:text-on-deep">
              Contato
            </a>
          </nav>

          <p className="text-[10px] uppercase tracking-[0.14em] text-on-deep-soft/70">
            © {new Date().getFullYear()} Listaae. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </>
  )
}
