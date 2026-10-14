import { motion } from 'framer-motion'
import RevealHeading from '../components/ui/RevealHeading'

const FAQS = [
  {
    q: 'How does the Roadmap Builder decide daily hours?',
    a: 'It adds up the estimated hours for every topic in your outline, then divides by how many days you have. If the pace it needs is more than you said you can give per day, it offers two options instead of pretending the deadline works.',
  },
  {
    q: 'Can I edit a roadmap after saving it?',
    a: 'Yes — open it from "Your Saved Roadmaps" and use "Edit as text" to go back to the outline editor at any time.',
  },
  {
    q: 'What do the habit tracker colors mean?',
    a: 'Gold means partial, the gold-to-rose fill means fully done for that day. Click a cell to cycle through states.',
  },
  {
    q: 'Can I delete a roadmap?',
    a: 'Yes — open it and use Delete at the bottom. You will be asked to confirm before it is removed.',
  },
  {
    q: 'Is there a yearly view for habits?',
    a: 'Yes — switch to "Year" at the top of the Habit Tracker for a contribution heatmap, a 12-month chart, and per-category yearly rings.',
  },
]

function Help() {
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <RevealHeading as="h1" className="page-title" style={{ marginBottom: 24 }}>
        Help
      </RevealHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {FAQS.map((faq, i) => (
          <motion.div
            key={faq.q}
            className="card"
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ padding: '20px 22px' }}
          >
            <h3 style={{ fontSize: 15.5, marginBottom: 8 }}>{faq.q}</h3>
            <p style={{ fontSize: 14.5, color: 'var(--mute)', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Help
