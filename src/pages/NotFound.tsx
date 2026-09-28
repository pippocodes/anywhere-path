import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="page" style={{ textAlign: 'center' }}>
      <h1 className="page-title">Page not found</h1>
      <p className="page-subtitle">That page doesn't exist.</p>
      <Link to="/" className="btn" style={{ display: 'inline-block' }}>
        Back Home
      </Link>
    </div>
  )
}

export default NotFound
