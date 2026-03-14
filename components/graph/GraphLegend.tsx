'use client';

import React, { memo } from 'react';
import { ENTITY_COLORS, COMPANY_COLOR } from '@/lib/graphColors';

const LEGEND_ITEMS = [
  { label: 'Officer', color: ENTITY_COLORS.OFFICER },
  { label: 'Director', color: ENTITY_COLORS.DIRECTOR },
  { label: '10% Owner', color: ENTITY_COLORS.OWNER_10PCT },
  { label: 'Unknown', color: ENTITY_COLORS.UNKNOWN },
  { label: 'Fund', color: ENTITY_COLORS.FUND },
  { label: 'Company', color: COMPANY_COLOR, shape: 'square' as const },
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
      {LEGEND_ITEMS.map((item) => (
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
      <div className="mt-1 pt-1.5" style={{ borderTop: '1px solid var(--border-primary)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Size = buy value
        </span>
      </div>
    </div>
  );
});
