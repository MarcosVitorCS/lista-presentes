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
import { Input, Label, Field } from '@/components/ui/Input'
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

// Botão só-ícone com 44px de área e o ícone pequeno dentro. Editar e remover
// pessoa eram alvos de 14px — os menores do produto inteiro, numa tela que o
// casal usa no celular enquanto fala com os convidados.
const iconActionClass =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors duration-[var(--duration-hover)] disabled:opacity-50 disabled:pointer-events-none'

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
          {/* no-scrollbar + rolagem horizontal: quatro filtros com esses
              rótulos quebravam em duas linhas em 390px. */}
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={cx(
                  'flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-xs font-semibold transition-colors duration-[var(--duration-hover)]',
                  filter === f.value
                    ? 'bg-ink-deep text-on-deep'
                    : 'bg-canvas-alt text-ink-soft hover:text-ink'
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

        {/* role="status": filtrar e buscar mudavam a lista em silêncio. */}
        <p role="status" aria-live="polite" className="text-xs text-ink-soft">
          {filtered.length} de {rows.length} {rows.length === 1 ? 'convite' : 'convites'}
        </p>

        {filtered.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-canvas-line bg-canvas-alt px-6 py-10 text-center text-caption text-ink-soft">
            Nenhum convidado responsável encontrado.
          </p>
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
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-ink">Adicionar convidado responsável</p>
            <p className="text-caption text-ink-soft">
              O convidado só poderá confirmar presença das pessoas que você cadastrar aqui — nenhum
              nome extra pode ser digitado por ele.
            </p>
          </div>
          <input type="hidden" name="occasionId" value={occasionId} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="new-guest-name" label="Nome do responsável">
              {(props) => <Input {...props} name="name" required />}
            </Field>
            <Field id="new-guest-contact" label="WhatsApp ou e-mail" error={state?.error}>
              {(props) => (
                <>
                  <Input
                    {...props}
                    name="contact"
                    required
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    inputMode={contact.includes('@') ? 'email' : 'tel'}
                    placeholder="(11) 99999-9999 ou nome@email.com"
                  />
                  <input type="hidden" name="contactType" value={contact.includes('@') ? 'email' : 'whatsapp'} />
                </>
              )}
            </Field>
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
                  aria-label={`Nome da pessoa autorizada ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setExtraNames((names) => names.filter((_, i) => i !== index))}
                  className={cx(iconActionClass, 'hover:text-danger')}
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

          <Button type="submit" loading={pending} className="self-start">
            Criar convite
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [regenState, regenAction, regenPending] = useActionState(regenerateInvitation, undefined)
  useActionToast(regenState, 'Convite regenerado!')
  const regenFormRef = useRef<HTMLFormElement>(null)
  const confirmTitleId = useId()

  // Era window.confirm: diálogo do sistema, sem o nome do convidado em
  // destaque e sem dizer que o link antigo morre na hora. A ação é
  // destrutiva e irreversível, então vale o Dialog do kit.
  function confirmRegenerate() {
    setConfirmOpen(false)
    regenFormRef.current?.requestSubmit()
  }

  return (
    <>
      <Card className="flex flex-col gap-3 p-4 sm:p-6">
        {/* aria-expanded estava faltando: o cabeçalho é um botão que abre e
            fecha a linha, e nada disso era anunciado. */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="-m-1 flex min-h-11 items-center justify-between gap-3 p-1 text-left"
        >
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{row.guestName}</span>
            <span className="block text-caption tabular-nums text-ink-soft">
              {row.confirmedCount} de {row.totalAuthorized}{' '}
              {row.totalAuthorized === 1 ? 'pessoa' : 'pessoas'}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
            <ChevronDown
              size={18}
              strokeWidth={1.8}
              className={cx(
                'text-ink-soft transition-transform duration-[var(--duration-hover)] ease-[var(--ease-out)]',
                expanded && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </span>
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
              <Button
                type="button"
                variant="line"
                size="sm"
                loading={regenPending}
                onClick={() => setConfirmOpen(true)}
              >
                Regenerar convite
              </Button>
            </div>
            <form ref={regenFormRef} action={regenAction} className="hidden">
              <input type="hidden" name="invitationId" value={row.invitationId} />
            </form>
            {regenState?.error && (
              <p role="alert" className="text-caption font-medium text-danger">
                {regenState.error}
              </p>
            )}

            <Dialog
              open={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              labelledBy={confirmTitleId}
            >
              <h3 id={confirmTitleId} className="font-display text-xl text-ink">
                Regenerar o convite de {row.guestName}?
              </h3>
              <p className="mt-2 text-body-md text-ink-soft">
                Um link novo é gerado e o atual para de funcionar imediatamente. Se {row.guestName}{' '}
                já recebeu o link antigo, vai precisar do novo para confirmar presença.
              </p>
              <p className="mt-3 rounded-[var(--radius)] bg-warning-soft px-3 py-2 text-xs text-warning">
                As respostas já confirmadas são preservadas — só o link muda.
              </p>
              {/* flex-col-reverse: a ação confirmadora fica sob o polegar no
                  mobile sem inverter a ordem de foco. Mesmo padrão do
                  GiftItemCard. */}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="line" onClick={() => setConfirmOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={confirmRegenerate} loading={regenPending}>
                  Regenerar convite
                </Button>
              </div>
            </Dialog>
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
  const [lastRenameState, setLastRenameState] = useState(renameState)

  // Sai do modo de edição quando o rename TERMINA, não no clique do botão.
  // Antes era onClick={() => setEditing(false)} no próprio submit: o mesmo
  // padrão de corrida já documentado em RsvpForm — o re-render síncrono podia
  // desmontar o input antes do navegador montar o FormData, enviando o campo
  // vazio. (Mesma técnica do RsvpForm: ajuste de estado durante o render, sem
  // useEffect e sem cascata.)
  if (renameState !== lastRenameState) {
    setLastRenameState(renameState)
    if (renameState?.success) setEditing(false)
  }

  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-canvas-line px-3 py-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <form action={renameAction} className="flex flex-1 items-center gap-2">
            <input type="hidden" name="partyMemberId" value={member.id} />
            <Input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="text-sm"
              aria-label={`Novo nome de ${member.name}`}
              autoFocus
            />
            <Button type="submit" size="sm" variant="line" loading={renamePending}>
              Salvar
            </Button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setName(member.name)
              }}
              className="flex min-h-11 shrink-0 items-center px-1 text-xs text-ink-soft underline underline-offset-2"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <span className="min-w-0 truncate text-ink">
              {member.name}
              {member.isPrimary && <span className="text-ink-soft"> (responsável)</span>}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <Badge tone={STATUS_TONE[member.status]}>{STATUS_LABEL[member.status]}</Badge>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className={cx(iconActionClass, 'hover:text-ink')}
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
                    className={cx(iconActionClass, 'hover:text-danger')}
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
      {renameState?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {renameState.error}
        </p>
      )}
      {removeState?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {removeState.error}
        </p>
      )}
    </div>
  )
}

function AddMemberForm({ invitationId }: { invitationId: string }) {
  const [state, action, pending] = useActionState(addPartyMember, undefined)
  const [name, setName] = useState('')
  const [lastState, setLastState] = useState(state)

  // Limpa o campo quando a action TERMINA com sucesso. Antes era
  // onClick={() => setName('')} no botão de submit — o mesmo padrão de corrida
  // documentado em RsvpForm, capaz de mandar o nome vazio pro servidor.
  if (state !== lastState) {
    setLastState(state)
    if (state?.success) setName('')
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input type="hidden" name="invitationId" value={invitationId} />
        <Input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Adicionar pessoa autorizada"
          aria-label="Nome da pessoa autorizada"
          className="text-sm"
        />
        <Button type="submit" size="sm" variant="line" loading={pending} disabled={!name.trim()}>
          + Adicionar
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
    </form>
  )
}

function InviteLinkDialog({ token, guestName }: { token?: string; guestName?: string }) {
  const [open, setOpen] = useState(Boolean(token))
  const [copied, setCopied] = useState(false)
  // useId() em vez de um id estático: pode haver mais de uma instância deste
  // componente montada ao mesmo tempo na página — um id fixo duplicaria
  // aria-labelledby no DOM.
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
      <p className="mt-1 text-caption text-ink-soft">
        {guestName ? `Envie este link para ${guestName}:` : 'Envie este link pro convidado:'}
      </p>
      {/* O aviso de "copie agora" ganha superfície de alerta em vez de ser
          uma linha de texto âmbar solta: é a informação que, se ignorada,
          custa um convite regenerado. */}
      <p className="mt-3 rounded-[var(--radius)] bg-warning-soft px-3 py-2 text-xs text-warning">
        Copie agora — por segurança, este link não pode ser recuperado depois. Se perder, use
        &ldquo;Regenerar convite&rdquo; (o link atual deixa de funcionar).
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-[var(--radius)] border border-canvas-line bg-canvas-alt px-2 py-1">
        <code className="flex-1 truncate text-xs">{url}</code>
        <button
          type="button"
          onClick={copyLink}
          className="flex min-h-11 shrink-0 items-center px-2 text-xs font-semibold text-accent-text underline underline-offset-2"
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
