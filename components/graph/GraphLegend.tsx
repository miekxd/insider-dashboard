'use client';

import React, { memo } from 'react';
import { ROLE_COLORS, COMPANY_COLOR, COMPANY_COLOR_BRIGHT, TIER_COLORS } from '@/lib/graphColors';

const TIER_ITEMS = [
  { label: 'Elite',    color: TIER_COLORS.ELITE },
  { label: 'Strong',   color: TIER_COLORS.STRONG },
  { label: 'Average',  color: TIER_COLORS.AVERAGE },
  { label: 'Under',    color: TIER_COLORS.UNDERPERFORMER },
  { label: 'Unknown',  color: TIER_COLORS.UNKNOWN },
];

const ROLE_ITEMS = [
  { label: 'Officer',   color: ROLE_COLORS.OFFICER },
  { label: 'Director',  color: ROLE_COLORS.DIRECTOR },
  { label: '10% Owner', color: ROLE_COLORS.OWNER_10PCT },
  { label: 'Fund',      color: ROLE_COLORS.FUND },
];

function Circle({ fill, ring }: { fill?: string; ring?: string }) {
  return (
    <div style={{
      width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
      backgroundColor: fill ?? 'transparent',
      border: ring ? `2px solid ${ring}` : '2px solid transparent',
    }} />
  );
}

function Diamond({ fill, ring }: { fill?: string; ring?: string }) {
  return (
    <div style={{
      width: 9, height: 9, flexShrink: 0,
      backgroundColor: fill ?? 'transparent',
      border: ring ? `1.5px solid ${ring}` : 'none',
      transform: 'rotate(45deg)',
    }} />
  );
}

export const GraphLegend = memo(function GraphLegend() {
  return (
    <div
      className="absolute bottom-4 left-4 flex gap-4 px-3 py-2.5 rounded-lg"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 10,
      }}
    >
      {/* Tier column */}
      <div className="flex flex-col gap-1">
        <span className="text-xs mb-0.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Tier (fill)</span>
        {TIER_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <Circle fill={item.color} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, backgroundColor: 'var(--border-primary)', alignSelf: 'stretch' }} />

      {/* Role column */}
      <div className="flex flex-col gap-1">
        <span className="text-xs mb-0.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Role (ring)</span>
        {ROLE_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <Circle ring={item.color} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-1">
          <Diamond fill={COMPANY_COLOR} ring={COMPANY_COLOR_BRIGHT} />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Company</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, backgroundColor: 'var(--border-primary)', alignSelf: 'stretch' }} />

      {/* Size hint */}
      <div className="flex flex-col justify-center gap-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: 72, lineHeight: 1.4 }}>
          Size = buy value × tier
        </span>
      </div>
    </div>
  );
});
