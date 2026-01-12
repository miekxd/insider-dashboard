'use client';

import { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  trend?: 'up' | 'down';
  subtitle?: string;
}

/**
 * Individual stat card displaying a metric
 *
 * Memoized to prevent unnecessary re-renders when parent updates
 */
const StatCard = memo(function StatCard({
  label,
  value,
  trend,
  subtitle,
}: StatCardProps) {
  return (
    <div>
      <div
        className="text-xs font-medium mb-1"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="font-mono text-xl font-semibold tabular-nums"
          style={{
            color:
              trend === 'up'
                ? 'var(--accent-positive)'
                : trend === 'down'
                ? 'var(--accent-negative)'
                : 'var(--text-primary)',
          }}
        >
          {value}
        </span>
        {trend && (
          trend === 'up' ? (
            <TrendingUp
              className="w-4 h-4"
              style={{ color: 'var(--accent-positive)' }}
            />
          ) : (
            <TrendingDown
              className="w-4 h-4"
              style={{ color: 'var(--accent-negative)' }}
            />
          )
        )}
      </div>
      {subtitle && (
        <div
          className="text-xs mt-0.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
});

interface StatsRowProps {
  avgPnL: number;
  totalValue: number;
  strongBuyCount: number;
  totalCalls: number;
  winRate: number;
  winCount: number;
  callsWithPnL: number;
  formatCompactCurrency: (value: number) => string;
}

/**
 * Stats row displaying key metrics
 *
 * Memoized to prevent re-renders when unrelated state changes
 */
export const StatsRow = memo(function StatsRow({
  avgPnL,
  totalValue,
  strongBuyCount,
  totalCalls,
  winRate,
  winCount,
  callsWithPnL,
  formatCompactCurrency,
}: StatsRowProps) {
  return (
    <div
      className="border-b"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
      }}
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <StatCard
            label="Average Return"
            value={`${avgPnL >= 0 ? '+' : ''}${avgPnL.toFixed(2)}%`}
            trend={avgPnL >= 0 ? 'up' : 'down'}
          />
          <StatCard
            label="Insider Volume"
            value={formatCompactCurrency(totalValue)}
          />
          <StatCard
            label="Strong Buys"
            value={strongBuyCount.toString()}
            subtitle={totalCalls > 0 ? `${((strongBuyCount / totalCalls) * 100).toFixed(0)}% of total` : '0%'}
          />
          <StatCard
            label="Win Rate"
            value={`${winRate.toFixed(0)}%`}
            subtitle={`${winCount} of ${callsWithPnL}`}
          />
        </div>
      </div>
    </div>
  );
});

export default StatsRow;
