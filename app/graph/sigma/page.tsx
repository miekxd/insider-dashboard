'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, Network } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useGraphDataSigma } from '@/hooks/useGraphDataSigma';
import { GraphFilters, InsiderAttrs } from '@/types/graph';
import { GraphControls } from '@/components/graph/GraphControls';
import { GraphLegend } from '@/components/graph/GraphLegend';
import { GraphTooltip, TooltipData } from '@/components/graph/GraphTooltip';
import { InsiderDetailPanel } from '@/components/graph/InsiderDetailPanel';
import { ClusterPanelSigma } from '@/components/graph/ClusterPanelSigma';

const InsiderGraphSigma = dynamic(
  () => import('@/components/graph/InsiderGraphSigma').then((m) => m.InsiderGraphSigma),
  { ssr: false }
);

const DEFAULT_FILTERS: GraphFilters = {
  minValue: 500000,
  role: 'all',
  time: 'all',
  search: '',
};

export default function GraphSigmaPage() {
  const { theme, toggleTheme } = useTheme();
  const [filters, setFilters] = useState<GraphFilters>(DEFAULT_FILTERS);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedInsider, setSelectedInsider] = useState<InsiderAttrs | null>(null);

  const fetchFilters = useMemo(() => ({
    ...filters,
    search: '',
  }), [filters.minValue, filters.role, filters.time]); // eslint-disable-line react-hooks/exhaustive-deps

  const { graph, loading, error, nodeCount, edgeCount } = useGraphDataSigma(fetchFilters);

  const handleTooltip = useCallback((data: TooltipData | null, position: { x: number; y: number }) => {
    setTooltipData(data);
    if (data) setTooltipPos(position);
  }, []);

  const handleClusterHighlight = useCallback((ticker: string) => {
    setFilters((prev) => ({ ...prev, search: ticker }));
  }, []);

  const handleNodeClick = useCallback((data: TooltipData) => {
    if (data.type === 'insider') setSelectedInsider(data.attrs);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (tooltipData) setTooltipPos({ x: e.clientX, y: e.clientY });
  }, [tooltipData]);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      onMouseMove={handleMouseMove}
    >
      <header
        className="shrink-0 flex items-center justify-between h-14 px-6 border-b z-20"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Calls</span>
          </Link>
          <div className="w-px h-4" style={{ backgroundColor: 'var(--border-primary)' }} />
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <h1 className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Insider Network
            </h1>
          </div>
          {/* Version switcher */}
          <div className="flex items-center gap-1 ml-2 rounded-md overflow-hidden border" style={{ borderColor: 'var(--border-primary)' }}>
            <span
              className="px-2.5 py-1 text-xs font-mono font-semibold"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
            >
              Sigma
            </span>
            <Link
              href="/graph"
              className="px-2.5 py-1 text-xs font-mono transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              D3
            </Link>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded transition-colors"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </header>

      <GraphControls
        filters={filters}
        onChange={setFilters}
        nodeCount={nodeCount}
        edgeCount={edgeCount}
        loading={loading}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="hidden md:flex flex-col w-52 shrink-0 border-r overflow-y-auto"
          style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <ClusterPanelSigma
            graph={graph}
            onHighlight={handleClusterHighlight}
            highlighted={filters.search}
          />
        </aside>

        <div className="relative flex-1 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
              style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Building graph…</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
              <span className="text-sm" style={{ color: 'var(--accent-negative)' }}>{error}</span>
            </div>
          )}

          {!loading && !error && graph && graph.order === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
              <Network className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No nodes match current filters</span>
            </div>
          )}

          {!loading && !error && graph && graph.order > 0 && (
            <InsiderGraphSigma
              graph={graph}
              searchQuery={filters.search}
              onTooltip={handleTooltip}
              onNodeClick={handleNodeClick}
            />
          )}

          <GraphLegend />

          <InsiderDetailPanel
            attrs={selectedInsider}
            onClose={() => setSelectedInsider(null)}
          />
        </div>
      </div>

      <GraphTooltip data={tooltipData} position={tooltipPos} />
    </div>
  );
}
