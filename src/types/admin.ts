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

/** A post an admin has removed, joined with its author's username — for the "Recently removed" list, where an admin can undo their own removal. */
export interface RemovedPost {
  post: Post
  authorUsername: string
}

export interface Announcement {
  id: string
  authorId: string
  body: string
  active: boolean
  createdAt: string
}
