import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'

export function StatSkeleton() {
  return (
    <Card elevation="raise" className="flex flex-col gap-5">
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
        // h-10 (40px) no lugar de h-8: o esqueleto agora tem a altura do botão
        // real (size="sm" = min-h-10), pra não haver salto quando os dados
        // chegam.
        <Card key={i} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-10 w-28" />
        </Card>
      ))}
    </div>
  )
}
