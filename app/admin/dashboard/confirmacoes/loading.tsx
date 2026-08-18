import { ListSkeleton } from '@/components/admin/AdminSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <ListSkeleton count={3} />
      </div>
    </div>
  )
}
