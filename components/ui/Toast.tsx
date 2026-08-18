'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from './utils'

type ToastTone = 'success' | 'error'
type ToastItem = { id: number; message: string; tone: ToastTone }

type ToastContextValue = {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const push = useCallback((message: string, tone: ToastTone) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value: ToastContextValue = {
    success: useCallback((message: string) => push(message, 'success'), [push]),
    error: useCallback((message: string) => push(message, 'error'), [push]),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cx(
              'pointer-events-auto animate-fade-in-up rounded-[var(--radius)] border px-4 py-3 text-sm shadow-lg',
              t.tone === 'success'
                ? 'border-success/30 bg-success-soft text-success'
                : 'border-danger/30 bg-danger-soft text-danger'
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de um ToastProvider')
  return ctx
}

/**
 * Observa o retorno de uma useActionState (Server Action) e dispara um
 * toast quando ele muda — sem duplicar no primeiro render (state começa
 * undefined) nem a cada re-render (compara com o valor anterior).
 */
export function useActionToast(
  state: { success?: boolean; error?: string } | undefined,
  successMessage: string
) {
  const toast = useToast()
  const lastRef = useRef<typeof state>(undefined)

  useEffect(() => {
    if (state === lastRef.current) return
    lastRef.current = state
    if (state?.success) toast.success(successMessage)
    else if (state?.error) toast.error(state.error)
  }, [state, successMessage, toast])
}
