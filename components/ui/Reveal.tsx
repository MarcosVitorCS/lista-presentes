'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from './utils'

/**
 * Fade-in sutil quando o elemento entra na viewport (IntersectionObserver,
 * sem lib). Dispara uma vez só — não re-anima ao rolar pra cima e voltar,
 * o que ficaria repetitivo. globals.css já reduz a animação a quase-zero
 * quando prefers-reduced-motion está ativo.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
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

  return (
    <div ref={ref} className={cx(visible ? 'animate-fade-in-up' : 'opacity-0', className)}>
      {children}
    </div>
  )
}
