'use client';

import React, { memo } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CompanyAttrs } from '@/types/graph';
import { getTierColor, getRoleColor } from '@/lib/graphColors';
import { useCompanyMetrics } from '@/hooks/useCompanyMetrics';

interface CompanyDetailPanelProps {
  attrs: CompanyAttrs | null;
  onClose: () => void;
}

function fmt$(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

const ENTITY_LABEL: Record<string, string> = {
  OFFICER: 'Officer', DIRECTOR: 'Director',
  OWNER_10PCT: '10%', FUND: 'Fund', UNKNOWN: '—',
};

export const CompanyDetailPanel = memo(function CompanyDetailPanel({ attrs, onClose }: CompanyDetailPanelProps) {
  const { metrics, loading } = useCompanyMetrics(attrs?.ticker ?? null);

  if (!attrs) return null;

  const priceUp = (metrics?.price_change_pct ?? 0) >= 0;
  const PriceIcon = priceUp ? TrendingUp : TrendingDown;
  const priceColor = priceUp ? '#22C55E' : '#F43F5E';

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
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>
              {attrs.ticker}
            </span>
            {attrs.exchange && (
              <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                {attrs.exchange}
              </span>
            )}
            {metrics?.current_price != null && (
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                  ${metrics.current_price.toFixed(2)}
                </span>
                {metrics.price_change_pct != null && (
                  <div className="flex items-center gap-0.5">
                    <PriceIcon className="w-3 h-3" style={{ color: priceColor }} />
                    <span className="text-xs font-mono font-bold" style={{ color: priceColor }}>
                      {fmtPct(metrics.price_change_pct)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
            {attrs.company_name}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {attrs.sector && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{attrs.sector}</span>
            )}
            {attrs.industry && attrs.industry !== attrs.sector && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{attrs.industry}</span>
              </>
            )}
          </div>
        </div>
        <button onClick={onClose} className="shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border-primary)' }}>
        {attrs.market_cap != null && (
          <StatCard label="Market Cap" value={fmt$(attrs.market_cap)} />
        )}
        <StatCard label="Total Bought" value={fmt$(attrs.company_total_buy_value)} />
        <StatCard label="Buy Txns" value={String(attrs.total_buy_transactions)} />
        <StatCard label="Insiders" value={String(attrs.unique_insiders_bought)} />
        {attrs.avg_return_pct != null && (
          <StatCard
            label="Avg Return"
            value={fmtPct(attrs.avg_return_pct)}
            positive={attrs.avg_return_pct > 0}
            negative={attrs.avg_return_pct < 0}
          />
        )}
        {attrs.last_insider_buy_date && (
          <StatCard label="Last Buy" value={fmtDate(attrs.last_insider_buy_date)} />
        )}
      </div>

      {/* Description */}
      {attrs.description && (
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-tertiary)' }}>
            {attrs.description}
          </p>
        </div>
      )}

      {/* Insider list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <span className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>
          Active insiders
        </span>

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : !metrics?.insiders.length ? (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No insider data</span>
        ) : (
          <div className="flex flex-col gap-1">
            {metrics.insiders.map((ins, i) => {
              const tierColor = ins.insider_tier && ins.insider_tier !== 'UNKNOWN'
                ? getTierColor(ins.insider_tier) : '#6B6966';
              const roleColor = getRoleColor(ins.entity_type);
              const hasReturn = ins.avg_return_pct != null;
              const retColor = hasReturn
                ? ins.avg_return_pct! > 0 ? '#22C55E' : '#F43F5E'
                : 'var(--text-muted)';

              return (
                <div key={i} className="flex flex-col gap-1 px-2 py-2 rounded"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)', maxWidth: 160 }}>
                      {ins.canonical_name}
                    </span>
                    <span className="text-xs font-mono font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>
                      {fmt$(ins.total_buy_value)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs px-1 rounded" style={{ backgroundColor: roleColor + '20', color: roleColor }}>
                        {ENTITY_LABEL[ins.entity_type] ?? ins.entity_type}
                      </span>
                      {ins.insider_tier && ins.insider_tier !== 'UNKNOWN' && (
                        <span className="text-xs px-1 rounded font-bold" style={{ backgroundColor: tierColor + '20', color: tierColor }}>
                          {ins.insider_tier}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasReturn && (
                        <span className="text-xs font-mono font-bold" style={{ color: retColor }}>
                          {fmtPct(ins.avg_return_pct!)}
                        </span>
                      )}
                      {ins.last_filing_date && (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {fmtDate(ins.last_filing_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

function StatCard({ label, value, positive, negative }: {
  label: string; value: string; positive?: boolean; negative?: boolean;
}) {
  const color = positive ? '#22C55E' : negative ? '#F43F5E' : 'var(--text-primary)';
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-mono font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
