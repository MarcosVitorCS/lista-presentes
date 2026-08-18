import { ListSkeleton } from '@/components/admin/AdminSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <ListSkeleton />
    </div>
  )
}
