import type { MetadataRoute } from 'next'

// Nome/cor/ícone do "app" Listaae quando adicionado à tela inicial (Android/
// Chrome) — não transforma o site num PWA instalável de verdade (sem
// service worker), só completa a identidade visual que o navegador já lê
// pra esse fim. icon.png (convenção de arquivo do Next, ver app/icon.png)
// é o mesmo ícone servido no favicon — um só arquivo fonte, sem duplicar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Listaae',
    short_name: 'Listaae',
    description: 'Do convite à celebração — listas de presentes e confirmação de presença.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1e3229',
    theme_color: '#1e3229',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
