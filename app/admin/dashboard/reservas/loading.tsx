import { ListSkeleton } from '@/components/admin/AdminSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-56" />
        <ListSkeleton count={2} />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <ListSkeleton count={3} />
      </div>
    </div>
  )
}
