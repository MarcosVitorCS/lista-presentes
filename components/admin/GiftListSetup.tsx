'use client'

import { useActionState } from 'react'
import { createGiftList } from '@/app/actions/catalog'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useActionToast } from '@/components/ui/Toast'

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
  useActionToast(state, 'Lista criada!')

  return (
    <form action={action}>
      <Card tone="canvas-alt" className="flex flex-col gap-3 border-dashed">
        <p className="text-caption text-ink-soft">
          A lista &ldquo;{name}&rdquo; ainda não existe para este evento.
        </p>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="name" value={name} />
        {state?.error && (
          <p role="alert" className="text-caption font-medium text-danger">
            {state.error}
          </p>
        )}
        <Button type="submit" loading={pending} className="self-start">
          {`Criar lista "${name}"`}
        </Button>
      </Card>
    </form>
  )
}
