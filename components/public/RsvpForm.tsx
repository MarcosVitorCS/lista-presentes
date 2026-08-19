'use client'

import { useActionState, useState } from 'react'
import { submitRsvp } from '@/app/actions/rsvp'
import { Button } from '@/components/ui/Button'
import type { PartyMemberJson } from '@/types/database'

function joinNames(names: string[]) {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}

export function RsvpForm({ token, partyMembers }: { token: string; partyMembers: PartyMemberJson[] }) {
  const [state, action, pending] = useActionState(submitRsvp, undefined)
  const [editing, setEditing] = useState(false)
  const [lastHandledState, setLastHandledState] = useState(state)

  // "Ajustar estado durante o render" (não é useEffect — roda de forma
  // síncrona antes do paint, sem cascata de re-render): toda vez que uma
  // submissão nova termina, sai do modo de edição automaticamente. Sem isso,
  // "editing" ficaria travado true pra sempre depois do primeiro "Alterar
  // resposta". Resetar via onClick no botão de envio causava uma corrida real:
  // o clique disparava setEditing(false) e um re-render síncrono ANTES do
  // navegador capturar os checkboxes marcados pro FormData.
  if (state !== lastHandledState) {
    setLastHandledState(state)
    if (state?.success) setEditing(false)
  }

  const effectiveMembers = state?.success && state.partyMembers ? state.partyMembers : partyMembers
  const fresh = effectiveMembers.every((m) => m.status === 'pending')
  const responded = (state?.success === true || !fresh) && !editing

  function startEditing() {
    setEditing(true)
  }

  if (responded) {
    const confirmedNames = effectiveMembers.filter((m) => m.status === 'confirmed').map((m) => m.name)

    return (
      // role="status": depois do envio, a resposta registrada é a única coisa
      // que muda na tela — sem isso, quem usa leitor de tela não recebia
      // nenhuma confirmação de que a ação deu certo.
      <div
        role="status"
        className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-canvas-line bg-canvas p-6 text-center shadow-raise"
      >
        {confirmedNames.length > 0 ? (
          <>
            <p className="font-display text-display-md text-ink">Presença confirmada! ❤️</p>
            <p className="text-body-md text-ink-soft">
              {joinNames(confirmedNames)} {confirmedNames.length === 1 ? 'estará' : 'estarão'} conosco.
            </p>
            <p className="text-caption text-ink-soft">
              Será uma alegria celebrar esse momento com vocês!
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-display-md text-ink">Tudo bem! ❤</p>
            <p className="text-body-md text-ink-soft">
              Registramos que vocês não poderão comparecer. Se mudar de ideia, é só voltar aqui.
            </p>
          </>
        )}
        <button
          type="button"
          onClick={startEditing}
          className="mx-auto flex min-h-11 items-center px-2 text-sm text-accent-text underline underline-offset-2"
        >
          Alterar resposta
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <fieldset className="flex flex-col gap-2 border-0 p-0">
          {/* fieldset + legend: os nomes eram um <p> solto acima de checkboxes
              soltos, então o leitor de tela anunciava "caixa de seleção,
              Rafaely" sem nunca dizer a pergunta. */}
          <legend className="mb-2 text-caption text-ink-soft">Quem estará presente?</legend>
          {effectiveMembers.map((member) => (
            // has-[:checked] e has-[:focus-visible]: o estado selecionado era
            // comunicado só pelo quadradinho nativo de 20px. Agora a linha
            // inteira responde — borda de latão e fundo de papel — e o foco por
            // teclado é visível na linha, não só no input.
            <label
              key={member.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-canvas-line bg-canvas px-4 py-3 text-sm text-ink transition-colors duration-[var(--duration-hover)] hover:border-accent-strong has-[:checked]:border-accent-strong has-[:checked]:bg-canvas-alt has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
            >
              <input
                type="checkbox"
                name="confirmedMemberId"
                value={member.id}
                defaultChecked={fresh ? member.is_primary : member.status === 'confirmed'}
                className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
              />
              <span>
                {member.name}
                {member.is_primary && <span className="text-ink-soft"> (você)</span>}
              </span>
            </label>
          ))}
        </fieldset>
        <Button type="submit" variant="accent" loading={pending}>
          Confirmar presença
        </Button>
      </form>

      {/*
        Recusar não é uma segunda ação primária. Antes eram dois botões de
        largura cheia empilhados, com peso visual parecido — a hierarquia
        ficava ambígua justamente no momento da decisão. Agora vem depois de um
        divisor, com rótulo de baixa hierarquia, e continua igualmente fácil de
        achar (não escondido atrás de outro passo).
      */}
      <form action={action} className="flex flex-col items-center gap-2 border-t border-canvas-line pt-5">
        <input type="hidden" name="token" value={token} />
        {/* Sem checkboxes neste form — confirmedMemberId sempre vem vazio,
            o que a RPC trata como "ninguém confirmado" (recusa). */}
        <Button type="submit" variant="line" size="sm" loading={pending}>
          Não poderei comparecer
        </Button>
      </form>

      {state?.error && (
        <p role="alert" className="text-center text-caption font-medium text-danger">
          {state.error}
        </p>
      )}
    </div>
  )
}
