import type { InputHTMLAttributes, TextareaHTMLAttributes, LabelHTMLAttributes } from "react";
import { cx } from "./utils";

export const fieldClasses =
  "w-full rounded-[var(--radius)] border border-canvas-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 transition-colors focus:border-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/40";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldClasses, className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx("text-sm text-ink-soft", className)} {...props} />;
}
