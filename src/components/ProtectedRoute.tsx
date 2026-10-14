import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import PageLoading from './PageLoading'
import DemoGate from './DemoGate'

interface Props {
  children: ReactNode
  demo?: ReactNode
  demoHeading?: string
  demoBody?: string
}

function ProtectedRoute({ children, demo, demoHeading, demoBody }: Props) {
  const { user, loading, configured } = useAuth()

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
    return (
      <DemoGate heading={demoHeading} body={demoBody}>
        {demo}
      </DemoGate>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
