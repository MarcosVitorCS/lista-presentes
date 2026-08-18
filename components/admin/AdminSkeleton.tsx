import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'

export function StatSkeleton() {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-10" />
      </div>
      <Skeleton className="h-1.5 w-full" />
      <div className="grid grid-cols-3 gap-3 border-t border-canvas-line pt-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-8 w-28" />
        </Card>
      ))}
    </div>
  )
}
