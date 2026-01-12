'use client';

import { memo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ParsedLLMCall } from '@/types/insider';
import { getRecommendationStyle } from '@/lib/constants';
import { formatDate, formatCurrency, formatCompactCurrency } from '@/lib/formatters';
import { calculatePnL, getHoldingDays } from '@/lib/calculations';
import { ErrorBoundary } from './ErrorBoundary';

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
 * Detail row for key-value pairs
 */
const DetailRow = memo(function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between text-sm">
      <dt style={{ color: 'var(--text-tertiary)' }}>{label}</dt>
      <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>
        {value}
      </dd>
    </div>
  );
});

/**
 * Tag component for insider names and dates
 */
const Tag = memo(function Tag({
  children,
  mono = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded ${mono ? 'font-mono' : ''}`}
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </span>
  );
});

interface CallDetailModalProps {
  call: ParsedLLMCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal content component (separated for error boundary)
 */
const ModalContent = memo(function ModalContent({
  call,
}: {
  call: ParsedLLMCall;
}) {
  const pnl = calculatePnL(call);
  const holdingDays = getHoldingDays(call);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Dialog.Title
              className="font-display text-2xl font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {call.ticker}
            </Dialog.Title>
            <RecommendationBadge recommendation={call.recommendation} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {call.company_name}
          </p>
        </div>
        <Dialog.Close asChild>
          <button
            className="p-2 rounded-md transition-colors"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </Dialog.Close>
      </div>

      {/* Price Summary */}
      <div
        className="grid grid-cols-3 gap-4 p-4 rounded-lg mb-6"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div>
          <div
            className="text-xs font-medium mb-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Entry Price
          </div>
          <div
            className="font-mono text-lg tabular-nums"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatCurrency(call.entry_price)}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {formatDate(call.entry_date)}
          </div>
        </div>
        <div>
          <div
            className="text-xs font-medium mb-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Current Price
          </div>
          <div
            className="font-mono text-lg tabular-nums"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatCurrency(call.current_price)}
          </div>
        </div>
        <div>
          <div
            className="text-xs font-medium mb-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Return
          </div>
          {pnl !== null ? (
            <div
              className="font-mono text-lg font-medium tabular-nums"
              style={{
                color:
                  pnl >= 0 ? 'var(--accent-positive)' : 'var(--accent-negative)',
              }}
            >
              {pnl >= 0 ? '+' : ''}
              {pnl.toFixed(2)}%
            </div>
          ) : (
            <div style={{ color: 'var(--text-tertiary)' }}>—</div>
          )}
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {holdingDays}d held
          </div>
        </div>
      </div>

      {/* Rationale */}
      {call.llm_rationale && (
        <div className="mb-6">
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Analysis
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {call.llm_rationale}
          </p>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Insider Activity
          </h3>
          <dl className="space-y-2">
            <DetailRow label="Insiders" value={call.number_of_insiders || 0} />
            <DetailRow
              label="Avg. Price"
              value={formatCurrency(call.insider_avg_price)}
            />
            <DetailRow
              label="Total Value"
              value={formatCompactCurrency(call.total_transaction_value || 0)}
            />
            <DetailRow label="Time Horizon" value={call.time_horizon || '—'} />
          </dl>

          {call.insider_names.length > 0 && (
            <div className="mt-4">
              <h4
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Names
              </h4>
              <div className="flex flex-wrap gap-1">
                {call.insider_names.map((name, idx) => (
                  <Tag key={`name-${idx}-${name}`}>{name}</Tag>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Market Patterns
          </h3>
          {call.market_patterns.length > 0 ? (
            <ul className="space-y-1">
              {call.market_patterns.map((pattern, idx) => (
                <li
                  key={`pattern-${idx}`}
                  className="text-sm flex items-start gap-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span style={{ color: 'var(--accent-neutral)' }}>•</span>
                  {pattern}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No patterns identified
            </p>
          )}

          {call.transaction_dates.length > 0 && (
            <div className="mt-4">
              <h4
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Transaction Dates
              </h4>
              <div className="flex flex-wrap gap-1">
                {call.transaction_dates.map((date, idx) => (
                  <Tag key={`date-${idx}-${date}`} mono>
                    {formatDate(date)}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metadata Footer */}
      <div
        className="mt-6 pt-4 flex items-center justify-between text-xs"
        style={{
          borderTop: '1px solid var(--border-primary)',
          color: 'var(--text-tertiary)',
        }}
      >
        <span>Call Date: {formatDate(call.call_date)}</span>
        {call.batch_id && <span>Batch: {call.batch_id}</span>}
      </div>
    </div>
  );
});

/**
 * Call detail modal component
 *
 * Displays comprehensive information about a single LLM call.
 * Wrapped with ErrorBoundary to gracefully handle render errors.
 */
export const CallDetailModal = memo(function CallDetailModal({
  call,
  open,
  onOpenChange,
}: CallDetailModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 animate-fade-in"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
        />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl animate-scale-in"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <ErrorBoundary>
            {call && <ModalContent call={call} />}
          </ErrorBoundary>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
});

export default CallDetailModal;
