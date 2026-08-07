/**
 * Shared interaction classes.
 *
 * `focusRing` uses focus-visible so pointer users never see a ring, while
 * keyboard users always do. Tailwind v4's preflight sets `cursor: default` on
 * buttons, so `cursor-pointer` is added explicitly on anything clickable.
 */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white'

/** Minimum comfortable tap target — 44px per Apple HIG, 48dp per Material. */
export const tapTarget = 'min-h-[44px]'
