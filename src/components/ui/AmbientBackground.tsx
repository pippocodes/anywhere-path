/**
 * Replaces the old floating-3D-shapes hero effect: two huge, slowly-drifting
 * blurred gradient orbs plus a faint film-grain overlay, mounted once at the
 * app root so every page gets the same quiet depth. Pure CSS (see
 * .ambient-orb / .ambient-grain in index.css) — no WebGL, no per-frame JS,
 * and the drift animation is already disabled under prefers-reduced-motion.
 */
function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden>
      <div className="ambient-orb ambient-orb--rose" />
      <div className="ambient-orb ambient-orb--violet" />
      <div className="ambient-grain" />
    </div>
  )
}

export default AmbientBackground
