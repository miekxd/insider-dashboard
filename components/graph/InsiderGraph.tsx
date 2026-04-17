'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';
import * as d3 from 'd3';
import { D3Node, D3InsiderNode, D3CompanyNode, D3Link } from '@/types/graph';
import { DIM_COLOR, DIM_EDGE_COLOR, DIM_BORDER_COLOR } from '@/lib/graphColors';
import { TooltipData } from './GraphTooltip';

interface InsiderGraphProps {
  nodes: D3Node[];
  links: D3Link[];
  searchQuery: string;
  onTooltip: (data: TooltipData | null, position: { x: number; y: number }) => void;
  onNodeClick?: (data: TooltipData) => void;
}

function resolvedId(d: D3Node | string | number): string {
  if (typeof d === 'object' && d !== null) return (d as D3Node).id;
  return String(d);
}

export const InsiderGraph = memo(function InsiderGraph({
  nodes,
  links,
  searchQuery,
  onTooltip,
  onNodeClick,
}: InsiderGraphProps) {
  const svgRef     = useRef<SVGSVGElement>(null);
  const zoomRef    = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simRef     = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const nodesRef   = useRef<D3Node[]>([]);
  const linksRef   = useRef<D3Link[]>([]);
  const hoveredRef = useRef<string | null>(null);
  const searchRef  = useRef(searchQuery);

  const onTooltipRef  = useRef(onTooltip);
  const onNodeClickRef = useRef(onNodeClick);
  useEffect(() => { onTooltipRef.current = onTooltip; }, [onTooltip]);
  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);
  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);

  // ── Highlight ───────────────────────────────────────────────────────────────
  const applyHighlight = useCallback((
    svgEl: SVGSVGElement | null,
    hovered: string | null,
    search: string,
  ) => {
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const q = search.toLowerCase().trim();
    const litNodes = new Set<string>();
    const litLinks  = new Set<string>();

    if (hovered) {
      litNodes.add(hovered);
      linksRef.current.forEach(l => {
        const src = resolvedId(l.source), tgt = resolvedId(l.target);
        if (src === hovered) { litNodes.add(tgt); litLinks.add(l.id); }
        if (tgt === hovered) { litNodes.add(src); litLinks.add(l.id); }
      });
    }
    if (q) {
      nodesRef.current.forEach(n => {
        const hit = n.label.toLowerCase().includes(q) ||
          (n.nodeType === 'company' && n.ticker.toLowerCase().includes(q));
        if (hit) {
          litNodes.add(n.id);
          linksRef.current.forEach(l => {
            const src = resolvedId(l.source), tgt = resolvedId(l.target);
            if (src === n.id) { litNodes.add(tgt); litLinks.add(l.id); }
            if (tgt === n.id) { litNodes.add(src); litLinks.add(l.id); }
          });
        }
      });
    }

    const dim = hovered !== null || q !== '';

    svg.selectAll<Element, D3Node>('.node-shape')
      .attr('fill',   d => (!dim || litNodes.has(d.id)) ? d.fill   : DIM_COLOR)
      .attr('stroke', d => (!dim || litNodes.has(d.id)) ? d.stroke : DIM_BORDER_COLOR);

    svg.selectAll<Element, D3Node>('.node-label')
      .attr('opacity', d => (!dim || litNodes.has(d.id)) ? 1 : 0.15);

    svg.selectAll<Element, D3Link>('.link-line')
      .attr('stroke',         d => (!dim || litLinks.has(d.id)) ? '#555' : DIM_EDGE_COLOR)
      .attr('stroke-opacity', d => (!dim || litLinks.has(d.id)) ? 0.7   : 0.06);
  }, []);

  // ── Main effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !nodes.length) return;

    // Clone so D3 can write x/y/vx/vy onto the objects
    const simNodes: D3Node[] = nodes.map(n => ({ ...n }));
    const simLinks: D3Link[] = links.map(l => ({ ...l }));
    nodesRef.current = simNodes;
    linksRef.current = simLinks;

    const width  = svgEl.clientWidth  || 900;
    const height = svgEl.clientHeight || 650;
    const cx = width / 2, cy = height / 2;

    // ── SVG scaffold ──────────────────────────────────────────────────────────
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    // Arrow marker
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -3 6 6')
      .attr('refX', 6).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L6,0L0,3')
      .attr('fill', '#3a3a3a');

    const g = svg.append('g').attr('class', 'zoom-group');

    // ── Zoom ─────────────────────────────────────────────────────────────────
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 10])
      .on('zoom', ev => g.attr('transform', ev.transform.toString()));
    zoomRef.current = zoom;
    svg.call(zoom);

    // ── Links ─────────────────────────────────────────────────────────────────
    const linkSel = g.append('g').attr('class', 'links')
      .selectAll<SVGLineElement, D3Link>('line')
      .data(simLinks, d => d.id)
      .join('line')
      .attr('class', 'link-line')
      .attr('stroke', '#444')
      .attr('stroke-width', d => d.strokeWidth)
      .attr('stroke-opacity', 0.7)
      .attr('marker-end', 'url(#arrow)');

    // ── Node groups ───────────────────────────────────────────────────────────
    const nodeGroups = g.append('g').attr('class', 'nodes')
      .selectAll<SVGGElement, D3Node>('g')
      .data(simNodes, d => d.id)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'grab');

    // Shapes
    nodeGroups.each(function(d) {
      const el = d3.select(this);
      if (d.nodeType === 'company') {
        const r = d.size;
        el.append('polygon')
          .attr('class', 'node-shape')
          .attr('points', `0,${-r} ${r},0 0,${r} ${-r},0`)
          .attr('fill', d.fill)
          .attr('stroke', d.stroke)
          .attr('stroke-width', 2);
      } else {
        el.append('circle')
          .attr('class', 'node-shape')
          .attr('r', d.size)
          .attr('fill', d.fill)
          .attr('stroke', d.stroke)
          .attr('stroke-width', 2);
      }
    });

    // Labels
    const labelSel = g.append('g').attr('class', 'labels')
      .selectAll<SVGTextElement, D3Node>('text')
      .data(simNodes, d => d.id)
      .join('text')
      .attr('class', 'node-label')
      .text(d => d.label)
      .attr('font-size', 11)
      .attr('font-weight', '500')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#CCCCCC')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .attr('dy', d => d.size + 13);

    // ── Simulation ────────────────────────────────────────────────────────────
    const sim = d3.forceSimulation<D3Node, D3Link>(simNodes)
      .force('link', d3.forceLink<D3Node, D3Link>(simLinks)
        .id(d => d.id)
        .distance(45)
        .strength(0.4))
      .force('charge', d3.forceManyBody<D3Node>()
        .strength(-500))
      .force('center', d3.forceCenter(cx, cy).strength(0.06))
      .force('x', d3.forceX(cx).strength(0.06))
      .force('y', d3.forceY(cy).strength(0.06))
      .force('collide', d3.forceCollide<D3Node>(d => d.size + 4)
        .strength(0.9).iterations(2))
      .velocityDecay(0.4)
      .alphaDecay(0.0114)
      .stop();

    // Pre-run to establish sphere layout before first paint
    for (let i = 0; i < 200; i++) sim.tick();

    // Apply initial zoom fit immediately (no animation — nodes are already placed)
    {
      const xs = simNodes.map(n => n.x!).filter(isFinite);
      const ys = simNodes.map(n => n.y!).filter(isFinite);
      if (xs.length) {
        const pad  = 60;
        const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
        const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
        const scale = Math.min(width / (maxX - minX), height / (maxY - minY), 1.5);
        const tx = width  / 2 - scale * (minX + maxX) / 2;
        const ty = height / 2 - scale * (minY + maxY) / 2;
        svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }
    }

    // Restart at reduced alpha for gentle final settling
    sim
      .alpha(0.3)
      .restart()
      .on('tick', () => {
        linkSel
          .attr('x1', d => (d.source as D3Node).x!)
          .attr('y1', d => (d.source as D3Node).y!)
          .attr('x2', d => {
            const s = d.source as D3Node, t = d.target as D3Node;
            const dx = t.x! - s.x!, dy = t.y! - s.y!;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const off = (t.nodeType === 'company' ? t.size : t.size) + 7;
            return t.x! - (dx / len) * off;
          })
          .attr('y2', d => {
            const s = d.source as D3Node, t = d.target as D3Node;
            const dx = t.x! - s.x!, dy = t.y! - s.y!;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const off = (t.nodeType === 'company' ? t.size : t.size) + 7;
            return t.y! - (dy / len) * off;
          });

        nodeGroups.attr('transform', d => `translate(${d.x ?? cx},${d.y ?? cy})`);
        labelSel.attr('transform',   d => `translate(${d.x ?? cx},${d.y ?? cy})`);
      });

    simRef.current = sim;

    // ── Drag ─────────────────────────────────────────────────────────────────
    const drag = d3.drag<SVGGElement, D3Node>()
      .on('start', (ev, d) => {
        if (!ev.active) sim.alphaTarget(0.05).restart();
        d.fx = d.x; d.fy = d.y;
        onTooltipRef.current(null, { x: 0, y: 0 });
      })
      .on('drag', (ev, d) => {
        d.fx = ev.x; d.fy = ev.y;
      })
      .on('end', (ev, d) => {
        if (!ev.active) sim.alphaTarget(0);
        d.fx = null; d.fy = null;
      });

    nodeGroups.call(drag as any);

    // ── Hover / click ─────────────────────────────────────────────────────────
    nodeGroups
      .on('mouseenter', (ev: MouseEvent, d: D3Node) => {
        hoveredRef.current = d.id;
        applyHighlight(svgEl, d.id, searchRef.current);
        const tip: TooltipData =
          d.nodeType === 'insider'
            ? { type: 'insider', attrs: d as D3InsiderNode }
            : { type: 'company', attrs: d as D3CompanyNode };
        onTooltipRef.current(tip, { x: ev.clientX, y: ev.clientY });
      })
      .on('mouseleave', () => {
        hoveredRef.current = null;
        applyHighlight(svgEl, null, searchRef.current);
        onTooltipRef.current(null, { x: 0, y: 0 });
      })
      .on('click', (ev: MouseEvent, d: D3Node) => {
        if (ev.defaultPrevented) return; // suppressed by drag
        const tip: TooltipData =
          d.nodeType === 'insider'
            ? { type: 'insider', attrs: d as D3InsiderNode }
            : { type: 'company', attrs: d as D3CompanyNode };
        onNodeClickRef.current?.(tip);
      });

    // Edge hover
    linkSel
      .on('mouseenter', (ev: MouseEvent, d: D3Link) => {
        onTooltipRef.current({ type: 'edge', attrs: d }, { x: ev.clientX, y: ev.clientY });
      })
      .on('mouseleave', () => {
        onTooltipRef.current(null, { x: 0, y: 0 });
      });

    return () => {
      sim.stop();
      svg.selectAll('*').remove();
      simRef.current = null;
    };
  }, [nodes, links, applyHighlight]);

  // Search highlight without restarting sim
  useEffect(() => {
    applyHighlight(svgRef.current, hoveredRef.current, searchQuery);
  }, [searchQuery, applyHighlight]);

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', cursor: 'default' }}
    />
  );
});
