export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-canvas-line bg-canvas-alt px-6 py-12 text-center">
      <p className="mx-auto max-w-[36ch] text-ink-soft">{message}</p>
    </div>
  )
}
