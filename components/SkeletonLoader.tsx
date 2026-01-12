'use client';

import { memo } from 'react';

/**
 * Skeleton row for table loading state
 *
 * Matches the height and structure of actual table rows
 * to prevent Cumulative Layout Shift (CLS)
 */
const SkeletonRow = memo(function SkeletonRow({ index }: { index: number }) {
  return (
    <tr
      className="animate-pulse"
      style={{
        borderBottom: '1px solid var(--border-primary)',
        animationDelay: `${index * 50}ms`,
      }}
    >
      <td className="py-3 px-4">
        <div
          className="h-5 w-16 rounded"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
      </td>
      <td className="py-3 px-4">
        <div
          className="h-5 w-32 rounded"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
      </td>
      <td className="py-3 px-4">
        <div
          className="h-5 w-20 rounded"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
      </td>
      <td className="py-3 px-4 text-right">
        <div
          className="h-5 w-16 rounded ml-auto"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
      </td>
      <td className="py-3 px-4 text-right">
        <div
          className="h-5 w-16 rounded ml-auto"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
      </td>
      <td className="py-3 px-4 text-right">
        <div
          className="h-5 w-14 rounded ml-auto"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
      </td>
      <td className="py-3 px-4 text-right">
        <div
          className="h-5 w-10 rounded ml-auto"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
      </td>
      <td className="py-3 px-4">
        <div
          className="h-5 w-5 rounded"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
      </td>
    </tr>
  );
});

interface SkeletonLoaderProps {
  rows?: number;
}

/**
 * Table skeleton loader component
 *
 * Displays animated placeholder rows while data is loading.
 * Prevents layout shift by matching actual table dimensions.
 *
 * @param rows - Number of skeleton rows to display (default: 10)
 */
export const SkeletonLoader = memo(function SkeletonLoader({
  rows = 10,
}: SkeletonLoaderProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-primary)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
              {['Ticker', 'Company', 'Signal', 'Entry', 'Current', 'Return', 'Days', ''].map(
                (header, i) => (
                  <th
                    key={i}
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider ${
                      i >= 3 && i < 7 ? 'text-right' : 'text-left'
                    }`}
                    style={{
                      color: 'var(--text-tertiary)',
                      borderBottom: '1px solid var(--border-primary)',
                    }}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <SkeletonRow key={index} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default SkeletonLoader;
