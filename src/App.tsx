import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import PageLoading from './components/PageLoading'

const Home = lazy(() => import('./pages/Home'))
const Courses = lazy(() => import('./pages/Courses'))
const RoadmapBuilder = lazy(() => import('./pages/RoadmapBuilder'))
const Habits = lazy(() => import('./pages/Habits'))
const About = lazy(() => import('./pages/About'))
const Help = lazy(() => import('./pages/Help'))
const NotFound = lazy(() => import('./pages/NotFound'))

function RoadmapLayout() {
  return <Outlet />
}

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/roadmap" element={<RoadmapLayout />}>
            <Route index element={<RoadmapBuilder />} />
            <Route path=":courseId" element={<RoadmapBuilder />} />
          </Route>
          <Route path="/habits" element={<Habits />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <footer
        style={{
          padding: '24px 48px',
          textAlign: 'center',
          fontSize: 12.5,
          color: 'var(--rose)',
          borderTop: '1px solid var(--pink-pale)',
        }}
      >
        © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME ?? 'Anywhere Path'}. All rights reserved.
      </footer>
    </div>
  )
}

export default App
