'use client';

import React, { memo } from 'react';
import { ENTITY_COLORS, COMPANY_COLOR, TIER_COLORS } from '@/lib/graphColors';

const ROLE_ITEMS = [
  { label: 'Officer', color: ENTITY_COLORS.OFFICER },
  { label: 'Director', color: ENTITY_COLORS.DIRECTOR },
  { label: '10% Owner', color: ENTITY_COLORS.OWNER_10PCT },
  { label: 'Unknown', color: ENTITY_COLORS.UNKNOWN },
  { label: 'Fund', color: ENTITY_COLORS.FUND },
  { label: 'Company', color: COMPANY_COLOR, shape: 'square' as const },
];

const TIER_ITEMS = [
  { label: 'Elite', color: TIER_COLORS.ELITE },
  { label: 'Strong', color: TIER_COLORS.STRONG },
  { label: 'Average', color: TIER_COLORS.AVERAGE },
  { label: 'Underperformer', color: TIER_COLORS.UNDERPERFORMER },
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
      <span className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Role</span>
      {ROLE_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: item.shape === 'square' ? 2 : '50%',
              backgroundColor: item.color,
              flexShrink: 0,
            }}
          />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {item.label}
          </span>
        </div>
      ))}
      <div className="mt-2 pt-1.5" style={{ borderTop: '1px solid var(--border-primary)' }}>
        <span className="text-xs mb-0.5 block" style={{ color: 'var(--text-muted)' }}>Tier (size + badge)</span>
        {TIER_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2 mt-1">
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: item.color + '40',
                border: `1.5px solid ${item.color}`,
                flexShrink: 0,
              }}
            />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--border-primary)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Size = buy value × tier
        </span>
      </div>
    </div>
  );
});
