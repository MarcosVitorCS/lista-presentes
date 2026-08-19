import { Skeleton } from '@/components/ui/Skeleton'

// A grade e os tamanhos aqui espelham GiftCatalog/GiftItemCard de propósito:
// se o esqueleto tem proporção diferente do conteúdo real, o layout "salta"
// quando os dados chegam — que é justamente o que o esqueleto deveria evitar.
export function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-11 w-full rounded-full" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] border border-canvas-line p-3 sm:gap-3 sm:p-4"
          >
            <Skeleton className="h-24 w-full sm:h-40" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
