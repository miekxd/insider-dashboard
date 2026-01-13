/**
 * Formatting utilities for the Insider Dashboard
 *
 * These functions handle consistent formatting of dates, currencies,
 * and other display values throughout the application.
 */

/**
 * Formats a date to a readable string (e.g., "12 Jan 2024")
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formats a number as USD currency (e.g., "$1,234.56")
 * @param value - Number to format, or null
 * @returns Formatted currency string or em-dash for null
 */
export function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

/**
 * Formats large numbers in compact form (e.g., "$1.5M", "$500K")
 * @param value - Number to format
 * @returns Compact currency string
 */
export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Formats a percentage with sign (e.g., "+12.34%" or "-5.67%")
 * @param value - Percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string with sign
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Formats market cap in readable form (e.g., "$1.50B", "$250.00M")
 * @param value - Market cap in dollars
 * @returns Formatted market cap string
 */
export function formatMarketCap(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
}
