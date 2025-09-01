import Head from 'next/head'
import Hero from '@/components/Hero'
import SolutionsGrid, { type Solution } from '@/components/SolutionsGrid'
import Footer from '@/components/Footer'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function HomePage() {
  // Simple demo handlers - no external calls
  const notify = (message: string) => () => {
    // eslint-disable-next-line no-alert
    alert(message)
  }

  const solutions: Solution[] = [
    {
      id: 'digital-ids',
      title: 'Time-limited Digital IDs',
      description: 'Ephemeral IDs to verify tourists without permanent tracking.',
      ctaLabel: 'Create ID',
      ariaLabel: 'Create a time-limited digital ID',
      icon: '🪪',
      onPrimary: notify('Creating a time-limited digital ID... (demo)'),
      onSecondary: notify('Learn more: Time-limited Digital IDs'),
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'privacy-controls',
      title: 'Privacy Controls & Consent',
      description: 'Granular consent, data minimization, transparent sharing.',
      ctaLabel: 'Privacy Settings',
      ariaLabel: 'Open privacy settings',
      icon: '🔐',
      onPrimary: notify('Opening Privacy Settings... (demo)'),
      onSecondary: notify('Learn more: Privacy Controls & Consent'),
      imageUrl: 'https://images.unsplash.com/photo-1544198365-3c52d6e6312b?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'geo-fencing',
      title: 'AI Geo-Fencing & Alerts',
      description: 'Safety zones with smart alerts based on context.',
      ctaLabel: 'Enable Geo-fence',
      ariaLabel: 'Enable AI geo-fencing',
      icon: '📍',
      onPrimary: notify('AI Geo-fence enabled... (demo)'),
      onSecondary: notify('Learn more: AI Geo-Fencing & Alerts'),
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764b8a?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'instant-sos',
      title: 'Instant SOS & Auto E-FIR',
      description: 'One-tap emergency with automated reporting.',
      ctaLabel: 'Try SOS',
      ariaLabel: 'Trigger SOS demo',
      icon: '🚨',
      onPrimary: notify('SOS triggered and E-FIR drafted... (demo)'),
      onSecondary: notify('Learn more: Instant SOS & Auto E-FIR'),
      imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'multilingual-ai',
      title: 'Multilingual AI Assistant',
      description: 'Real-time translate and safety guidance.',
      ctaLabel: 'Open Translator',
      ariaLabel: 'Open multilingual AI translator',
      icon: '🗣️',
      onPrimary: notify('Opening Multilingual AI Assistant... (demo)'),
      onSecondary: notify('Learn more: Multilingual AI Assistant'),
      imageUrl: 'https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'crowdsourced-reporting',
      title: 'Crowdsourced Reporting (Tokens)',
      description: 'Community safety reports with token rewards.',
      ctaLabel: 'Report Issue',
      ariaLabel: 'Report an issue',
      icon: '🪙',
      onPrimary: notify('Opening report form... (demo)'),
      onSecondary: notify('Learn more: Crowdsourced Reporting (Tokens)'),
      imageUrl: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'wearables',
      title: 'Ultra-low-power Wearables',
      description: 'Long-lasting beacons for off-grid safety.',
      ctaLabel: 'Request Wearable',
      ariaLabel: 'Request a wearable device',
      icon: '⌚',
      onPrimary: notify('Requesting demo wearable... (demo)'),
      onSecondary: notify('Learn more: Ultra-low-power Wearables'),
      imageUrl: 'https://images.unsplash.com/photo-1533849481248-69b7c3f9a493?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'safety-circles',
      title: 'Safety Circles (Family / Tour Groups)',
      description: 'Share live status with chosen circles.',
      ctaLabel: 'Create Circle',
      ariaLabel: 'Create a safety circle',
      icon: '🫶',
      onPrimary: notify('Creating safety circle... (demo)'),
      onSecondary: notify('Learn more: Safety Circles'),
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'safety-score',
      title: 'Safety Score & Gamification',
      description: 'Earn points for safe choices.',
      ctaLabel: 'View Score',
      ariaLabel: 'View your safety score',
      icon: '🏅',
      onPrimary: notify('Fetching safety score... (demo)'),
      onSecondary: notify('Learn more: Safety Score & Gamification'),
      imageUrl: 'https://images.unsplash.com/photo-1533139502658-0198f920d8ae?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'heatmaps',
      title: 'Real-time Heatmaps & Dashboards',
      description: 'Visualize hotspots and trends securely.',
      ctaLabel: 'View Dashboard',
      ariaLabel: 'Open real-time dashboard',
      icon: '🗺️',
      onPrimary: notify('Opening dashboard... (demo)'),
      onSecondary: notify('Learn more: Real-time Heatmaps & Dashboards'),
      imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=800&auto=format&fit=crop',
    },
  ]

  return (
    <>
      <Head>
        <title>Smart Tourist Safety — Trusted Safety Platform</title>
        <meta name="description" content="Privacy-first safety tools for tourists, tourism boards, and law enforcement." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Smart Tourist Safety" />
        <meta property="og:description" content="Trustworthy, privacy-first safety tools for travelers and cities." />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Sidebar solutions={solutions.map(({ id, title, icon }) => ({ id, label: shortLabel(title), icon }))} />
        <Header />
        <main id="top" className="lg:pl-80">
          {/* Decorative gradient blobs */}
          <div aria-hidden className="pointer-events-none fixed inset-x-0 top-[-10rem] -z-10 blur-3xl">
            <div className="relative left-1/2 aspect-[1155/678] w-[72rem] -translate-x-1/2 bg-[radial-gradient(closest-side,_#22d3ee_30%,_transparent_40%)] opacity-30 dark:opacity-20" />
          </div>
          <Hero onPrimaryCta={notify('Exploring solutions... (demo)')} onSecondaryCta={notify('Jumping to solutions... (demo)')} />
          <SolutionsGrid solutions={solutions} />
          <Footer />
        </main>
      </div>
    </>
  )
}

function shortLabel(title: string): string {
  const map: Record<string, string> = {
    'Time-limited Digital IDs': 'Digital IDs',
    'Privacy Controls & Consent': 'Privacy',
    'AI Geo-Fencing & Alerts': 'Geo-fence',
    'Instant SOS & Auto E-FIR': 'SOS',
    'Multilingual AI Assistant': 'Assistant',
    'Crowdsourced Reporting (Tokens)': 'Reporting',
    'Ultra-low-power Wearables': 'Wearables',
    'Safety Circles (Family / Tour Groups)': 'Circles',
    'Safety Score & Gamification': 'Score',
    'Real-time Heatmaps & Dashboards': 'Dashboards',
  }
  return map[title] ?? title
}


