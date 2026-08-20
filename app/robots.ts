import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Libera só a landing institucional pra indexação. Tudo abaixo é conteúdo
// de convidado/administrativo — específico de um evento e de uma pessoa,
// não faz sentido aparecer em busca (e /confirmar tem token na URL, que
// nunca deveria ser indexado).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/confirmar', '/identificacao', '/casamento', '/cha-de-cozinha', '/evento'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
