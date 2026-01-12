/**
 * Application constants
 *
 * Centralized location for magic strings, configuration values,
 * and type definitions used throughout the application.
 */

/**
 * Filter types for the calls table
 */
export const FILTER_TYPES = {
  ALL: 'all',
  TOP_WINNERS: 'top-winners',
  TOP_LOSERS: 'top-losers',
} as const;

export type FilterType = typeof FILTER_TYPES[keyof typeof FILTER_TYPES];

/**
 * Filter options for the UI
 */
export const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: FILTER_TYPES.ALL, label: 'All Positions' },
  { key: FILTER_TYPES.TOP_WINNERS, label: 'Top Winners' },
  { key: FILTER_TYPES.TOP_LOSERS, label: 'Top Losers' },
];

/**
 * Number of items to show in top winners/losers
 */
export const TOP_LIST_LIMIT = 20;

/**
 * Debounce delay for refresh button (ms)
 */
export const REFRESH_DEBOUNCE_MS = 2000;

/**
 * Recommendation types
 */
export const RECOMMENDATIONS = {
  STRONG_BUY: 'STRONG BUY',
  BUY: 'BUY',
  WATCH: 'WATCH',
} as const;

export type RecommendationType = typeof RECOMMENDATIONS[keyof typeof RECOMMENDATIONS];

/**
 * Gets the styling for a recommendation badge
 */
export function getRecommendationStyle(recommendation: string): {
  bg: string;
  color: string;
} {
  switch (recommendation) {
    case RECOMMENDATIONS.STRONG_BUY:
      return { bg: 'var(--accent-positive-muted)', color: 'var(--accent-positive)' };
    case RECOMMENDATIONS.BUY:
      return { bg: 'var(--accent-neutral-muted)', color: 'var(--accent-neutral)' };
    case RECOMMENDATIONS.WATCH:
      return { bg: 'var(--accent-warning-muted)', color: 'var(--accent-warning)' };
    default:
      return { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
  }
}
