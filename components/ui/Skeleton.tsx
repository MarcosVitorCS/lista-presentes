import { cx } from "./utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-[var(--radius)] bg-canvas-alt", className)} aria-hidden="true" />;
}
