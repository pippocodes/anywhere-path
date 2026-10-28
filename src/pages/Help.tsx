import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RevealHeading from '../components/ui/RevealHeading'

interface FaqItem {
  id: string
  q: string
  a: string
}

interface FaqCategory {
  name: string
  items: FaqItem[]
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    name: 'Course Tracker',
    items: [
      {
        id: 'course-formats',
        q: 'What course formats can I track?',
        a: 'Any course works — paste in lectures from Udemy, YouTube, a bootcamp, or type a custom list yourself. A course can optionally note a platform and instructor, and lectures nest into modules and sub-modules up to three levels deep.',
      },
      {
        id: 'duration-formats',
        q: 'How do I enter a lecture\'s duration?',
        a: 'Type it however you\'d naturally say it — "5:22", "1:05:22", "1h 5m", "90s", "2d", or just a bare number for minutes (e.g. "12"). It\'s parsed into exact seconds and always displayed back as mm:ss or h:mm:ss.',
      },
    ],
  },
  {
    name: 'Roadmap Builder',
    items: [
      {
        id: 'outline-format',
        q: 'How do I write an outline?',
        a: 'Indent with two spaces per level — topic, then subtopic, then module. Every leaf line (one with nothing nested under it) ends with a duration like (2h), (45m), (3d), or (2w); a line with children doesn\'t need one, since its total is just the sum of what\'s nested inside it.',
      },
      {
        id: 'reality-check',
        q: 'What does the "reality check" actually check?',
        a: 'It compares how much time your outline needs against what your start date, daily hours, and chosen weekdays actually add up to by your target finish date. If it doesn\'t fit, you get two one-click fixes — more hours per day, or more days — instead of a roadmap that quietly lies to you.',
      },
      {
        id: 'ai-generate-data',
        q: 'What does "Generate with AI" send to the model?',
        a: 'Only the short goal you type (e.g. "learn data structures in 8 weeks, 1h/day") — never your saved roadmaps, account details, or anything else. It\'s entirely optional; if a deployment hasn\'t configured it, the button just shows a "not set up" message and everything else works the same.',
      },
    ],
  },
  {
    name: 'Habit Tracker',
    items: [
      {
        id: 'tri-state',
        q: 'What do the three states on each day mean?',
        a: 'Tap once for partial, twice for fully done, a third time to clear it. Only a fully-done day counts toward a streak — a partial day doesn\'t break one, but it doesn\'t extend one either.',
      },
      {
        id: 'shared-limit',
        q: 'How many trackers can I share with friends?',
        a: 'Two, on the free plan — shared from the Habit Tracker page once you\'re connected with someone.',
      },
    ],
  },
  {
    name: 'Friends & Privacy',
    items: [
      {
        id: 'find-someone',
        q: 'How do I find someone to add?',
        a: 'Search their username (3+ characters) in "Add a friend," or browse public profiles in "People you can add." A private profile never shows up in either of those — it\'s only found by typing their exact, full username.',
      },
      {
        id: 'public-private',
        q: 'What\'s the difference between a public and private profile?',
        a: 'Public profiles appear in the discovery list and in partial username search; private ones — the default for every account — only turn up for someone who already knows your exact username. Either way, your email is never shown to anyone but you.',
      },
    ],
  },
  {
    name: 'Account & Settings',
    items: [
      {
        id: 'theme',
        q: 'Can I change the theme?',
        a: 'Yes, in Settings → Appearance — pick one of four themes and whether it should follow your system, or stay light or dark. It\'s saved to your account, so it follows you to another device too.',
      },
      {
        id: 'username-change',
        q: 'How often can I change my username?',
        a: 'Once every 30 days — enforced on the account itself, not just in the page, so it holds even if you call the API directly.',
      },
      {
        id: 'password-change',
        q: 'How does changing my password work?',
        a: 'You re-enter your current password first, and it\'s verified before anything changes. Forgotten it? Use "Forgot your current password?" to get a reset-link email instead.',
      },
      {
        id: 'delete-account',
        q: 'What happens if I delete my account?',
        a: 'Everything tied to it is removed — courses, roadmaps, habits, friendships, and any shared trackers you\'re part of. You\'ll need to type your exact username to confirm, and it can\'t be undone.',
      },
    ],
  },
]

function matches(item: FaqItem, query: string): boolean {
  const q = query.toLowerCase()
  return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
}

function FaqAccordionItem({ item, delay }: { item: FaqItem; delay: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ padding: 0, overflow: 'hidden' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream)' }}>{item.q}</span>
        <motion.span
          animate={{ rotate: open ? 135 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden
          style={{ fontSize: 18, color: 'var(--gold)', flexShrink: 0 }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ fontSize: 14, color: 'var(--mute)', lineHeight: 1.65, margin: 0, padding: '0 20px 18px' }}>{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface Props {
  // Renders without its own .page wrapper/heading when true — used by
  // /settings/help, which already supplies both via SettingsSectionHeader,
  // so this is never nested inside another .page (which would double the
  // padding). The standalone /help route keeps the default, unembedded.
  embedded?: boolean
}

function Help({ embedded = false }: Props = {}) {
  const [query, setQuery] = useState('')
  const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim()

  const filtered = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return FAQ_CATEGORIES
    return FAQ_CATEGORIES.map((cat) => ({ ...cat, items: cat.items.filter((item) => matches(item, trimmed)) })).filter(
      (cat) => cat.items.length > 0
    )
  }, [query])

  const content = (
    <>
      {!embedded && (
        <>
          <RevealHeading as="h1" className="page-title" style={{ marginBottom: 10 }}>
            Help
          </RevealHeading>
          <p className="page-subtitle" style={{ marginBottom: 24 }}>
            Search, or browse by category.
          </p>
        </>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search help…"
        aria-label="Search help"
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 10,
          border: '1px solid var(--line)',
          fontSize: 14.5,
          marginBottom: 32,
        }}
      />

      {filtered.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--mute)' }}>No results for "{query}" — try a different search term.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {filtered.map((cat) => (
            <div key={cat.name}>
              <div className="micro-label" style={{ marginBottom: 12 }}>
                {cat.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cat.items.map((item, i) => (
                  <FaqAccordionItem key={item.id} item={item} delay={i * 0.04} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {supportEmail && (
        <div className="card" style={{ padding: '20px 22px', marginTop: 40, textAlign: 'center' }}>
          <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>Still need help?</h3>
          <p style={{ fontSize: 13.5, color: 'var(--mute)', marginBottom: 14 }}>We're happy to help directly.</p>
          <a href={`mailto:${supportEmail}`} className="btn-outline" style={{ fontSize: 13.5 }}>
            {supportEmail}
          </a>
        </div>
      )}
    </>
  )

  if (embedded) return content
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      {content}
    </div>
  )
}

export default Help
