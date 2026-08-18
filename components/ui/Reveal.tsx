'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from './utils'

/**
 * Fade-in sutil quando o elemento entra na viewport (IntersectionObserver,
 * sem lib). Dispara uma vez só — não re-anima ao rolar pra cima e voltar,
 * o que ficaria repetitivo. globals.css já reduz a animação a quase-zero
 * quando prefers-reduced-motion está ativo.
 *
 * `delayMs` permite escalonar vários Reveal próximos (ex.: cartões de uma
 * grade) pra revelarem em cascata em vez de todos de uma vez.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode
  className?: string
  delayMs?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const style: CSSProperties | undefined =
    visible && delayMs ? { animationDelay: `${delayMs}ms` } : undefined

  return (
    <div ref={ref} style={style} className={cx(visible ? 'animate-fade-in-up' : 'opacity-0', className)}>
      {children}
    </div>
  )
}
