'use client'

import { useRouter } from 'next/navigation'

export function OccasionRsvpSelect({
  occasions,
  selectedId,
}: {
  occasions: { id: string; name: string }[]
  selectedId: string
}) {
  const router = useRouter()

  return (
    <select
      id="occasion-select"
      value={selectedId}
      onChange={(event) => router.push(`/admin/dashboard/confirmacoes?occasion=${event.target.value}`)}
      className="w-full min-w-[12rem] rounded-[var(--radius)] border border-canvas-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      {occasions.map((occasion) => (
        <option key={occasion.id} value={occasion.id}>
          {occasion.name}
        </option>
      ))}
    </select>
  )
}
