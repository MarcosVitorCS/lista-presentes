'use client'

import { useEffect, useState } from 'react'

type Parts = { days: number; hours: number; minutes: number; seconds: number }

function diffParts(targetMs: number, nowMs: number): Parts | null {
  const diff = targetMs - nowMs
  if (diff <= 0) return null
  const seconds = Math.floor(diff / 1000) % 60
  const minutes = Math.floor(diff / (1000 * 60)) % 60
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return { days, hours, minutes, seconds }
}

/**
 * SSR-safe: o primeiro render (servidor e cliente) mostra sempre o mesmo
 * placeholder ("—"), então nunca há divergência de hydration. Os valores
 * reais só chegam depois de montado, dentro do useEffect — é o padrão
 * recomendado pra qualquer widget que depende de `Date.now()`.
 */
export function Countdown({ targetDate }: { targetDate: string }) {
  const [parts, setParts] = useState<Parts | null | undefined>(undefined)

  useEffect(() => {
    const target = new Date(targetDate).getTime()
    const tick = () => setParts(diffParts(target, Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (parts === undefined) {
    return <CountdownShell days="—" hours="—" minutes="—" seconds="—" />
  }

  if (parts === null) {
    return <p className="font-display text-2xl text-on-deep">É hoje! Já estamos celebrando. ❤</p>
  }

  return (
    <CountdownShell
      days={String(parts.days)}
      hours={String(parts.hours).padStart(2, '0')}
      minutes={String(parts.minutes).padStart(2, '0')}
      seconds={String(parts.seconds).padStart(2, '0')}
    />
  )
}

function CountdownShell({
  days,
  hours,
  minutes,
  seconds,
}: Record<'days' | 'hours' | 'minutes' | 'seconds', string>) {
  return (
    <div className="flex gap-4 sm:gap-8" aria-hidden="true">
      <Unit value={days} label="Dias" />
      <Sep />
      <Unit value={hours} label="Horas" />
      <Sep />
      <Unit value={minutes} label="Min" />
      <Sep />
      <Unit value={seconds} label="Seg" />
    </div>
  )
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-[3.2em] flex-col items-center gap-1.5">
      <span
        key={value}
        className="animate-countdown-flip font-sans text-3xl font-bold tabular-nums text-on-deep sm:text-5xl"
      >
        {value}
      </span>
      <span className="text-[0.65rem] uppercase tracking-[0.16em] text-on-deep-soft">{label}</span>
    </div>
  )
}

function Sep() {
  return <span className="mt-1 self-start text-xl text-on-deep-soft/50 sm:mt-2 sm:text-3xl">:</span>
}
