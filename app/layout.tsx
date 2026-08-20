import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Metadata padrão do site inteiro (produto Listaae) — páginas de evento
// específicas (ex.: app/(public)/evento/[slug]/page.tsx) sobrescrevem via
// generateMetadata próprio; o resto (casamento, chá de cozinha,
// identificação, confirmar) herda isso daqui, o que é só cosmético (título
// da aba do navegador) e não muda nenhum comportamento dessas páginas.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Listaae — Do convite à celebração",
    template: "%s · Listaae",
  },
  description:
    "Crie uma experiência completa para o seu evento. Convites, convidados, confirmação de presença, lista de presentes e muito mais em um só lugar.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Listaae",
    title: "Listaae — Do convite à celebração",
    description:
      "Crie uma experiência completa para o seu evento. Convites, convidados, confirmação de presença, lista de presentes e muito mais em um só lugar.",
    images: [{ url: "/brand/listaae-logo.png", width: 1299, height: 372, alt: "Listaae" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Listaae — Do convite à celebração",
    description:
      "Crie uma experiência completa para o seu evento. Convites, convidados, confirmação de presença, lista de presentes e muito mais em um só lugar.",
    images: ["/brand/listaae-logo.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        {/* Reveal (components/ui/Reveal.tsx) começa com opacity-0 e só some
            no useEffect do lado do cliente. Sem isso, um visitante sem JS
            (ou com JS que falhou ao carregar) veria seções permanentemente
            invisíveis. */}
        <noscript>
          <style>{`.opacity-0 { opacity: 1 !important; }`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
