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
  // submissão nova termina, sai do modo de edição automaticamente. Sem
  // isso, "editing" ficaria travado true pra sempre depois do primeiro
  // "Alterar resposta", escondendo a tela de resultado mesmo após uma
  // confirmação bem-sucedida. Resetar via onClick no botão de envio (a
  // tentativa anterior) causava uma corrida real: o clique disparava
  // setEditing(false) e um re-render síncrono ANTES do navegador capturar
  // os checkboxes marcados pro FormData, fazendo o envio ir com valores
  // incompletos.
  if (state !== lastHandledState) {
    setLastHandledState(state)
    if (state?.success) setEditing(false)
  }

  // Reflete sempre o dado mais recente: o retorno da action se já
  // submeteu algo nesta página, senão o que o servidor já sabia.
  const effectiveMembers = state?.success && state.partyMembers ? state.partyMembers : partyMembers
  // "Fresh" (nunca respondido) só é verdade se TODO mundo ainda está
  // pending — depois de qualquer submissão, submit_rsvp sempre marca todo
  // mundo confirmed/declined, então isso nunca fica "meio pending".
  const fresh = effectiveMembers.every((m) => m.status === 'pending')
  const responded = (state?.success === true || !fresh) && !editing

  function startEditing() {
    setEditing(true)
  }

  if (responded) {
    const confirmedNames = effectiveMembers.filter((m) => m.status === 'confirmed').map((m) => m.name)

    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-canvas-line bg-canvas p-6 text-center">
        {confirmedNames.length > 0 ? (
          <>
            <p className="font-display text-2xl text-ink">Presença confirmada! ❤️</p>
            <p className="text-ink-soft">
              {joinNames(confirmedNames)} {confirmedNames.length === 1 ? 'estará' : 'estarão'} conosco.
            </p>
            <p className="text-sm text-ink-soft">Será uma alegria celebrar esse momento com vocês!</p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl text-ink">Tudo bem! ❤</p>
            <p className="text-ink-soft">
              Registramos que vocês não poderão comparecer. Se mudar de ideia, é só voltar aqui.
            </p>
          </>
        )}
        <button
          type="button"
          onClick={startEditing}
          className="self-center text-sm text-accent-text underline underline-offset-2"
        >
          Alterar resposta
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <p className="text-sm text-ink-soft">Quem estará presente?</p>
        <div className="flex flex-col gap-2">
          {effectiveMembers.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-3 rounded-[var(--radius)] border border-canvas-line bg-canvas px-4 py-3 text-sm text-ink transition-colors hover:border-accent-strong"
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
        </div>
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? 'Confirmando…' : 'Confirmar presença'}
        </Button>
      </form>

      <form action={action}>
        <input type="hidden" name="token" value={token} />
        {/* Sem checkboxes neste form — confirmedMemberId sempre vem vazio,
            o que a RPC trata como "ninguém confirmado" (recusa). */}
        <Button type="submit" variant="line" className="w-full" disabled={pending}>
          {pending ? 'Enviando…' : 'Não poderei comparecer'}
        </Button>
      </form>

      {state?.error && <p className="text-center text-sm text-danger">{state.error}</p>}
    </div>
  )
}
