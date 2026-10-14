import { Link } from 'react-router-dom'
import RevealHeading from '../components/ui/RevealHeading'

function NotFound() {
  return (
    <div className="page" style={{ textAlign: 'center' }}>
      <RevealHeading as="h1" className="page-title">
        Page not found
      </RevealHeading>
      <p className="page-subtitle">That page doesn't exist.</p>
      <Link to="/" className="btn" style={{ display: 'inline-block' }}>
        Back Home
      </Link>
    </div>
  )
}

export default NotFound
