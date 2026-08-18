'use client'

import { useActionState } from 'react'
import { createGiftList } from '@/app/actions/catalog'

export function GiftListSetup({
  eventId,
  slug,
  type,
  name,
}: {
  eventId: string
  slug: string
  type: 'physical' | 'quota'
  name: string
}) {
  const [state, action, pending] = useActionState(createGiftList, undefined)

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-dashed border-zinc-300 p-6">
      <p className="text-sm text-zinc-600">A lista &ldquo;{name}&rdquo; ainda não existe para este evento.</p>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="name" value={name} />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
      >
        {pending ? 'Criando…' : `Criar lista "${name}"`}
      </button>
    </form>
  )
}
