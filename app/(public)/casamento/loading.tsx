import { PublicHeader } from '@/components/public/PublicHeader'
import { CatalogSkeleton } from '@/components/public/CatalogSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
        <Skeleton className="h-9 w-40" />
        <CatalogSkeleton />
      </main>
    </>
  )
}
