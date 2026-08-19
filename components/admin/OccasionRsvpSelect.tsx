'use client'

import { useRouter } from 'next/navigation'
import { Select } from '@/components/ui/Input'

export function OccasionRsvpSelect({
  occasions,
  selectedId,
}: {
  occasions: { id: string; name: string }[]
  selectedId: string
}) {
  const router = useRouter()

  // Select do kit: este era o único campo do admin com altura e superfície
  // próprias, fora do padrão dos outros inputs.
  return (
    <Select
      id="occasion-select"
      aria-label="Ocasião"
      value={selectedId}
      onChange={(event) => router.push(`/admin/dashboard/confirmacoes?occasion=${event.target.value}`)}
      className="min-w-[12rem]"
    >
      {occasions.map((occasion) => (
        <option key={occasion.id} value={occasion.id}>
          {occasion.name}
        </option>
      ))}
    </Select>
  )
}
