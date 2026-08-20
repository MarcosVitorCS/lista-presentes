'use client'

import { useActionState } from 'react'
import { adminLogin } from '@/app/actions/auth'
import { Input, Field } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

/**
 * Conteúdo do login administrativo — logo, título e formulário. Usado tanto
 * em app/admin/login/page.tsx (navegação direta, bookmark, sem JS) quanto
 * dentro do Drawer disparado pelo "Entrar" da landing
 * (components/public/LandingHeader.tsx). Nenhuma lógica de autenticação
 * muda entre os dois lugares — os dois chamam a mesma Server Action, que já
 * redireciona pra /admin/dashboard sozinha no sucesso.
 */
export function AdminLoginForm({ headingId }: { headingId?: string }) {
  const [state, action, pending] = useActionState(adminLogin, undefined)

  return (
    <div className="flex flex-col gap-7">
      {/* items-start é o que importa aqui: sem alinhamento explícito, o
          align-items:stretch padrão de flex-col força a largura do <img>
          do Logo a ocupar o container inteiro, ignorando o width:auto que
          preserva a proporção — foi isso que distorcia a marca no drawer
          (confirmado via inspeção real: computed width 355px vs. os ~105px
          que a proporção do arquivo pede pra height=30). Nos outros lugares
          onde o Logo aparece (header, footer, PublicHeader) o container é
          flex em linha (items-center), onde esse stretch nunca acontece na
          largura — por isso o bug só existia aqui. */}
      <div className="flex flex-col items-start gap-4">
        <Logo height={30} priority />
        <h1 id={headingId} className="font-display text-display-md text-ink">
          Área administrativa
        </h1>
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
    </div>
  )
}
