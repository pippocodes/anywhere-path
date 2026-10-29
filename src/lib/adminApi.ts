import { supabase } from './supabaseClient'
import { usernamesFor } from './friendsApi'
import { mapPost, type PostRow } from './postsApi'
import type { Announcement, Report, ReportStatus, ReportWithPost } from '../types/admin'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

/** Whether the signed-in user is an admin — backed by is_admin(), which checks the admin_users table (no client-side flag is ever trusted; every admin-only write below is ALSO checked server-side by the same function, so this is for the UI's own benefit only). */
export async function checkIsAdmin(): Promise<boolean> {
  const client = requireClient()
  const { data, error } = await client.rpc('is_admin')
  if (error) throw error
  return !!data
}

type ReportRow = {
  id: string
  reporter_id: string
  post_id: string
  reason: Report['reason']
  details: string | null
  status: ReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

function mapReport(r: ReportRow): Report {
  return {
    id: r.id,
    reporterId: r.reporter_id,
    postId: r.post_id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    createdAt: r.created_at,
  }
}

/** Every open report, each joined with its post (null if the author already deleted it) and both usernames. Only returns anything at all for an actual admin — reports_select and posts_select_admin_reported both gate on is_admin() server-side. */
export async function fetchOpenReports(): Promise<ReportWithPost[]> {
  const client = requireClient()

  const { data: reportRows, error: reportsError } = await client
    .from('reports')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
  if (reportsError) throw reportsError
  const reports = ((reportRows ?? []) as ReportRow[]).map(mapReport)
  if (reports.length === 0) return []

  const postIds = [...new Set(reports.map((r) => r.postId))]
  const { data: postRows, error: postsError } = await client.from('posts').select('*').in('id', postIds)
  if (postsError) throw postsError
  const postsById = new Map(((postRows ?? []) as PostRow[]).map(mapPost).map((p) => [p.id, p]))

  const userIds = [...reports.map((r) => r.reporterId), ...[...postsById.values()].map((p) => p.userId)]
  const usernames = await usernamesFor(userIds)

  return reports.map((report) => {
    const post = postsById.get(report.postId) ?? null
    return {
      report,
      reporterUsername: usernames.get(report.reporterId) ?? '(unknown)',
      post,
      authorUsername: post ? usernames.get(post.userId) ?? '(unknown)' : '(deleted)',
    }
  })
}

export async function resolveReport(reportId: string, status: ReportStatus): Promise<void> {
  const client = requireClient()
  const { error } = await client.rpc('admin_resolve_report', { p_report_id: reportId, p_status: status })
  if (error) throw error
}

export async function removePost(postId: string, reason: string | null): Promise<void> {
  const client = requireClient()
  const { error } = await client.rpc('admin_remove_post', { p_post_id: postId, p_reason: reason })
  if (error) throw error
}

type AnnouncementRow = { id: string; author_id: string; body: string; active: boolean; created_at: string }

function mapAnnouncement(r: AnnouncementRow): Announcement {
  return { id: r.id, authorId: r.author_id, body: r.body, active: r.active, createdAt: r.created_at }
}

/** Every announcement, active or retired — an admin sees both (announcements_select), a regular caller only the active ones. Used by both the admin page and the public banner below. */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const client = requireClient()
  const { data, error } = await client.from('announcements').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as AnnouncementRow[]).map(mapAnnouncement)
}

/** The single most recent active announcement, for the public banner — returns null for a non-admin with nothing active, same as "no announcement" (announcements_select already restricts a non-admin to active rows only). */
export async function fetchActiveAnnouncement(): Promise<Announcement | null> {
  const announcements = await fetchAnnouncements()
  return announcements.find((a) => a.active) ?? null
}

export async function createAnnouncement(authorId: string, body: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('announcements').insert({ author_id: authorId, body })
  if (error) throw error
}

export async function setAnnouncementActive(id: string, active: boolean): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('announcements').update({ active }).eq('id', id)
  if (error) throw error
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('announcements').delete().eq('id', id)
  if (error) throw error
}
