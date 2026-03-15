import { GraphRow } from '@/types/graph';

// ── Tier colors (node fill — primary encoding) ───────────────────────────────
// Colorblind-safe palette; works on dark backgrounds
export const TIER_COLORS: Record<string, string> = {
  ELITE:          '#F59E0B', // amber/gold
  STRONG:         '#06B6D4', // teal/cyan
  AVERAGE:        '#94A3B8', // slate
  UNDERPERFORMER: '#F43F5E', // rose
  UNKNOWN:        '#4A4845', // near-invisible muted
};

export const TIER_COLORS_BRIGHT: Record<string, string> = {
  ELITE:          '#FCD34D',
  STRONG:         '#22D3EE',
  AVERAGE:        '#CBD5E1',
  UNDERPERFORMER: '#FB7185',
  UNKNOWN:        '#6B6966',
};

export function getTierColor(tier: string | null | undefined): string {
  if (!tier) return TIER_COLORS.UNKNOWN;
  return TIER_COLORS[tier] ?? TIER_COLORS.UNKNOWN;
}

export function getTierColorBright(tier: string | null | undefined): string {
  if (!tier) return TIER_COLORS_BRIGHT.UNKNOWN;
  return TIER_COLORS_BRIGHT[tier] ?? TIER_COLORS_BRIGHT.UNKNOWN;
}

// ── Role colors (node border — secondary encoding) ────────────────────────────
export const ROLE_COLORS: Record<GraphRow['entity_type'], string> = {
  OFFICER:     '#7C6FCD', // purple
  DIRECTOR:    '#0F9B77', // green
  OWNER_10PCT: '#C0522A', // orange
  FUND:        '#C98B1A', // amber
  UNKNOWN:     '#3A3835', // barely visible
};

export const ROLE_COLORS_BRIGHT: Record<GraphRow['entity_type'], string> = {
  OFFICER:     '#A89EE8',
  DIRECTOR:    '#14D4A1',
  OWNER_10PCT: '#E8764A',
  FUND:        '#F0AF2A',
  UNKNOWN:     '#6B6966',
};

export function getRoleColor(type: GraphRow['entity_type']): string {
  return ROLE_COLORS[type] ?? ROLE_COLORS.UNKNOWN;
}

export function getRoleColorBright(type: GraphRow['entity_type']): string {
  return ROLE_COLORS_BRIGHT[type] ?? ROLE_COLORS_BRIGHT.UNKNOWN;
}

// ── Company node ──────────────────────────────────────────────────────────────
export const COMPANY_COLOR        = '#1E6FBB';
export const COMPANY_COLOR_BRIGHT = '#3B9EF5';

// ── Legacy exports (used in GraphLegend / GraphTooltip) ───────────────────────
export const ENTITY_COLORS        = ROLE_COLORS;
export const ENTITY_COLORS_BRIGHT = ROLE_COLORS_BRIGHT;

// ── Dim state ─────────────────────────────────────────────────────────────────
export const DIM_COLOR      = '#1E1E1E';
export const DIM_EDGE_COLOR = '#181818';
export const DIM_BORDER_COLOR = '#252525';

// ── Misc ──────────────────────────────────────────────────────────────────────
export const CLUSTER_PULSE_COLOR = '#E8A020';

// Keep old name for any imports that still use it
export function getEntityColor(type: GraphRow['entity_type']): string {
  return ROLE_COLORS[type] ?? ROLE_COLORS.UNKNOWN;
}
