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
 * reais só chegam depois de montado, dentro do useEffect.
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
    return <p className="font-display text-display-md text-on-deep">É hoje! Já estamos celebrando. ❤</p>
  }

  return (
    <>
      <CountdownShell
        days={String(parts.days)}
        hours={String(parts.hours).padStart(2, '0')}
        minutes={String(parts.minutes).padStart(2, '0')}
        seconds={String(parts.seconds).padStart(2, '0')}
      />
      {/*
        Os dígitos visuais são aria-hidden (um leitor de tela anunciando
        segundos que mudam a cada tick é inutilizável). Antes disso deixava o
        contador SEM nenhuma alternativa textual — quem usa leitor de tela
        simplesmente não sabia que existia uma contagem. Esta frase, atualizada
        só quando o dia muda, é a versão legível.
      */}
      <p className="sr-only">
        Faltam {parts.days} {parts.days === 1 ? 'dia' : 'dias'} para a celebração.
      </p>
    </>
  )
}

function CountdownShell({
  days,
  hours,
  minutes,
  seconds,
}: Record<'days' | 'hours' | 'minutes' | 'seconds', string>) {
  return (
    <div className="flex gap-3 sm:gap-8" aria-hidden="true">
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
    <div className="flex min-w-[2.6em] flex-col items-center gap-1.5 sm:min-w-[3.2em]">
      {/*
        font-display (serifada) em vez de font-sans bold: dígito grande em
        serifada é o que dá o tom editorial do produto — o mesmo tratamento do
        componente Stat, pra que número grande tenha uma só voz no produto.
        text-accent e não text-on-deep: o latão sobre o verde-tinta passa
        4.77:1, e é o que faz a contagem virar o ponto focal do hero em vez de
        competir com o nome do casal.
      */}
      <span
        key={value}
        className="animate-countdown-flip font-display text-4xl font-medium tabular-nums leading-none text-accent sm:text-6xl"
      >
        {value}
      </span>
      <span className="text-[0.65rem] uppercase tracking-[0.16em] text-on-deep-soft">{label}</span>
    </div>
  )
}

function Sep() {
  // O separador some no mobile: em 390px, quatro unidades + três dois-pontos
  // brigam por largura e os dígitos encolhem. O gap já separa.
  return (
    <span className="mt-1 hidden self-start text-xl text-on-deep-soft/40 sm:mt-2 sm:inline sm:text-3xl">
      :
    </span>
  )
}
