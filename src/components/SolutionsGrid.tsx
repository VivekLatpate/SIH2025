import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'

export type Solution = {
  id: string
  title: string
  description: string
  ctaLabel: string
  ariaLabel: string
  icon: string // emoji for simplicity; could be replaced with SVGs
  onPrimary: () => void
  onSecondary: () => void
  imageUrl?: string
}

type SolutionsGridProps = {
  solutions: Solution[]
}

const listVariants = {
  hidden: {},
  visible: (shouldReduce: boolean) => ({
    transition: shouldReduce
      ? undefined
      : { staggerChildren: 0.08, delayChildren: 0.1 },
  }),
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (shouldReduce: boolean) => ({
    opacity: 1,
    y: 0,
    transition: { duration: shouldReduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function SolutionsGrid({ solutions }: SolutionsGridProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="solutions" aria-label="Smart Tourist Safety solutions" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <h2 className="text-2xl sm:text-3xl font-bold">Explore Solutions</h2>
      <p className="mt-2 text-muted">Tap a card to try a quick demo action.</p>

      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={listVariants}
        custom={Boolean(shouldReduceMotion)}
        className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        {solutions.map((s) => (
          <motion.li key={s.id} variants={cardVariants} custom={Boolean(shouldReduceMotion)}>
            <div id={s.id} className="h-full rounded-xl p-[1px] bg-gradient-to-br from-teal-500/40 via-sky-500/40 to-indigo-500/40 scroll-mt-24">
              <article className="group h-full rounded-[11px] bg-slate-900/50 backdrop-blur p-4 shadow-sm hover:shadow-md focus-within:shadow-md transition-transform hover:-translate-y-0.5">
                <div className="relative h-36 w-full overflow-hidden rounded">
                  {/* Replace Unsplash URL with your own */}
                  <Image
                    src={s.imageUrl ?? 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800&auto=format&fit=crop'}
                    alt=""
                    role="presentation"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>

                <div className="mt-3">
                  <div className="flex items-start gap-3">
                    <span aria-hidden className="text-2xl">{s.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold">
                        <a href={`#${s.id}`} className="hover:underline decoration-sky-500/70 underline-offset-4">
                          {s.title}
                        </a>
                      </h3>
                      <p className="text-sm text-muted">{s.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={s.onPrimary}
                      className="rounded-md bg-gradient-to-r from-teal-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      aria-label={s.ariaLabel}
                    >
                      {s.ctaLabel}
                    </button>
                    <button
                      type="button"
                      onClick={s.onSecondary}
                      className="text-sm underline underline-offset-4 decoration-sky-500/70 hover:decoration-sky-500"
                      aria-label={`Learn more about ${s.title}`}
                    >
                      Learn more
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}


