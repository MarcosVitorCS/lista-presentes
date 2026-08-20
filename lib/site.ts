// URL pública canônica do site — usada só por metadata (Open Graph, Twitter
// Card, canonical), sitemap e robots.txt. NUNCA usar isso para lógica de
// negócio ou para montar o link de convite: InvitationsManager.tsx gera esse
// link a partir de window.location.origin de propósito, pra se adaptar
// sozinho a qualquer domínio em que o admin estiver (o .vercel.app e o
// domínio customizado funcionam ao mesmo tempo, sem precisar escolher um).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
