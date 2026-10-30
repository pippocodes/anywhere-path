import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
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
import CoursesDemo from './components/demo/CoursesDemo'
import CatchUpTrigger from './components/habits/CatchUpTrigger'
import DebugOverlay from './components/DebugOverlay'

const Home = lazy(() => import('./pages/Home'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const RoadmapOutline = lazy(() => import('./pages/RoadmapOutline'))
const RoadmapView = lazy(() => import('./pages/RoadmapView'))
const Habits = lazy(() => import('./pages/Habits'))
const Friends = lazy(() => import('./pages/Friends'))
const About = lazy(() => import('./pages/About'))
const Help = lazy(() => import('./pages/Help'))
const FriendProfile = lazy(() => import('./pages/FriendProfile'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const AppearanceSettings = lazy(() => import('./pages/settings/AppearanceSettings'))
const ProfileSettings = lazy(() => import('./pages/settings/ProfileSettings'))
const SecuritySettings = lazy(() => import('./pages/settings/SecuritySettings'))
const AccountSettings = lazy(() => import('./pages/settings/AccountSettings'))
const NotificationsSettings = lazy(() => import('./pages/settings/NotificationsSettings'))
const AiPrivacySettings = lazy(() => import('./pages/settings/AiPrivacySettings'))
const HelpSettings = lazy(() => import('./pages/settings/HelpSettings'))
const AboutSettings = lazy(() => import('./pages/settings/AboutSettings'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Login = lazy(() => import('./pages/auth/Login'))
const SignUp = lazy(() => import('./pages/auth/SignUp'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'))

/** Old /friends/:username deep links -> the new /community/:username path, param preserved. */
function RedirectToCommunityProfile() {
  const { username } = useParams()
  return <Navigate to={`/community/${username}`} replace />
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
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/learning"
              element={
                <ProtectedRoute
                  demo={<CoursesDemo />}
                  demoBody="This is a preview with sample data. Sign up to track your own courses and lectures."
                >
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route path="/courses" element={<Navigate to="/learning" replace />} />
            <Route
              path="/courses/:courseId"
              element={
                <ProtectedRoute
                  demo={<CoursesDemo />}
                  demoBody="This is a preview with sample data. Sign up to track your own courses and lectures."
                >
                  <CourseDetail />
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
                  <RoadmapOutline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmap/:docId"
              element={
                <ProtectedRoute
                  demo={<RoadmapDemo />}
                  demoBody="This is a preview with sample data. Sign up to write your own outline and save it."
                >
                  <RoadmapView />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/community"
              element={
                <ProtectedRoute demoHeading="Create a free account to add friends and share tracking">
                  <Friends />
                </ProtectedRoute>
              }
            />
            <Route path="/friends" element={<Navigate to="/community" replace />} />
            <Route path="/friends/:username" element={<RedirectToCommunityProfile />} />
            <Route
              path="/community/:username"
              element={
                <ProtectedRoute demoHeading="Create a free account to add friends and share tracking">
                  <FriendProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute demoHeading="Create a free account">
                  <Admin />
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
            <Route
              path="/settings/appearance"
              element={
                <ProtectedRoute demoHeading="Create a free account to manage settings">
                  <AppearanceSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/profile"
              element={
                <ProtectedRoute demoHeading="Create a free account to manage settings">
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/security"
              element={
                <ProtectedRoute demoHeading="Create a free account to manage settings">
                  <SecuritySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/notifications"
              element={
                <ProtectedRoute demoHeading="Create a free account to manage settings">
                  <NotificationsSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/ai-privacy"
              element={
                <ProtectedRoute demoHeading="Create a free account to manage settings">
                  <AiPrivacySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/help"
              element={
                <ProtectedRoute demoHeading="Create a free account to manage settings">
                  <HelpSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/about"
              element={
                <ProtectedRoute demoHeading="Create a free account to manage settings">
                  <AboutSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/account"
              element={
                <ProtectedRoute demoHeading="Create a free account to manage settings">
                  <AccountSettings />
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
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <AmbientBackground />
        <Spotlight />
        <ScrollProgress />
        <Navbar />
        <AnimatedRoutes />
        <CatchUpTrigger />
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
        <DebugOverlay />
      </div>
    </ToastProvider>
  )
}

export default App
