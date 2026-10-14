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
    a: 'Light means not done, medium means partial, dark means fully done for that day. Click a cell to cycle through states.',
  },
  {
    q: 'Can I delete a roadmap?',
    a: 'Yes — open it and use Delete at the bottom. You will be asked to confirm before it is removed.',
  },
  {
    q: 'Is there a yearly view for habits?',
    a: 'Not yet — the monthly Habit Tracker is available now, with a yearly view planned for later.',
  },
]

function Help() {
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Help</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {FAQS.map((faq) => (
          <div key={faq.q} className="card" style={{ padding: '20px 22px' }}>
            <h3 style={{ fontSize: 15.5, marginBottom: 8 }}>{faq.q}</h3>
            <p style={{ fontSize: 14.5, color: 'var(--mute)', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Help
