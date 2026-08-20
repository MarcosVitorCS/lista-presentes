import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Só a landing institucional por enquanto. As rotas de evento
// (/evento/[slug], /casamento, /cha-de-cozinha, /identificacao, /confirmar)
// são conteúdo de convidado, não de descoberta via busca — ver robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
