import 'server-only'
import { randomBytes, createHash } from 'node:crypto'

/**
 * Token de convite de RSVP — gerado sempre no servidor (Server Action),
 * nunca no client, nunca dentro de uma RPC (evita depender da extensão
 * pgcrypto no Postgres; node:crypto já cobre tudo sem dependência nova).
 *
 * 256 bits de entropia, codificado em base64url (~43 chars, seguro pra URL).
 * Só o hash (sha256, hex) é persistido em invitations.token_hash — o token
 * em texto puro nunca é salvo em lugar nenhum, só devolvido uma vez na
 * resposta da action que cria/regenera o convite.
 */
export function generateInviteToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
