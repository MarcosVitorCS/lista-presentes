import { cx } from './utils'

export function Progress({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cx('h-1.5 w-full overflow-hidden rounded-full bg-canvas-alt', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${clamped}%` }} />
    </div>
  )
}
