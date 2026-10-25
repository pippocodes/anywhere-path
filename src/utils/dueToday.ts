/**
 * Shared by every "Today" reminder source (plan steps, course topics, roadmap
 * outline steps) — schedulePlanSteps/scheduleCourse/scheduleOutline all
 * produce items with this same {startDate, endDate} range shape, even though
 * they're otherwise separate, non-shared implementations (see courseScheduler.ts).
 */
export function isDueToday(item: { startDate: string; endDate: string }, today: string): boolean {
  return item.startDate <= today && today <= item.endDate
}
