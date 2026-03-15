'use client';

import React, { memo } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InsiderNodeAttributes } from '@/types/graph';
import { getTierColor, getRoleColor } from '@/lib/graphColors';
import { useInsiderMetrics } from '@/hooks/useInsiderMetrics';

interface InsiderDetailPanelProps {
  attrs: InsiderNodeAttributes | null;
  onClose: () => void;
}

function fmt$(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

const ENTITY_LABEL: Record<string, string> = {
  OFFICER: 'Officer', DIRECTOR: 'Director',
  OWNER_10PCT: '10% Owner', FUND: 'Fund', UNKNOWN: 'Unknown',
};

export const InsiderDetailPanel = memo(function InsiderDetailPanel({ attrs, onClose }: InsiderDetailPanelProps) {
  const { metrics, loading } = useInsiderMetrics(attrs?.canonical_name ?? null);

  if (!attrs) return null;

  const tier      = attrs.insider_tier && attrs.insider_tier !== 'UNKNOWN' ? attrs.insider_tier : null;
  const tierColor = tier ? getTierColor(tier) : '#6B6966';
  const roleColor = getRoleColor(attrs.entity_type);

  return (
    <div
      className="absolute top-0 right-0 h-full flex flex-col overflow-hidden z-20"
      style={{
        width: 300,
        backgroundColor: 'var(--bg-elevated)',
        borderLeft: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
            {attrs.canonical_name}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {tier && (
              <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                style={{ backgroundColor: tierColor + '20', color: tierColor }}>
                {tier}
              </span>
            )}
            <span className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: roleColor + '20', color: roleColor }}>
              {ENTITY_LABEL[attrs.entity_type] ?? attrs.entity_type}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : !metrics ? (
          <div className="flex flex-col items-center justify-center h-24 gap-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No tracked trades</span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Prices not yet collected for this insider's tickers</span>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatCard label="Win Rate" value={`${(metrics.win_rate * 100).toFixed(0)}%`}
                sub={`${Math.round(metrics.win_rate * metrics.trade_count)}/${metrics.trade_count} trades`}
                positive={metrics.win_rate >= 0.5} />
              <StatCard label="Avg Return" value={fmtPct(metrics.avg_return)}
                positive={metrics.avg_return > 0} negative={metrics.avg_return < 0} />
              <StatCard label="Best Trade" value={fmtPct(metrics.best_return)} positive />
              <StatCard label="Worst Trade" value={fmtPct(metrics.worst_return)} negative />
            </div>

            <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total invested (tracked)</span>
              <div className="text-sm font-mono font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {fmt$(metrics.total_invested)}
              </div>
            </div>

            {/* Trade list */}
            <span className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Trades with price data ({metrics.trades.length})
            </span>
            <div className="flex flex-col gap-1">
              {metrics.trades.map((t, i) => (
                <TradeRow key={i} trade={t} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

function StatCard({ label, value, sub, positive, negative }: {
  label: string; value: string; sub?: string;
  positive?: boolean; negative?: boolean;
}) {
  const color = positive ? '#22C55E' : negative ? '#F43F5E' : 'var(--text-primary)';
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-lg"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-mono font-bold" style={{ color }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{sub}</span>}
    </div>
  );
}

function TradeRow({ trade }: { trade: import('@/hooks/useInsiderMetrics').TradeOutcome }) {
  const positive = trade.return_pct > 0;
  const negative = trade.return_pct < 0;
  const color = positive ? '#22C55E' : negative ? '#F43F5E' : 'var(--text-muted)';
  const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
          {trade.ticker}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {fmtDate(trade.transaction_date)} · {fmt$(trade.entry_price)} → {fmt$(trade.current_price)}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {fmtPct(trade.return_pct)}
        </span>
      </div>
    </div>
  );
}
