import { GraphRow } from '@/types/graph';

export const ENTITY_COLORS: Record<GraphRow['entity_type'], string> = {
  OFFICER: '#7C6FCD',
  DIRECTOR: '#0F9B77',
  OWNER_10PCT: '#C0522A',
  UNKNOWN: '#6B6966',
  FUND: '#C98B1A',
};

export const COMPANY_COLOR = '#1E6FBB';

// Highlighted (selected/hovered) variants — brighter
export const ENTITY_COLORS_BRIGHT: Record<GraphRow['entity_type'], string> = {
  OFFICER: '#A89EE8',
  DIRECTOR: '#14D4A1',
  OWNER_10PCT: '#E8764A',
  UNKNOWN: '#9C9896',
  FUND: '#F0AF2A',
};

export const COMPANY_COLOR_BRIGHT = '#3B9EF5';

export const CLUSTER_PULSE_COLOR = '#E8A020'; // amber for coordinated clusters

export const TIER_COLORS: Record<string, string> = {
  ELITE:         '#F5C842', // gold
  STRONG:        '#22C55E', // green
  AVERAGE:       '#60A5FA', // blue
  UNDERPERFORMER:'#F87171', // red
  UNKNOWN:       '#6B6966', // muted
};

export function getTierColor(tier: string | null | undefined): string {
  if (!tier) return TIER_COLORS.UNKNOWN;
  return TIER_COLORS[tier] ?? TIER_COLORS.UNKNOWN;
}

// Dimmed color when another node is focused
export const DIM_COLOR = '#2A2A2A';
export const DIM_EDGE_COLOR = '#1F1F1F';

export function getEntityColor(type: GraphRow['entity_type']): string {
  return ENTITY_COLORS[type] ?? ENTITY_COLORS.UNKNOWN;
}
