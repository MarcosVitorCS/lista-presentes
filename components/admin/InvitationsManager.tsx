'use client'

import { useActionState, useId, useMemo, useRef, useState } from 'react'
import { createInvitation, regenerateInvitation } from '@/app/actions/rsvp'
import { Input, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { useActionToast } from '@/components/ui/Toast'
import type { ContactType } from '@/types/database'

export type GuestRsvpRow = {
  guestId: string
  name: string
  contact: string
  contactType: ContactType
  maxPartySize: number
  status: 'pending' | 'confirmed' | 'declined'
  partySize: number | null
  respondedAt: string | null
  lastAccessedAt: string | null
}

const STATUS_LABEL: Record<GuestRsvpRow['status'], string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  declined: 'Não comparecerá',
}
const STATUS_TONE: Record<GuestRsvpRow['status'], BadgeTone> = {
  pending: 'warning',
  confirmed: 'success',
  declined: 'neutral',
}

type Filter = 'all' | GuestRsvpRow['status']
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'declined', label: 'Não comparecerão' },
]

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function InvitationsManager({ guests }: { guests: GuestRsvpRow[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return guests.filter((guest) => {
      if (filter !== 'all' && guest.status !== filter) return false
      if (term && !guest.name.toLowerCase().includes(term) && !guest.contact.toLowerCase().includes(term)) {
        return false
      }
      return true
    })
  }, [guests, filter, search])

  return (
    <div className="flex flex-col gap-8">
      <NewInvitationForm />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.value ? 'bg-ink-deep text-on-deep' : 'bg-canvas-alt text-ink-soft hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Input
            type="search"
            placeholder="Buscar por nome ou contato…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-64"
            aria-label="Buscar convidado"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-ink-soft">Nenhum convidado encontrado.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((guest) => (
              <GuestRow key={guest.guestId} guest={guest} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NewInvitationForm() {
  const [state, action, pending] = useActionState(createInvitation, undefined)
  const [contact, setContact] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <>
      <form ref={formRef} action={action}>
        <Card tone="canvas-alt" className="flex flex-col gap-4 border-dashed">
          <div>
            <p className="text-sm font-semibold text-ink">Adicionar convidado</p>
            <p className="text-xs text-ink-soft">Cria o convite e gera um link individual pra confirmação de presença.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-guest-name">Nome</Label>
              <Input id="new-guest-name" name="name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-guest-max">Máximo de pessoas</Label>
              <Input id="new-guest-max" name="maxPartySize" type="number" min={1} max={50} defaultValue={1} required />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="new-guest-contact">WhatsApp ou e-mail</Label>
              <Input
                id="new-guest-contact"
                name="contact"
                required
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="(11) 99999-9999 ou nome@email.com"
              />
              <input type="hidden" name="contactType" value={contact.includes('@') ? 'email' : 'whatsapp'} />
            </div>
          </div>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? 'Criando…' : 'Criar convite'}
          </Button>
        </Card>
      </form>

      <InviteLinkDialog
        key={state?.inviteToken ?? 'none'}
        token={state?.success ? state.inviteToken : undefined}
        guestName={state?.guestName}
      />
    </>
  )
}

function GuestRow({ guest }: { guest: GuestRsvpRow }) {
  const [state, action, pending] = useActionState(regenerateInvitation, undefined)
  useActionToast(state, 'Convite regenerado!')
  const formRef = useRef<HTMLFormElement>(null)

  function handleRegenerateClick() {
    const confirmed = window.confirm(
      `Regenerar o convite de ${guest.name}? O link atual deixará de funcionar imediatamente.`
    )
    if (confirmed) formRef.current?.requestSubmit()
  }

  return (
    <>
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-ink">{guest.name}</p>
          <p className="text-sm text-ink-soft">{guest.contact}</p>
          <p className="text-xs text-ink-soft">
            Limite: {guest.maxPartySize} {guest.maxPartySize === 1 ? 'pessoa' : 'pessoas'}
            {guest.status === 'confirmed' && guest.partySize != null && (
              <> · {guest.partySize} confirmada{guest.partySize === 1 ? '' : 's'}</>
            )}
          </p>
          {guest.respondedAt && (
            <p className="text-xs text-ink-soft">Respondeu em {formatDateTime(guest.respondedAt)}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[guest.status]}>{STATUS_LABEL[guest.status]}</Badge>
          <Button type="button" variant="line" size="sm" disabled={pending} onClick={handleRegenerateClick}>
            {pending ? 'Gerando…' : 'Regenerar convite'}
          </Button>
        </div>

        <form ref={formRef} action={action} className="hidden">
          <input type="hidden" name="guestId" value={guest.guestId} />
        </form>

        {state?.error && <p className="text-sm text-danger sm:basis-full">{state.error}</p>}
      </Card>

      <InviteLinkDialog
        key={state?.inviteToken ?? 'none'}
        token={state?.success ? state.inviteToken : undefined}
        guestName={guest.name}
      />
    </>
  )
}

function InviteLinkDialog({ token, guestName }: { token?: string; guestName?: string }) {
  const [open, setOpen] = useState(Boolean(token))
  const [copied, setCopied] = useState(false)
  // useId() em vez de um id estático: pode haver mais de uma instância deste
  // componente montada ao mesmo tempo na página (o diálogo de "Adicionar
  // convidado" e o de cada linha de "Regenerar convite" nunca desmontam, só
  // ficam com open=false) — um id fixo duplicaria aria-labelledby no DOM.
  const titleId = useId()

  if (!token) return null

  const url = typeof window !== 'undefined' ? `${window.location.origin}/confirmar/${token}` : ''

  async function copyLink() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
      <h3 id={titleId} className="font-display text-xl text-ink">
        Convite criado!
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        {guestName ? `Envie este link para ${guestName}:` : 'Envie este link pro convidado:'}
      </p>
      <p className="mt-3 text-xs text-warning">
        Copie agora — por segurança, este link não pode ser recuperado depois. Se perder, use
        &quot;Regenerar convite&quot; (o link atual deixa de funcionar).
      </p>
      <div className="mt-3 flex items-center gap-2 rounded border border-canvas-line bg-canvas-alt px-2 py-2">
        <code className="flex-1 truncate text-xs">{url}</code>
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 text-xs font-semibold text-accent-text underline underline-offset-2"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <Button type="button" className="mt-5 w-full" onClick={() => setOpen(false)}>
        Concluído
      </Button>
    </Dialog>
  )
}
