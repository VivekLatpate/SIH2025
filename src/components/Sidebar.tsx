import { useEffect, useId, useState } from 'react'
import Link from 'next/link'

type SidebarItem = { id: string; label: string; icon?: string }

type SidebarProps = {
  solutions?: SidebarItem[]
}

export default function Sidebar({ solutions = [] }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const dialogTitleId = useId()

  // prevent background scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [open])

  // listen for header trigger to open drawer
  useEffect(() => {
    const openFromHeader = () => setOpen(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('open-sidebar', openFromHeader as EventListener)
      return () => window.removeEventListener('open-sidebar', openFromHeader as EventListener)
    }
  }, [])

  return (
    <>
      {/* Mobile open button lives in Header; Sidebar only renders drawer on mobile */}

      {/* Desktop sidebar */}
      {!collapsed ? (
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-80 lg:flex-col lg:border-r lg:border-white/10 lg:bg-slate-950/60 lg:backdrop-blur z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <h2 className="px-1 text-xs uppercase tracking-wider text-sky-400/80">Solutions</h2>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-md px-2 py-1 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label="Hide sidebar"
          >
            Hide
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <nav aria-label="Solutions">
            <ul className="mt-0 space-y-1">
              {solutions.map((s) => (
                <li key={s.id}>
                  <Link href={`#${s.id}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/85 hover:text-white hover:bg-white/5">
                    {s.icon ? <span aria-hidden className="text-base leading-none">{s.icon}</span> : null}
                    <span>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="p-3">
          <div className="rounded-lg p-4 bg-gradient-to-br from-teal-500/20 via-sky-500/20 to-indigo-500/20 text-white/90">
            <p className="text-sm">Built for privacy-first safety.</p>
          </div>
        </div>
      </aside>
      ) : (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="hidden lg:inline-flex lg:fixed lg:left-3 lg:top-20 z-30 rounded-md bg-slate-950/70 px-2 py-1 text-xs text-white/90 hover:text-white hover:bg-slate-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label="Show sidebar"
        >
          Open Menu
        </button>
      )}

      {/* Mobile drawer */}
      {open && (
        <div
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          className="fixed inset-0 z-40"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] bg-slate-950 text-white shadow-xl p-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Close
              </button>
            </div>
            <h2 id={dialogTitleId} className="visually-hidden">Navigation</h2>
            <nav aria-label="Mobile solutions" className="mt-4">
              <h2 className="px-3 text-xs uppercase tracking-wider text-sky-400/80">Solutions</h2>
              <ul className="mt-2 space-y-1">
                {solutions.map((s) => (
                  <li key={s.id}>
                    <Link href={`#${s.id}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-base hover:bg-white/5">
                      {s.icon ? <span aria-hidden className="text-lg leading-none">{s.icon}</span> : null}
                      <span>{s.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

function Brand() {
  return (
    <Link href="#top" className="flex items-center gap-3 group">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 via-sky-500 to-indigo-500 text-white font-bold shadow">S</span>
      <span className="font-extrabold tracking-tight">Smart Tourist Safety</span>
    </Link>
  )
}


