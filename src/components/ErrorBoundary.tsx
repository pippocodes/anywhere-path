import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Class component: React only supports error boundaries as classes
// (there's no hook equivalent for getDerivedStateFromError yet).
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Anywhere Path crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink)' }}>
          <h2>Something went wrong.</h2>
          <p>Try refreshing the page — your saved progress is untouched.</p>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
