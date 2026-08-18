import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

/**
 * Sessão do CONVIDADO — só identificação/UX, nunca autorização.
 *
 * O guest nunca tem SELECT/UPDATE/DELETE em guests/reservations (ver RLS na
 * migration). Este cookie assinado serve apenas para "lembrar quem você
 * disse que era" entre visitas, evitando pedir nome/contato de novo — ele
 * NUNCA é lido como prova de autorização em nenhuma RPC ou policy. Guardar
 * o guest_id em localStorage teria o mesmo nível de confiança; usamos cookie
 * httpOnly + assinado só para não deixar o valor livremente editável pelo
 * DevTools, não para criar uma garantia de segurança que este sistema
 * deliberadamente não tem (convidado não autentica).
 */

const COOKIE_NAME = 'guest_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180 // 180 dias

function getSecretKey() {
  const secret = process.env.GUEST_SESSION_SECRET
  if (!secret) {
    throw new Error('GUEST_SESSION_SECRET não configurado (.env.local)')
  }
  return new TextEncoder().encode(secret)
}

type GuestSessionPayload = {
  guestId: string
  eventId: string
  name: string
}

export async function setGuestSession(payload: GuestSessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecretKey())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function getGuestSession(): Promise<GuestSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify<GuestSessionPayload>(token, getSecretKey())
    return payload
  } catch {
    return null
  }
}

export async function clearGuestSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
