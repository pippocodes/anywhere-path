import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoading from './PageLoading'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth()
  const location = useLocation()

  if (!configured) {
    return (
      <div className="page">
        <h1 className="page-title">Setup needed</h1>
        <p className="page-subtitle">
          This page requires an account, which needs Supabase configured first. See{' '}
          <code>supabase/SETUP.md</code> for the step-by-step setup.
        </p>
      </div>
    )
  }

  if (loading) return <PageLoading />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
