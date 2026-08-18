'use client'

import { useActionState, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { submitRsvp } from '@/app/actions/rsvp'
import { Button } from '@/components/ui/Button'

type Step = 'choice' | 'party-size'

export function RsvpForm({
  token,
  maxPartySize,
  initialStatus,
  initialPartySize,
}: {
  token: string
  maxPartySize: number
  initialStatus: 'pending' | 'confirmed' | 'declined'
  initialPartySize: number | null
}) {
  const [state, action, pending] = useActionState(submitRsvp, undefined)
  const [step, setStep] = useState<Step>('choice')
  const [editing, setEditing] = useState(false)
  const [quantity, setQuantity] = useState(initialPartySize ?? 1)

  // "Responded" nunca depende de um efeito: uma submissão recém-feita
  // (state.success) sempre vence: mostra o resultado fresco. Sem nenhuma
  // submissão nesta sessão de render, mostra o que o servidor já sabia —
  // a menos que o convidado tenha clicado "Alterar resposta" (editing).
  const responded = state?.success === true || (state === undefined && !editing && initialStatus !== 'pending')
  const effectiveStatus = state?.success ? state.status : initialStatus
  const effectivePartySize = state?.success ? state.partySize : initialPartySize

  function startEditing() {
    setEditing(true)
    setStep('choice')
  }

  if (responded) {
    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-canvas-line bg-canvas p-6 text-center">
        {effectiveStatus === 'confirmed' ? (
          <>
            <p className="font-display text-2xl text-ink">Presença confirmada! ✓</p>
            <p className="text-ink-soft">
              Será um prazer ter {effectivePartySize === 1 ? 'você' : 'vocês'} conosco.
              {effectivePartySize != null && (
                <> ({effectivePartySize} {effectivePartySize === 1 ? 'pessoa' : 'pessoas'})</>
              )}
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl text-ink">Tudo bem! ❤</p>
            <p className="text-ink-soft">
              Registramos que você não poderá comparecer. Se mudar de ideia, é só voltar aqui.
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
    <div className="flex flex-col gap-4">
      {step === 'choice' && (
        <div className="flex flex-col gap-3">
          <Button type="button" variant="accent" className="w-full" onClick={() => setStep('party-size')}>
            Confirmar presença
          </Button>
          <form action={action}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="status" value="declined" />
            <Button type="submit" variant="line" className="w-full" disabled={pending}>
              {pending ? 'Enviando…' : 'Não poderei comparecer'}
            </Button>
          </form>
        </div>
      )}

      {step === 'party-size' && (
        <form action={action} className="flex flex-col gap-5">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="status" value="confirmed" />
          <input type="hidden" name="partySize" value={quantity} />

          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-ink-soft">Quantas pessoas estarão presentes?</p>
            <div className="flex items-center gap-5">
              <button
                type="button"
                aria-label="Diminuir"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-canvas-line text-ink transition-colors hover:border-accent-strong disabled:opacity-40"
              >
                <Minus size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <span className="font-display text-4xl text-ink">{quantity}</span>
              <button
                type="button"
                aria-label="Aumentar"
                onClick={() => setQuantity((q) => Math.min(maxPartySize, q + 1))}
                disabled={quantity >= maxPartySize}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-canvas-line text-ink transition-colors hover:border-accent-strong disabled:opacity-40"
              >
                <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs text-ink-soft">
              Limite do seu convite: {maxPartySize} {maxPartySize === 1 ? 'pessoa' : 'pessoas'}
            </p>
          </div>

          <Button type="submit" variant="accent" className="w-full" disabled={pending}>
            {pending ? 'Confirmando…' : 'Confirmar'}
          </Button>
          <button
            type="button"
            onClick={() => setStep('choice')}
            className="self-center text-sm text-ink-soft underline underline-offset-2"
          >
            Voltar
          </button>
        </form>
      )}

      {state?.error && <p className="text-center text-sm text-danger">{state.error}</p>}
    </div>
  )
}
