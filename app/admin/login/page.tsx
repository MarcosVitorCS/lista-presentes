import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

// Rota "de verdade" do login — continua funcionando pra navegação direta,
// bookmark e progressive enhancement sem JS. O clique em "Entrar" na
// landing (components/public/LandingHeader.tsx) usa o mesmo conteúdo
// (AdminLoginForm) dentro de um Drawer em vez de navegar pra cá, mas essa
// rota nunca deixou de existir.
export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <AdminLoginForm />
    </main>
  )
}
