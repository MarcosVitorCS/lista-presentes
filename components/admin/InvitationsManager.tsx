'use client'

import { useActionState, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Pencil, X } from 'lucide-react'
import {
  createInvitation,
  regenerateInvitation,
  addPartyMember,
  removePartyMember,
  renamePartyMember,
} from '@/app/actions/rsvp'
import { Input, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { useActionToast } from '@/components/ui/Toast'
import { cx } from '@/components/ui/utils'
import type { RsvpStatus } from '@/types/database'

export type InvitationRowData = {
  invitationId: string
  guestName: string
  contact: string
  lastAccessedAt: string | null
  members: { id: string; name: string; isPrimary: boolean; status: RsvpStatus }[]
  totalAuthorized: number
  confirmedCount: number
  status: RsvpStatus
}

const STATUS_LABEL: Record<RsvpStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  declined: 'Não comparecerá',
}
const STATUS_TONE: Record<RsvpStatus, BadgeTone> = {
  pending: 'warning',
  confirmed: 'success',
  declined: 'neutral',
}

type Filter = 'all' | RsvpStatus
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'declined', label: 'Não comparecerão' },
]

export function InvitationsManager({ occasionId, rows }: { occasionId: string; rows: InvitationRowData[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (filter !== 'all' && row.status !== filter) return false
      if (term && !row.guestName.toLowerCase().includes(term) && !row.contact.toLowerCase().includes(term)) {
        return false
      }
      return true
    })
  }, [rows, filter, search])

  return (
    <div className="flex flex-col gap-8">
      <NewInvitationForm occasionId={occasionId} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cx(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  filter === f.value ? 'bg-ink-deep text-on-deep' : 'bg-canvas-alt text-ink-soft hover:text-ink'
                )}
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
            aria-label="Buscar convidado responsável"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-ink-soft">Nenhum convidado responsável encontrado.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((row) => (
              <InvitationRow key={row.invitationId} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NewInvitationForm({ occasionId }: { occasionId: string }) {
  const [state, action, pending] = useActionState(createInvitation, undefined)
  const [contact, setContact] = useState('')
  const [extraNames, setExtraNames] = useState<string[]>([])

  return (
    <>
      <form action={action}>
        <Card tone="canvas-alt" className="flex flex-col gap-4 border-dashed">
          <div>
            <p className="text-sm font-semibold text-ink">Adicionar convidado responsável</p>
            <p className="text-xs text-ink-soft">
              O convidado só poderá confirmar presença das pessoas que você cadastrar aqui — nenhum
              nome extra pode ser digitado por ele.
            </p>
          </div>
          <input type="hidden" name="occasionId" value={occasionId} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-guest-name">Nome do responsável</Label>
              <Input id="new-guest-name" name="name" required />
            </div>
            <div className="flex flex-col gap-1.5">
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

          <div className="flex flex-col gap-2">
            <Label>Pessoas autorizadas (além do responsável)</Label>
            {extraNames.map((name, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  name="extraMemberName"
                  value={name}
                  onChange={(event) =>
                    setExtraNames((names) => names.map((n, i) => (i === index ? event.target.value : n)))
                  }
                  placeholder="Nome da pessoa"
                />
                <button
                  type="button"
                  onClick={() => setExtraNames((names) => names.filter((_, i) => i !== index))}
                  className="shrink-0 text-ink-soft transition-colors hover:text-danger"
                  aria-label="Remover pessoa"
                >
                  <X size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="line"
              size="sm"
              className="self-start"
              onClick={() => setExtraNames((names) => [...names, ''])}
            >
              + Adicionar pessoa autorizada
            </Button>
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

function InvitationRow({ row }: { row: InvitationRowData }) {
  const [expanded, setExpanded] = useState(false)
  const [regenState, regenAction, regenPending] = useActionState(regenerateInvitation, undefined)
  useActionToast(regenState, 'Convite regenerado!')
  const regenFormRef = useRef<HTMLFormElement>(null)

  function handleRegenerateClick() {
    const confirmed = window.confirm(
      `Regenerar o convite de ${row.guestName}? O link atual deixará de funcionar imediatamente.`
    )
    if (confirmed) regenFormRef.current?.requestSubmit()
  }

  return (
    <>
      <Card className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="font-semibold text-ink">{row.guestName}</p>
            <p className="text-sm text-ink-soft">
              {row.confirmedCount} de {row.totalAuthorized} {row.totalAuthorized === 1 ? 'pessoa' : 'pessoas'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
            <ChevronDown
              size={18}
              strokeWidth={1.8}
              className={cx('text-ink-soft transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            />
          </div>
        </button>

        {expanded && (
          <div className="flex flex-col gap-3 border-t border-canvas-line pt-3">
            <p className="text-xs text-ink-soft">{row.contact}</p>

            <div className="flex flex-col gap-2">
              {row.members.map((member) => (
                <PartyMemberRow key={member.id} member={member} />
              ))}
            </div>

            <AddMemberForm invitationId={row.invitationId} />

            <div className="flex items-center gap-3 pt-1">
              <Button type="button" variant="line" size="sm" disabled={regenPending} onClick={handleRegenerateClick}>
                {regenPending ? 'Gerando…' : 'Regenerar convite'}
              </Button>
            </div>
            <form ref={regenFormRef} action={regenAction} className="hidden">
              <input type="hidden" name="invitationId" value={row.invitationId} />
            </form>
            {regenState?.error && <p className="text-sm text-danger">{regenState.error}</p>}
          </div>
        )}
      </Card>

      <InviteLinkDialog
        key={regenState?.inviteToken ?? 'none'}
        token={regenState?.success ? regenState.inviteToken : undefined}
        guestName={row.guestName}
      />
    </>
  )
}

function PartyMemberRow({ member }: { member: InvitationRowData['members'][number] }) {
  const [renameState, renameAction, renamePending] = useActionState(renamePartyMember, undefined)
  const [removeState, removeAction, removePending] = useActionState(removePartyMember, undefined)
  useActionToast(removeState, 'Pessoa removida.')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(member.name)

  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-canvas-line px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <form action={renameAction} className="flex flex-1 items-center gap-2">
            <input type="hidden" name="partyMemberId" value={member.id} />
            <Input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-8 py-1 text-sm"
              autoFocus
            />
            <Button type="submit" size="sm" variant="line" disabled={renamePending} onClick={() => setEditing(false)}>
              Salvar
            </Button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setName(member.name)
              }}
              className="shrink-0 text-xs text-ink-soft underline underline-offset-2"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <span className="text-ink">
              {member.name}
              {member.isPrimary && <span className="text-ink-soft"> (responsável)</span>}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={STATUS_TONE[member.status]}>{STATUS_LABEL[member.status]}</Badge>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-ink-soft transition-colors hover:text-ink"
                aria-label={`Editar nome de ${member.name}`}
              >
                <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
              {!member.isPrimary && (
                <form action={removeAction}>
                  <input type="hidden" name="partyMemberId" value={member.id} />
                  <button
                    type="submit"
                    disabled={removePending}
                    className="text-ink-soft transition-colors hover:text-danger"
                    aria-label={`Remover ${member.name}`}
                  >
                    <X size={14} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
      {renameState?.error && <p className="text-xs text-danger">{renameState.error}</p>}
      {removeState?.error && <p className="text-xs text-danger">{removeState.error}</p>}
    </div>
  )
}

function AddMemberForm({ invitationId }: { invitationId: string }) {
  const [state, action, pending] = useActionState(addPartyMember, undefined)
  const [name, setName] = useState('')

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="invitationId" value={invitationId} />
      <Input
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Adicionar pessoa autorizada"
        className="h-9 py-1.5 text-sm"
      />
      <Button
        type="submit"
        size="sm"
        variant="line"
        disabled={pending || !name.trim()}
        onClick={() => setName('')}
      >
        {pending ? 'Adicionando…' : '+ Adicionar'}
      </Button>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
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
