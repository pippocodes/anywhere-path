import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Navbar from './components/Navbar'
import PageLoading from './components/PageLoading'
import ProtectedRoute from './components/ProtectedRoute'
import AmbientBackground from './components/ui/AmbientBackground'
import Spotlight from './components/ui/Spotlight'
import ScrollProgress from './components/ui/ScrollProgress'
import { ToastProvider } from './components/ui/Toast'
import RoadmapDemo from './components/demo/RoadmapDemo'
import HabitsDemo from './components/demo/HabitsDemo'

const Home = lazy(() => import('./pages/Home'))
const Courses = lazy(() => import('./pages/Courses'))
const RoadmapOutline = lazy(() => import('./pages/RoadmapOutline'))
const RoadmapBuilder = lazy(() => import('./pages/RoadmapBuilder'))
const Habits = lazy(() => import('./pages/Habits'))
const About = lazy(() => import('./pages/About'))
const Help = lazy(() => import('./pages/Help'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Login = lazy(() => import('./pages/auth/Login'))
const SignUp = lazy(() => import('./pages/auth/SignUp'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))

function RoadmapLayout() {
  return <Outlet />
}

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

function AnimatedRoutes() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={reduceMotion ? undefined : PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        <Suspense fallback={<PageLoading />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/courses"
              element={
                <ProtectedRoute demoHeading="Create a free account to manage your courses">
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmap"
              element={
                <ProtectedRoute
                  demo={<RoadmapDemo />}
                  demoBody="This is a preview with sample data. Sign up to write your own outline and save it."
                >
                  <RoadmapLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RoadmapOutline />} />
              <Route path=":courseId" element={<RoadmapBuilder />} />
            </Route>
            <Route
              path="/habits"
              element={
                <ProtectedRoute
                  demo={<HabitsDemo />}
                  demoBody="This is a preview with sample data. Sign up to start tracking your own habits."
                >
                  <Habits />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute demoHeading="Create a free account to see your profile">
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute demoHeading="Create a free account to manage settings">
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <AmbientBackground />
        <Spotlight />
        <ScrollProgress />
        <Navbar />
        <AnimatedRoutes />
        <footer
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '24px 48px',
            textAlign: 'center',
            fontSize: 12.5,
            color: 'var(--mute)',
            borderTop: '1px solid var(--line)',
          }}
        >
          © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME ?? 'Anywhere Path'}. All rights reserved.
        </footer>
      </div>
    </ToastProvider>
  )
}

export default App
