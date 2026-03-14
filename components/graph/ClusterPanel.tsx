'use client';

import React, { memo, useMemo } from 'react';
import Graph from 'graphology';
import { CompanyNodeAttributes } from '@/types/graph';
import { AlertTriangle } from 'lucide-react';

interface ClusterPanelProps {
  graph: Graph | null;
  onHighlight: (ticker: string) => void;
  highlighted: string;
}

interface ClusterEntry {
  ticker: string;
  companyName: string;
  insiderCount: number;
  nodeKey: string;
}

export const ClusterPanel = memo(function ClusterPanel({
  graph,
  onHighlight,
  highlighted,
}: ClusterPanelProps) {
  const clusters = useMemo<ClusterEntry[]>(() => {
    if (!graph) return [];
    const entries: ClusterEntry[] = [];
    graph.forEachNode((key, attrs: any) => {
      if (attrs.nodeType === 'company') {
        const compAttrs = attrs as CompanyNodeAttributes;
        if (compAttrs.unique_insiders_bought >= 2) {
          entries.push({
            ticker: compAttrs.ticker,
            companyName: compAttrs.company_name,
            insiderCount: compAttrs.unique_insiders_bought,
            nodeKey: key,
          });
        }
      }
    });
    return entries.sort((a, b) => b.insiderCount - a.insiderCount).slice(0, 12);
  }, [graph]);

  if (clusters.length === 0) return null;

  return (
    <div
      className="flex flex-col border-t"
      style={{
        borderColor: 'var(--border-primary)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div
        className="flex items-center gap-1.5 px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <AlertTriangle className="w-3 h-3" style={{ color: '#E8A020' }} />
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
          Clusters
        </span>
      </div>
      <div className="flex flex-col">
        {clusters.map((c) => {
          const isActive = highlighted === c.ticker;
          return (
            <button
              key={c.nodeKey}
              onClick={() => onHighlight(isActive ? '' : c.ticker)}
              className="flex items-center justify-between px-4 py-2 text-left transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {c.ticker}
                </span>
                <span
                  className="text-xs truncate"
                  style={{ color: 'var(--text-tertiary)', maxWidth: 140 }}
                >
                  {c.companyName}
                </span>
              </div>
              <span
                className="text-xs px-1.5 py-0.5 rounded shrink-0 ml-2"
                style={{
                  backgroundColor: '#E8A02020',
                  color: '#E8A020',
                  fontWeight: 600,
                  border: '1px solid #E8A02040',
                }}
              >
                {c.insiderCount}×
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
