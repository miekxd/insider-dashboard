'use client';

import React, { memo } from 'react';
import { ROLE_COLORS, COMPANY_COLOR, TIER_COLORS } from '@/lib/graphColors';

const TIER_ITEMS = [
  { label: 'Elite',          color: TIER_COLORS.ELITE },
  { label: 'Strong',         color: TIER_COLORS.STRONG },
  { label: 'Average',        color: TIER_COLORS.AVERAGE },
  { label: 'Underperformer', color: TIER_COLORS.UNDERPERFORMER },
  { label: 'Unknown',        color: TIER_COLORS.UNKNOWN },
];

const ROLE_ITEMS = [
  { label: 'Officer',   color: ROLE_COLORS.OFFICER },
  { label: 'Director',  color: ROLE_COLORS.DIRECTOR },
  { label: '10% Owner', color: ROLE_COLORS.OWNER_10PCT },
  { label: 'Fund',      color: ROLE_COLORS.FUND },
];

export const GraphLegend = memo(function GraphLegend() {
  return (
    <div
      className="absolute bottom-4 left-4 flex flex-col gap-1.5 px-3 py-2.5 rounded-lg"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 10,
      }}
    >
      {/* Tier = fill color */}
      <span className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Tier (fill)</span>
      {TIER_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.label}</span>
        </div>
      ))}

      {/* Role = border ring */}
      <div className="mt-2 pt-1.5" style={{ borderTop: '1px solid var(--border-primary)' }}>
        <span className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Role (ring)</span>
        {ROLE_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2 mt-1">
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: 'transparent',
              border: `2px solid ${item.color}`,
              flexShrink: 0,
            }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1">
          <div style={{
            width: 10, height: 10, borderRadius: 2,
            backgroundColor: COMPANY_COLOR,
            flexShrink: 0,
          }} />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Company</span>
        </div>
      </div>

      <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--border-primary)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Size = buy value × tier</span>
      </div>
    </div>
  );
});
