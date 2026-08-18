'use client'

import { useActionState } from 'react'
import { adminLogin } from '@/app/actions/auth'
import { Input, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, undefined)

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-7 px-5">
      <div className="flex flex-col gap-1">
        <p className="font-display text-lg italic text-ink-soft">Rafaely &amp; Vitor</p>
        <h1 className="font-display text-2xl text-ink">Área administrativa</h1>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  )
}
