'use client';

import React, { useEffect, useRef, useCallback, useState, memo } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { NodeAttributes, InsiderNodeAttributes, CompanyNodeAttributes, EdgeAttributes } from '@/types/graph';
import { COMPANY_COLOR, ENTITY_COLORS, ENTITY_COLORS_BRIGHT, COMPANY_COLOR_BRIGHT, DIM_COLOR, DIM_EDGE_COLOR, CLUSTER_PULSE_COLOR } from '@/lib/graphColors';
import { TooltipData } from './GraphTooltip';

interface InsiderGraphProps {
  graph: Graph;
  searchQuery: string;
  onTooltip: (data: TooltipData | null, position: { x: number; y: number }) => void;
}

// Run ForceAtlas2 layout synchronously for a few hundred iterations
function applyLayout(graph: Graph) {
  // Assign initial positions if not set
  const positions = forceAtlas2(graph, {
    iterations: 200,
    settings: {
      adjustSizes: true,
      edgeWeightInfluence: 1,
      scalingRatio: 4,
      strongGravityMode: true,
      gravity: 0.5,
      barnesHutOptimize: true,
    },
  });
  graph.updateEachNodeAttributes((node, attrs) => ({
    ...attrs,
    x: positions[node]?.x ?? attrs.x,
    y: positions[node]?.y ?? attrs.y,
  }));
}

export const InsiderGraph = memo(function InsiderGraph({
  graph,
  searchQuery,
  onTooltip,
}: InsiderGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const hoveredNodeRef = useRef<string | null>(null);

  const updateNodeColors = useCallback((sigma: Sigma, hoveredNode: string | null, search: string) => {
    const g = sigma.getGraph();
    const searchLower = search.toLowerCase();

    // Gather neighbors of hovered node
    const highlightedNodes = new Set<string>();
    const highlightedEdges = new Set<string>();

    if (hoveredNode) {
      highlightedNodes.add(hoveredNode);
      g.forEachNeighbor(hoveredNode, (n) => highlightedNodes.add(n));
      g.forEachEdge(hoveredNode, (e) => highlightedEdges.add(e));
    }

    // Search highlight — find nodes matching search
    if (searchLower) {
      g.forEachNode((key, attrs: any) => {
        const label = (attrs.label ?? '').toLowerCase();
        const ticker = (attrs.ticker ?? '').toLowerCase();
        if (label.includes(searchLower) || ticker.includes(searchLower)) {
          highlightedNodes.add(key);
          g.forEachNeighbor(key, (n) => highlightedNodes.add(n));
          g.forEachEdge(key, (e) => highlightedEdges.add(e));
        }
      });
    }

    const dim = hoveredNode !== null || searchLower !== '';

    g.updateEachNodeAttributes((key, attrs: any) => {
      const isHighlighted = !dim || highlightedNodes.has(key);

      if (!isHighlighted) {
        return { ...attrs, color: DIM_COLOR, zIndex: 0 };
      }

      // Restore bright color
      let color: string;
      if (attrs.nodeType === 'company') {
        color = COMPANY_COLOR_BRIGHT;
      } else {
        color = ENTITY_COLORS_BRIGHT[attrs.entity_type as keyof typeof ENTITY_COLORS_BRIGHT] ?? ENTITY_COLORS_BRIGHT.UNKNOWN;
      }
      return { ...attrs, color, zIndex: key === hoveredNode ? 10 : 1 };
    });

    g.updateEachEdgeAttributes((key, attrs) => {
      const isHighlighted = !dim || highlightedEdges.has(key);
      return {
        ...attrs,
        color: isHighlighted ? '#555555' : DIM_EDGE_COLOR,
        zIndex: isHighlighted ? 1 : 0,
      };
    });

    sigma.refresh();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !graph) return;

    // Run layout
    applyLayout(graph);

    // Set default node colors
    graph.updateEachNodeAttributes((key, attrs: any) => {
      if (attrs.nodeType === 'company') {
        return { ...attrs, color: COMPANY_COLOR };
      }
      return { ...attrs, color: ENTITY_COLORS[attrs.entity_type as keyof typeof ENTITY_COLORS] ?? ENTITY_COLORS.UNKNOWN };
    });
    graph.updateEachEdgeAttributes((key, attrs) => ({ ...attrs, color: '#333333' }));

    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultEdgeType: 'arrow',
      labelFont: 'JetBrains Mono, monospace',
      labelSize: 10,
      labelWeight: '500',
      labelColor: { color: '#AAAAAA' },
      stagePadding: 40,
      zoomToSizeRatioFunction: (x) => x,
      itemSizesReference: 'positions',
    });

    sigmaRef.current = renderer;

    // Node hover
    renderer.on('enterNode', ({ node, event }) => {
      hoveredNodeRef.current = node;
      updateNodeColors(renderer, node, searchQuery);

      const attrs = graph.getNodeAttributes(node) as any;
      const tooltipData: TooltipData = attrs.nodeType === 'insider'
        ? { type: 'insider', attrs: attrs as InsiderNodeAttributes }
        : { type: 'company', attrs: attrs as CompanyNodeAttributes };

      const orig = event.original;
      const clientX = 'clientX' in orig ? orig.clientX : 0;
      const clientY = 'clientY' in orig ? orig.clientY : 0;
      onTooltip(tooltipData, { x: clientX, y: clientY });
    });

    renderer.on('leaveNode', () => {
      hoveredNodeRef.current = null;
      updateNodeColors(renderer, null, searchQuery);
      onTooltip(null, { x: 0, y: 0 });
    });

    // Edge hover
    renderer.on('enterEdge', ({ edge, event }) => {
      const attrs = graph.getEdgeAttributes(edge) as EdgeAttributes;
      const orig = event.original;
      const clientX = 'clientX' in orig ? orig.clientX : 0;
      const clientY = 'clientY' in orig ? orig.clientY : 0;
      onTooltip({ type: 'edge', attrs }, { x: clientX, y: clientY });
    });

    renderer.on('leaveEdge', () => {
      onTooltip(null, { x: 0, y: 0 });
    });

    // Mouse move on canvas for tooltip position tracking
    containerRef.current.addEventListener('mousemove', (e) => {
      // update tooltip position if visible — handled by parent via state
    });

    return () => {
      renderer.kill();
      sigmaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // React to search query changes
  useEffect(() => {
    if (!sigmaRef.current) return;
    updateNodeColors(sigmaRef.current, hoveredNodeRef.current, searchQuery);
  }, [searchQuery, updateNodeColors]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: 'default' }}
    />
  );
});
