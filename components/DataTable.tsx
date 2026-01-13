'use client';

import { memo, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { ParsedLLMCall } from '@/types/insider';
import { FilterType, FILTER_TYPES, getRecommendationStyle } from '@/lib/constants';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { calculatePnL, getHoldingDays } from '@/lib/calculations';

/**
 * Table header cell component
 */
const TableHeader = memo(function TableHeader({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider text-left ${className}`}
      style={{
        color: 'var(--text-tertiary)',
        borderBottom: '1px solid var(--border-primary)',
      }}
    >
      {children}
    </th>
  );
});

/**
 * Recommendation badge component
 */
const RecommendationBadge = memo(function RecommendationBadge({
  recommendation,
}: {
  recommendation: string;
}) {
  const style = getRecommendationStyle(recommendation);

  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {recommendation}
    </span>
  );
});

/**
 * Individual table row component
 *
 * Memoized to prevent re-renders when other rows update
 */
const TableRow = memo(function TableRow({
  call,
  index,
  showRank,
  onRowClick,
}: {
  call: ParsedLLMCall;
  index: number;
  showRank: boolean;
  onRowClick: (call: ParsedLLMCall) => void;
}) {
  const pnl = calculatePnL(call);
  const holdingDays = getHoldingDays(call);

  const handleClick = useCallback(() => {
    onRowClick(call);
  }, [call, onRowClick]);

  return (
    <tr
      onClick={handleClick}
      className="table-row-animate cursor-pointer group table-row-hover"
      style={{
        animationDelay: `${index * 20}ms`,
        borderBottom: '1px solid var(--border-primary)',
      }}
    >
      {showRank && (
        <td className="py-3 px-4 text-center">
          <span
            className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full"
            style={{
              backgroundColor:
                index < 3 ? 'var(--text-primary)' : 'var(--bg-tertiary)',
              color: index < 3 ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
          >
            {index + 1}
          </span>
        </td>
      )}
      <td className="py-3 px-4">
        <span
          className="font-mono text-sm font-semibold tracking-wide"
          style={{ color: 'var(--text-primary)' }}
        >
          {call.ticker}
        </span>
      </td>
      <td className="py-3 px-4">
        <span
          className="text-sm truncate block max-w-[200px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {call.company_name || '—'}
        </span>
      </td>
      <td className="py-3 px-4">
        <span
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          {call.sector || '—'}
        </span>
      </td>
      <td className="py-3 px-4">
        <RecommendationBadge recommendation={call.recommendation} />
      </td>
      <td className="py-3 px-4 text-right">
        <div
          className="font-mono text-sm tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatCurrency(call.entry_price)}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {formatDate(call.entry_date)}
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <div
          className="font-mono text-sm tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatCurrency(call.current_price)}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {call.last_price_update ? formatDate(call.last_price_update) : '—'}
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        {pnl !== null ? (
          <span
            className="font-mono text-sm font-medium tabular-nums"
            style={{
              color: pnl >= 0 ? 'var(--accent-positive)' : 'var(--accent-negative)',
            }}
          >
            {pnl >= 0 ? '+' : ''}
            {pnl.toFixed(2)}%
          </span>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
        )}
      </td>
      <td className="py-3 px-4 text-right">
        <span
          className="font-mono text-sm tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {holdingDays !== null ? `${holdingDays}d` : '—'}
        </span>
      </td>
      <td className="py-3 px-4">
        <ChevronRight
          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-tertiary)' }}
        />
      </td>
    </tr>
  );
});

interface DataTableProps {
  calls: ParsedLLMCall[];
  filter: FilterType;
  onRowClick: (call: ParsedLLMCall) => void;
}

/**
 * Data table component for displaying LLM calls
 *
 * Features:
 * - Memoized rows to prevent unnecessary re-renders
 * - CSS-based hover states (no direct DOM manipulation)
 * - Proper accessibility with semantic table markup
 * - Stable keys using call.id
 */
export const DataTable = memo(function DataTable({
  calls,
  filter,
  onRowClick,
}: DataTableProps) {
  const showRank =
    filter === FILTER_TYPES.TOP_WINNERS || filter === FILTER_TYPES.TOP_LOSERS;

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
              {showRank && <TableHeader className="w-12 text-center">#</TableHeader>}
              <TableHeader className="min-w-[100px]">Ticker</TableHeader>
              <TableHeader className="min-w-[180px]">Company</TableHeader>
              <TableHeader className="min-w-[100px]">Sector</TableHeader>
              <TableHeader className="min-w-[100px]">Signal</TableHeader>
              <TableHeader className="text-right min-w-[100px]">Entry</TableHeader>
              <TableHeader className="text-right min-w-[100px]">Current Price</TableHeader>
              <TableHeader className="text-right min-w-[90px]">Return</TableHeader>
              <TableHeader className="text-right min-w-[80px]">Days</TableHeader>
              <TableHeader className="w-10" />
            </tr>
          </thead>
          <tbody>
            {calls.map((call, index) => (
              <TableRow
                key={call.id}
                call={call}
                index={index}
                showRank={showRank}
                onRowClick={onRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default DataTable;
