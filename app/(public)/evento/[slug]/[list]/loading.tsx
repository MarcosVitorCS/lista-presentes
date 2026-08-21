import { PublicHeader } from '@/components/public/PublicHeader'
import { CatalogSkeleton } from '@/components/public/CatalogSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'
import { LIST_MAIN_CLASS } from '@/lib/ui/list-layout'

export default function Loading() {
  return (
    <>
      <PublicHeader />
      <main className={LIST_MAIN_CLASS}>
        <Skeleton className="h-9 w-40" />
        <CatalogSkeleton />
      </main>
    </>
  )
}
