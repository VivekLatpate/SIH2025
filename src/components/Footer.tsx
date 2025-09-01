import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-brand/20 bg-white/70 dark:bg-white/5 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        <nav aria-label="Footer links" className="flex flex-wrap gap-4">
          <Link className="hover:text-text" href="#solutions">Solutions</Link>
          <Link className="hover:text-text" href="#about">About</Link>
          <Link className="hover:text-text" href="#contact">Contact</Link>
          <Link className="hover:text-text" href="#privacy">Privacy</Link>
        </nav>
        <p id="privacy" className="mt-3 max-w-3xl">
          Privacy note: Minimal data by default. Time-limited IDs, on-device processing where possible, explicit opt-in for sharing, and transparent revocation controls.
        </p>
        <p className="mt-4">© {new Date().getFullYear()} Smart Tourist Safety</p>
      </div>
    </footer>
  )
}


