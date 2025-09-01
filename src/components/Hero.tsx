import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useId } from 'react'

type HeroProps = {
  onPrimaryCta?: () => void
  onSecondaryCta?: () => void
}

// Subtle entrance animation respecting prefers-reduced-motion
const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (shouldReduce: boolean) => ({
    opacity: 1,
    y: shouldReduce ? 0 : 0,
    transition: { duration: shouldReduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function Hero({ onPrimaryCta, onSecondaryCta }: HeroProps) {
  const shouldReduceMotion = useReducedMotion()
  const decorativeId = useId()

  return (
    <section aria-labelledby={`hero-heading-${decorativeId}`} className="relative overflow-hidden">
      {/* Background image placeholder - replace src with Unsplash query result */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop"
          alt=""
          role="presentation"
          fill
          sizes="100vw"
          className="object-cover opacity-25 dark:opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-surface/90 to-surface"></div>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.6 }}
        variants={containerVariants}
        custom={Boolean(shouldReduceMotion)}
        className="mx-auto max-w-6xl px-4 py-24 sm:py-32 text-center"
      >
        <h1 id={`hero-heading-${decorativeId}`} className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Smart Tourist Safety
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-muted max-w-2xl mx-auto">
          Trustworthy, privacy-first safety tools for travelers, tourism boards, and law enforcement.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onPrimaryCta}
            className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-500 to-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label="Explore Smart Tourist Safety solutions"
          >
            Explore Solutions
          </button>
          <Link
            href="#solutions"
            onClick={onSecondaryCta}
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold bg-slate-900/60 border border-white/10 hover:bg-slate-800/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand text-white"
            aria-label="Skip to solutions grid"
          >
            Skip to Solutions
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted">
          Your data stays yours. We use ephemeral identifiers and explicit consent.
        </p>
      </motion.div>
    </section>
  )
}


