import type { ButtonHTMLAttributes } from "react";
import { cx } from "./utils";

export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string }) {
  return (
    <button
      className={cx(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-canvas-line text-ink-soft transition-colors hover:border-accent-strong hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    />
  );
}
