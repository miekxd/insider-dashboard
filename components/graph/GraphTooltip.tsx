'use client';

import React, { memo } from 'react';
import { InsiderNodeAttributes, CompanyNodeAttributes, EdgeAttributes } from '@/types/graph';
import { ENTITY_COLORS, getTierColor } from '@/lib/graphColors';

interface TooltipPosition {
  x: number;
  y: number;
}

interface InsiderTooltipData {
  type: 'insider';
  attrs: InsiderNodeAttributes;
}

interface CompanyTooltipData {
  type: 'company';
  attrs: CompanyNodeAttributes;
}

interface EdgeTooltipData {
  type: 'edge';
  attrs: EdgeAttributes;
}

export type TooltipData = InsiderTooltipData | CompanyTooltipData | EdgeTooltipData;

interface GraphTooltipProps {
  data: TooltipData | null;
  position: TooltipPosition;
}

function formatCurrency(v: number | null | undefined): string {
  if (!v) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function entityLabel(type: string): string {
  const map: Record<string, string> = {
    OFFICER: 'Officer',
    DIRECTOR: 'Director',
    OWNER_10PCT: '10% Owner',
    FUND: 'Fund',
    UNKNOWN: 'Unknown',
  };
  return map[type] ?? type;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between gap-6 items-baseline">
    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
    <span className="text-xs font-mono text-right" style={{ color: 'var(--text-primary)' }}>{value}</span>
  </div>
);

const Divider = () => (
  <div className="my-2" style={{ borderTop: '1px solid var(--border-primary)' }} />
);

export const GraphTooltip = memo(function GraphTooltip({ data, position }: GraphTooltipProps) {
  if (!data) return null;

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x + 14,
    top: position.y - 10,
    zIndex: 9999,
    pointerEvents: 'none',
    minWidth: 220,
    maxWidth: 280,
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-secondary)',
    borderRadius: 8,
    padding: '10px 12px',
    boxShadow: 'var(--shadow-lg)',
  };

  if (data.type === 'insider') {
    const a = data.attrs;
    const entityColor = ENTITY_COLORS[a.entity_type] ?? '#6B6966';
    const tier = (!a.insider_tier || a.insider_tier === 'UNKNOWN') ? null : a.insider_tier;
    const tierColor = tier ? getTierColor(tier) : null;
    return (
      <div style={tooltipStyle}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {a.canonical_name}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {tier && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: tierColor + '25', color: tierColor, fontWeight: 700, letterSpacing: '0.02em' }}
              >
                {tier}
              </span>
            )}
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: entityColor + '22', color: entityColor, fontWeight: 600 }}
            >
              {entityLabel(a.entity_type)}
            </span>
          </div>
        </div>
        <Divider />
        <div className="flex flex-col gap-1">
          <Row label="Total bought" value={formatCurrency(a.total_buy_value)} />
          <Row label="Companies" value={a.unique_tickers_bought} />
          <Row label="Transactions" value={a.total_buy_transactions} />
          <Row label="Buy/Sell ratio" value={a.buy_sell_ratio != null ? a.buy_sell_ratio.toFixed(1) : '—'} />
          <Row label="Active" value={`${formatDate(a.active_since)} → ${formatDate(a.last_transaction_date)}`} />
        </div>
      </div>
    );
  }

  if (data.type === 'company') {
    const a = data.attrs;
    return (
      <div style={tooltipStyle}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
            {a.ticker}
          </span>
          {a.unique_insiders_bought >= 2 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded shrink-0"
              style={{ backgroundColor: '#E8A02022', color: '#E8A020', fontWeight: 600 }}
            >
              {a.unique_insiders_bought} insiders
            </span>
          )}
        </div>
        <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{a.company_name}</div>
        <Divider />
        <div className="flex flex-col gap-1">
          {a.sector && <Row label="Sector" value={a.sector} />}
          <Row label="Total buy value" value={formatCurrency(a.company_total_buy_value)} />
          <Row label="Insiders buying" value={a.unique_insiders_bought} />
        </div>
      </div>
    );
  }

  // Edge
  const a = data.attrs;
  const roleTag = a.is_officer ? 'Officer' : a.is_director ? 'Director' : a.is_ten_percent_owner ? '10% Owner' : null;
  return (
    <div style={tooltipStyle}>
      <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {a.insiderName} → {a.ticker}
      </div>
      <Divider />
      <div className="flex flex-col gap-1">
        {a.title && <Row label="Title" value={a.title} />}
        {roleTag && <Row label="Role" value={roleTag} />}
        <Row label="Transactions" value={`${a.buy_count} buys`} />
        <Row label="Value" value={formatCurrency(a.edge_value)} />
        {a.avg_buy_price && <Row label="Avg entry" value={`$${a.avg_buy_price.toFixed(2)}`} />}
        <Row label="Last filed" value={formatDate(a.last_filing_date)} />
      </div>
    </div>
  );
});
