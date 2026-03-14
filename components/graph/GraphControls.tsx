'use client';

import React, { memo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { GraphFilters, MinValueFilter, RoleFilter, TimeFilter } from '@/types/graph';

interface GraphControlsProps {
  filters: GraphFilters;
  onChange: (filters: GraphFilters) => void;
  nodeCount: number;
  edgeCount: number;
  loading: boolean;
}

const MIN_VALUE_OPTIONS: { label: string; value: MinValueFilter }[] = [
  { label: '$50K', value: 50000 },
  { label: '$250K', value: 250000 },
  { label: '$500K', value: 500000 },
  { label: '$1M', value: 1000000 },
  { label: '$5M', value: 5000000 },
];

const ROLE_OPTIONS: { label: string; value: RoleFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Officer', value: 'OFFICER' },
  { label: 'Director', value: 'DIRECTOR' },
  { label: '10% Owner', value: 'OWNER_10PCT' },
  { label: 'Unknown', value: 'UNKNOWN' },
];

const TIME_OPTIONS: { label: string; value: TimeFilter }[] = [
  { label: '30d', value: '30d' },
  { label: '60d', value: '60d' },
  { label: '90d', value: '90d' },
  { label: 'All time', value: 'all' },
];

const PillGroup = memo(function PillGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className="px-2.5 py-1 text-xs font-medium rounded transition-all"
          style={{
            backgroundColor: value === opt.value ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: value === opt.value ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${value === opt.value ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
});

export const GraphControls = memo(function GraphControls({
  filters,
  onChange,
  nodeCount,
  edgeCount,
  loading,
}: GraphControlsProps) {
  return (
    <div
      className="flex flex-col gap-3 p-4 border-b"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
      }}
    >
      {/* Top row: search + stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Insider Network
          </span>
        </div>
        {/* Stats badge */}
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading…</span>
          ) : (
            <>
              <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                <span style={{ color: 'var(--text-primary)' }}>{nodeCount}</span> nodes
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                <span style={{ color: 'var(--text-primary)' }}>{edgeCount}</span> edges
              </span>
            </>
          )}
        </div>
      </div>

      {/* Filter rows */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Min value</span>
          <PillGroup
            options={MIN_VALUE_OPTIONS}
            value={filters.minValue}
            onChange={(v) => onChange({ ...filters, minValue: v as import('@/types/graph').MinValueFilter })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Role</span>
          <PillGroup
            options={ROLE_OPTIONS}
            value={filters.role}
            onChange={(v) => onChange({ ...filters, role: v as import('@/types/graph').RoleFilter })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Period</span>
          <PillGroup
            options={TIME_OPTIONS}
            value={filters.time}
            onChange={(v) => onChange({ ...filters, time: v as import('@/types/graph').TimeFilter })}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          placeholder="Highlight by name or ticker…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded border"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
});
