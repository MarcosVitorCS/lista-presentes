import Link from 'next/link'

export function PublicHeader() {
  return (
    <header className="border-b border-canvas-line px-5 py-4 sm:px-8">
      <Link href="/" className="font-display text-lg italic text-ink">
        Rafaely &amp; Vitor
      </Link>
    </header>
  )
}
