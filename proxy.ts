import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Next.js 16 renomeou "Middleware" para "Proxy" (mesma função, nome novo —
// ver node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
// Exportar como `proxy` (não `middleware`) é o que faz este arquivo ser
// reconhecido pelo framework.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() (não getSession()) revalida o token contra o servidor Auth —
  // é o que a documentação do Supabase recomenda para checagens de proxy.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLoginRoute = pathname === '/admin/login'
  const isAdminRoute = pathname.startsWith('/admin')

  // Checagem OTIMISTA apenas: redireciona para melhorar UX, mas não é a
  // barreira de segurança real. Toda página/Server Action/RPC administrativa
  // revalida a sessão de novo no servidor (ver lib/dal/admin-session.ts) e o
  // RLS/SECURITY DEFINER no Postgres é quem de fato barra acesso indevido.
  if (isAdminRoute && !isLoginRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
