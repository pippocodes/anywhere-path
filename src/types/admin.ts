import type { Post, ReportReason } from './posts'

export type ReportStatus = 'open' | 'reviewed' | 'dismissed' | 'actioned'

export interface Report {
  id: string
  reporterId: string
  postId: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}

/** One open report, joined with the reported post (null if its author already deleted it outright) and both usernames — everything the admin page needs to show one row. */
export interface ReportWithPost {
  report: Report
  reporterUsername: string
  post: Post | null
  authorUsername: string
}

export interface Announcement {
  id: string
  authorId: string
  body: string
  active: boolean
  createdAt: string
}
