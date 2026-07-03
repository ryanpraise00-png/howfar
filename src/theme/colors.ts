export const lightColors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary:        '#14213D',   // navy — app bars, sent bubbles
  primaryDark:    '#0B1530',   // darker navy — pressed states
  accent:         '#3D5AFE',   // indigo — FAB, active tab, send button, links
  accentLight:    '#7C8CFF',   // light indigo — subtle highlights
  accentAmber:    '#F2A93B',   // amber — unread badges, notifications
  // ── Surfaces ───────────────────────────────────────────────────────────────
  background:     '#FAFAF9',   // paper white
  surface:        '#FFFFFF',   // cards, input bars
  // ── Bubbles ────────────────────────────────────────────────────────────────
  bubbleIncoming: '#F1F2F6',   // light grey — received bubbles
  bubbleOutgoing: '#14213D',   // navy — sent bubbles
  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary:    '#1C1C1E',   // near black
  textSecondary:  '#6B7280',   // timestamps, subtitles
  textOnPrimary:  '#FFFFFF',   // text on navy / indigo surfaces
  // ── UI ─────────────────────────────────────────────────────────────────────
  border:         '#ECECEA',   // hairlines, dividers
  success:        '#4ADE80',   // online dot
  error:          '#EF4444',   // block, report, delete
  tabActive:      '#3D5AFE',   // active tab icon/label
  tabInactive:    '#6B7280',   // inactive tab icon/label
  // ── Backward-compat aliases ────────────────────────────────────────────────
  accentTeal:     '#3D5AFE',   // was teal — now maps to accent indigo
  bubbleSent:     '#14213D',   // alias for bubbleOutgoing
} as const;

export const darkColors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary:        '#1E2A4A',   // lighter navy for dark bg
  primaryDark:    '#14213D',
  accent:         '#3D5AFE',
  accentLight:    '#7C8CFF',
  accentAmber:    '#F2A93B',
  // ── Surfaces ───────────────────────────────────────────────────────────────
  background:     '#0B0F1A',   // very dark navy background
  surface:        '#141B2D',   // dark navy cards
  // ── Bubbles ────────────────────────────────────────────────────────────────
  bubbleIncoming: '#1A2238',   // dark incoming bubble
  bubbleOutgoing: '#3D5AFE',   // indigo outgoing bubble in dark mode
  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary:    '#F0F2FF',   // near white
  textSecondary:  '#8892B0',   // muted blue-grey
  textOnPrimary:  '#FFFFFF',
  // ── UI ─────────────────────────────────────────────────────────────────────
  border:         '#1E2A4A',
  success:        '#4ADE80',
  error:          '#EF4444',
  tabActive:      '#3D5AFE',
  tabInactive:    '#8892B0',
  // ── Backward-compat aliases ────────────────────────────────────────────────
  accentTeal:     '#3D5AFE',
  bubbleSent:     '#3D5AFE',
} as const;

export type AppColors = { [K in keyof typeof lightColors]: string };
