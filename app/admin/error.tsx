'use client'

import { adminLogout } from '@/app/actions/auth'

// error.tsx é o boundary que captura o AdminWithoutEventError lançado em
// lib/dal/admin-session.ts (getAdminEvent). Ver o comentário lá: isso existe
// especificamente para não redirecionar pra /admin/login com uma sessão
// válida, o que causaria loop infinito com o proxy.ts.
export default function DashboardError({ error }: { error: Error & { digest?: string } }) {
  const isMissingEvent = error.name === 'AdminWithoutEventError'

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">
        {isMissingEvent ? 'Sua conta não está vinculada a nenhum evento' : 'Algo deu errado'}
      </h1>
      <p className="text-sm text-zinc-600">
        {isMissingEvent
          ? 'Você tem uma conta válida, mas ela ainda não foi associada a um evento em event_admins. Isso normalmente significa que o bootstrap (supabase/seed/001_bootstrap.sql) não foi concluído — falta o INSERT do passo 4.'
          : 'Não foi possível carregar o painel administrativo agora.'}
      </p>
      <form action={adminLogout}>
        <button type="submit" className="text-sm text-zinc-500 underline">
          Sair
        </button>
      </form>
    </main>
  )
}
