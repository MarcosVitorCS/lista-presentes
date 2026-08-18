// lucide-react não inclui ícones de marca (Instagram, Facebook, YouTube,
// WhatsApp etc. foram removidos da lib por questão de trademark). Em vez de
// adicionar uma dependência só pra isso, desenhamos versões mínimas no
// mesmo estilo "line icon" do resto do app (stroke, sem fill, cantos
// arredondados) pra não destoarem visualmente dos ícones do lucide.

type IconProps = {
  size?: number
  strokeWidth?: number
  className?: string
}

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export function InstagramIcon({ size = 18, strokeWidth = 1.6, className }: IconProps) {
  return (
    <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function FacebookIcon({ size = 18, strokeWidth = 1.6, className }: IconProps) {
  return (
    <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base}>
      <path d="M15 4h-2.2C10.7 4 9.5 5.3 9.5 7.4V10H7v3.4h2.5V21h3.2v-7.6h2.4l.4-3.4h-2.8V7.7c0-.9.4-1.4 1.4-1.4H15V4Z" />
    </svg>
  )
}

export function YoutubeIcon({ size = 18, strokeWidth = 1.6, className }: IconProps) {
  return (
    <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base}>
      <rect x="2.5" y="6" width="19" height="12" rx="4" />
      <path d="M10.5 9.7v4.6L14.7 12l-4.2-2.3Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function WhatsappIcon({ size = 18, strokeWidth = 1.6, className }: IconProps) {
  return (
    <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base}>
      <path d="M7 20.5 8.2 16.7A8 8 0 1 1 11.6 19.1L7 20.5Z" />
      <path d="M9.3 9.4c.1-.6.6-.6 1-.6.3 0 .5 0 .7.5.2.5.7 1.6.7 1.7.1.1.1.3 0 .4-.1.2-.2.3-.3.5-.1.1-.3.3-.1.6.2.3.8 1.2 1.7 1.9 1.2.9 2.1 1.2 2.4 1.3.3.1.4.1.6-.1.2-.2.7-.8.9-1 .2-.2.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.4 0 .2 0 .9-.4 1.4-.4.5-1.3.9-1.9.9-.6 0-1.8-.2-3.6-1.4-2.2-1.4-3.4-3.1-3.6-3.5-.2-.4-1.1-1.6-1-2.7Z" />
    </svg>
  )
}
