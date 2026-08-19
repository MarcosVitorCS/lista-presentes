'use client'

import { useActionState } from 'react'
import { adminLogin } from '@/app/actions/auth'
import { Input, Field } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, undefined)

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-7 px-5">
      <div className="flex flex-col gap-4">
        <Logo height={30} priority />
        <h1 className="font-display text-display-md text-ink">Área administrativa</h1>
      </div>
      <form action={action} className="flex flex-col gap-4">
        {/*
          Field em vez do par Label+Input montado à mão: o erro do formulário
          era um <p> solto no fim, sem ligação com nenhum campo. Agora a
          mensagem vive no campo, com aria-describedby e role="alert" — o leitor
          de tela anuncia sem o usuário precisar reencontrar o input.
        */}
        <Field id="email" label="E-mail" error={state?.error}>
          {(props) => <Input {...props} name="email" type="email" autoComplete="username" required />}
        </Field>
        <Field id="password" label="Senha">
          {(props) => (
            <Input
              {...props}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          )}
        </Field>
        {/* loading do próprio Button: o texto não é mais trocado por
            "Entrando…", então a largura do botão não pula no envio. */}
        <Button type="submit" loading={pending}>
          Entrar
        </Button>
      </form>
    </main>
  )
}
