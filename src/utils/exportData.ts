import type { AppData } from '../types'

/** The full export payload: everything in AppData, plus when it was generated. */
export function buildExportPayload(data: AppData, exportedAt: Date = new Date()) {
  return { exportedAt: exportedAt.toISOString(), ...data }
}
