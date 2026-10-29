import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  checkIsAdmin,
  fetchOpenReports,
  resolveReport,
  removePost,
  fetchAnnouncements,
  createAnnouncement,
  setAnnouncementActive,
  deleteAnnouncement,
} from '../lib/adminApi'
import { getErrorMessage } from '../lib/friendsApi'
import type { Announcement, ReportWithPost } from '../types/admin'

export interface UseAdminResult {
  // null = still checking; false = checked, not an admin; true = confirmed admin.
  isAdmin: boolean | null
  loading: boolean
  error: string | null
  reports: ReportWithPost[]
  announcements: Announcement[]
  removeReportedPost: (reportId: string, postId: string, reason: string) => Promise<void>
  dismissReport: (reportId: string) => Promise<void>
  postAnnouncement: (body: string) => Promise<void>
  toggleAnnouncement: (id: string, active: boolean) => Promise<void>
  removeAnnouncement: (id: string) => Promise<void>
  refresh: () => void
}

/**
 * Everything the admin page needs. The isAdmin check and every write here
 * call functions that re-check admin status in the database itself
 * (is_admin(), or the RLS/trigger behind each table) — this hook's own
 * `isAdmin` flag only decides what the UI shows, it grants nothing.
 */
export function useAdmin(): UseAdminResult {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [reports, setReports] = useState<ReportWithPost[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    checkIsAdmin()
      .then(async (admin) => {
        if (cancelled) return
        setIsAdmin(admin)
        if (!admin) return
        const [reportData, announcementData] = await Promise.all([fetchOpenReports(), fetchAnnouncements()])
        if (cancelled) return
        setReports(reportData)
        setAnnouncements(announcementData)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load the admin page.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, nonce])

  async function removeReportedPost(reportId: string, postId: string, reason: string) {
    // Removing the post is the primary, important action; marking the
    // report "actioned" is just bookkeeping on top of it. If the post
    // removal succeeds but this follow-up call fails (a transient blip),
    // the admin shouldn't see a false "failed" error for an action that
    // actually worked — the report is left open (Dismiss still covers it)
    // rather than the whole thing looking like nothing happened.
    await removePost(postId, reason.trim() || null)
    try {
      await resolveReport(reportId, 'actioned')
    } catch {
      // ignore — the post is already removed, which is what matters
    }
    refresh()
  }

  async function dismissReport(reportId: string) {
    await resolveReport(reportId, 'dismissed')
    refresh()
  }

  async function postAnnouncement(body: string) {
    if (!user) return
    await createAnnouncement(user.id, body)
    refresh()
  }

  async function toggleAnnouncement(id: string, active: boolean) {
    await setAnnouncementActive(id, active)
    refresh()
  }

  async function removeAnnouncement(id: string) {
    await deleteAnnouncement(id)
    refresh()
  }

  return {
    isAdmin,
    loading,
    error,
    reports,
    announcements,
    removeReportedPost,
    dismissReport,
    postAnnouncement,
    toggleAnnouncement,
    removeAnnouncement,
    refresh,
  }
}
