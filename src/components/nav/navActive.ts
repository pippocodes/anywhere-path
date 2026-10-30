/** True when the current path falls under a nav item's secondary route (e.g. "My Learning" should stay highlighted on /roadmap too, not just /learning). */
export function isForcedActive(pathname: string, extraActiveOn: string | undefined): boolean {
  return !!extraActiveOn && pathname.startsWith(extraActiveOn)
}
