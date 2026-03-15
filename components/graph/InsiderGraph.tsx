'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import { MouseCoords } from 'sigma/types';
import { createNodeBorderProgram } from '@sigma/node-border';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { InsiderNodeAttributes, CompanyNodeAttributes, EdgeAttributes } from '@/types/graph';
import {
  COMPANY_COLOR, COMPANY_COLOR_BRIGHT,
  TIER_COLORS_BRIGHT, getTierColor, getTierColorBright,
  ROLE_COLORS_BRIGHT, getRoleColorBright,
  DIM_COLOR, DIM_EDGE_COLOR, DIM_BORDER_COLOR,
} from '@/lib/graphColors';
import { TooltipData } from './GraphTooltip';

// ─────────────────────────────────────────────────────────────────────────────
// Spring physics simulation
//
// Each node has position + velocity. Every tick:
//   - All node pairs repel (inverse-square charge force)
//   - Connected nodes attract (Hooke spring along each edge)
//   - Weak gravity toward origin prevents drift
//   - Velocity decays by DAMPING factor
//
// Alpha = "heat". Decays each tick. Physics stops when cool.
// Call reheat() to wake the sim back up (e.g. on drag start/end).
// Pinned nodes are held at a fixed position — everything else springs around them.
// ─────────────────────────────────────────────────────────────────────────────

interface SimNode {
  x: number; y: number;
  vx: number; vy: number;
  mass: number;
  pinned: boolean;
}

class SpringSim {
  nodes = new Map<string, SimNode>();
  private edges: [string, string][] = [];
  private alpha = 0;
  private rafId: number | null = null;
  private readonly onTick: () => void;

  private readonly REPULSION   = 80;
  private readonly SPRING_K    = 0.04;
  private readonly SPRING_LEN  = 8;
  private readonly DAMPING     = 0.75;
  private readonly GRAVITY     = 0.008;
  private readonly ALPHA_DECAY = 0.010;
  private readonly ALPHA_MIN   = 0.001;

  constructor(onTick: () => void) { this.onTick = onTick; }

  load(graph: Graph) {
    this.nodes.clear();
    this.edges = [];
    graph.forEachNode((key, attrs: any) => {
      this.nodes.set(key, {
        x: attrs.x ?? 0, y: attrs.y ?? 0,
        vx: 0, vy: 0,
        mass: Math.max(1, attrs.size ?? 4),
        pinned: false,
      });
    });
    graph.forEachEdge((_, __, s, t) => this.edges.push([s, t]));
  }

  reheat(alpha = 0.5) {
    this.alpha = Math.max(this.alpha, alpha);
    if (!this.isRunning()) this.start();
  }

  pin(key: string, x: number, y: number) {
    const n = this.nodes.get(key);
    if (!n) return;
    n.pinned = true; n.x = x; n.y = y; n.vx = 0; n.vy = 0;
  }

  move(key: string, x: number, y: number) {
    const n = this.nodes.get(key);
    if (n?.pinned) { n.x = x; n.y = y; }
  }

  unpin(key: string) {
    const n = this.nodes.get(key);
    if (n) n.pinned = false;
  }

  isRunning() { return this.rafId !== null; }

  start() {
    if (this.rafId !== null) return;
    const tick = () => {
      this.step();
      this.onTick();
      if (this.alpha > this.ALPHA_MIN) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.alpha = 0;
  }

  private step() {
    const entries = [...this.nodes.entries()];
    const N = entries.length;

    // Repulsion — all pairs
    for (let i = 0; i < N; i++) {
      const [, a] = entries[i];
      for (let j = i + 1; j < N; j++) {
        const [, b] = entries[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy + 0.01;
        const d  = Math.sqrt(d2);
        const f  = (this.REPULSION * this.alpha) / d2;
        const fx = f * dx / d, fy = f * dy / d;
        if (!a.pinned) { a.vx -= fx / a.mass; a.vy -= fy / a.mass; }
        if (!b.pinned) { b.vx += fx / b.mass; b.vy += fy / b.mass; }
      }
    }

    // Springs — along edges
    for (const [sk, tk] of this.edges) {
      const s = this.nodes.get(sk), t = this.nodes.get(tk);
      if (!s || !t) continue;
      const dx = t.x - s.x, dy = t.y - s.y;
      const d  = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const f  = this.SPRING_K * (d - this.SPRING_LEN) * this.alpha;
      const fx = f * dx / d, fy = f * dy / d;
      if (!s.pinned) { s.vx += fx; s.vy += fy; }
      if (!t.pinned) { t.vx -= fx; t.vy -= fy; }
    }

    // Gravity toward origin
    for (const [, n] of entries) {
      if (!n.pinned) {
        n.vx -= n.x * this.GRAVITY * this.alpha;
        n.vy -= n.y * this.GRAVITY * this.alpha;
      }
    }

    // Integrate
    for (const [, n] of entries) {
      if (n.pinned) continue;
      n.vx *= this.DAMPING; n.vy *= this.DAMPING;
      n.x  += n.vx;        n.y  += n.vy;
    }

    this.alpha -= this.ALPHA_DECAY;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function applyFA2(graph: Graph) {
  const positions = forceAtlas2(graph, {
    iterations: 200,
    settings: { adjustSizes: true, edgeWeightInfluence: 1, scalingRatio: 4, strongGravityMode: true, gravity: 0.5, barnesHutOptimize: true },
  });
  graph.updateEachNodeAttributes((node, attrs) => ({
    ...attrs,
    x: positions[node]?.x ?? attrs.x,
    y: positions[node]?.y ?? attrs.y,
  }));
}

// Fill color = tier (for insiders) or company blue
function brightFill(attrs: any): string {
  if (attrs.nodeType === 'company') return COMPANY_COLOR_BRIGHT;
  return getTierColorBright(attrs.insider_tier);
}
function baseFill(attrs: any): string {
  if (attrs.nodeType === 'company') return COMPANY_COLOR;
  return getTierColor(attrs.insider_tier);
}

// Border color = role type (for insiders) or transparent for companies
function brightBorder(attrs: any): string {
  if (attrs.nodeType === 'company') return COMPANY_COLOR_BRIGHT;
  return getRoleColorBright(attrs.entity_type);
}
function baseBorder(attrs: any): string {
  if (attrs.nodeType === 'company') return COMPANY_COLOR;
  return getRoleColorBright(attrs.entity_type);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface InsiderGraphProps {
  graph: Graph;
  searchQuery: string;
  onTooltip: (data: TooltipData | null, position: { x: number; y: number }) => void;
  onNodeClick?: (data: TooltipData) => void;
}

export const InsiderGraph = memo(function InsiderGraph({ graph, searchQuery, onTooltip, onNodeClick }: InsiderGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef     = useRef<Sigma | null>(null);
  const simRef       = useRef<SpringSim | null>(null);

  const hoveredNode  = useRef<string | null>(null);
  const draggedNode  = useRef<string | null>(null);
  const isDragging   = useRef(false);
  const dragDidMove  = useRef(false);
  const origSize     = useRef(4);
  const lastDragPos  = useRef<{ x: number; y: number } | null>(null);
  const dragVelocity = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });

  const setCursor = (c: string) => {
    if (containerRef.current) containerRef.current.style.cursor = c;
  };

  const updateColors = useCallback((sigma: Sigma, hovered: string | null, search: string) => {
    const g = sigma.getGraph();
    const q = search.toLowerCase();
    const litNodes = new Set<string>();
    const litEdges = new Set<string>();

    if (hovered) {
      litNodes.add(hovered);
      g.forEachNeighbor(hovered, n => litNodes.add(n));
      g.forEachEdge(hovered, e => litEdges.add(e));
    }
    if (q) {
      g.forEachNode((key, attrs: any) => {
        if ((attrs.label ?? '').toLowerCase().includes(q) || (attrs.ticker ?? '').toLowerCase().includes(q)) {
          litNodes.add(key);
          g.forEachNeighbor(key, n => litNodes.add(n));
          g.forEachEdge(key, e => litEdges.add(e));
        }
      });
    }

    const dim = hovered !== null || q !== '';
    g.updateEachNodeAttributes((key, attrs: any) => {
      const lit = !dim || litNodes.has(key);
      return {
        ...attrs,
        color:       lit ? brightFill(attrs)   : DIM_COLOR,
        borderColor: lit ? brightBorder(attrs) : DIM_BORDER_COLOR,
        zIndex: lit ? (key === hovered ? 10 : 1) : 0,
      };
    });
    g.updateEachEdgeAttributes((key, attrs) => {
      const lit = !dim || litEdges.has(key);
      return { ...attrs, color: lit ? '#555555' : DIM_EDGE_COLOR, zIndex: lit ? 1 : 0 };
    });
    sigma.refresh();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !graph) return;

    // 1. FA2 initial layout
    applyFA2(graph);
    graph.updateEachNodeAttributes((_, attrs: any) => ({
      ...attrs,
      color: baseFill(attrs),
      borderColor: baseBorder(attrs),
    }));
    graph.updateEachEdgeAttributes((_, attrs) => ({ ...attrs, color: '#333333' }));

    // 2. Sigma — border node program: fill=tier color, border=role color
    const NodeBorderProgram = createNodeBorderProgram({
      borders: [
        { size: { value: 0.15 }, color: { attribute: 'borderColor' } },
        { size: { fill: true },  color: { attribute: 'color' } },
      ],
    });

    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultEdgeType: 'arrow',
      defaultNodeType: 'bordered',
      nodeProgramClasses: { bordered: NodeBorderProgram },
      labelFont: 'JetBrains Mono, monospace',
      labelSize: 10,
      labelWeight: '500',
      labelColor: { color: '#AAAAAA' },
      stagePadding: 40,
      zoomToSizeRatioFunction: x => x,
      itemSizesReference: 'positions',
    });

    sigmaRef.current = renderer;

    // Lock normalization domain after initial layout so nodes can move freely
    // without warping the viewport↔graph coordinate mapping.
    renderer.refresh();
    const initBBox = renderer.getBBox();
    const padX = Math.max(50, (initBBox.x[1] - initBBox.x[0]) * 0.6);
    const padY = Math.max(50, (initBBox.y[1] - initBBox.y[0]) * 0.6);
    renderer.setCustomBBox({
      x: [initBBox.x[0] - padX, initBBox.x[1] + padX],
      y: [initBBox.y[0] - padY, initBBox.y[1] + padY],
    });

    // 3. Spring sim — onTick writes positions back to graph and refreshes Sigma
    const sim = new SpringSim(() => {
      const s = simRef.current;
      const r = sigmaRef.current;
      if (!s || !r) return;
      // Write sim positions directly to graph node attributes
      s.nodes.forEach((n, key) => {
        graph.setNodeAttribute(key, 'x', n.x);
        graph.setNodeAttribute(key, 'y', n.y);
      });
      r.refresh();
    });
    sim.load(graph);
    simRef.current = sim;

    // Gentle initial settle from FA2 positions
    sim.reheat(0.25);

    const captor = renderer.getMouseCaptor();

    // ── Drag ──────────────────────────────────────────────────────────────
    renderer.on('downNode', ({ node }) => {
      isDragging.current  = true;
      dragDidMove.current = false;
      draggedNode.current = node;
      lastDragPos.current  = null;
      dragVelocity.current = { vx: 0, vy: 0 };

      const attrs = graph.getNodeAttributes(node) as any;
      origSize.current = attrs.size ?? 4;

      // Pin at current sim position
      const sn = sim.nodes.get(node)!;
      sim.pin(node, sn.x, sn.y);
      sim.reheat(0.7);

      graph.setNodeAttribute(node, 'size',        origSize.current * 1.5);
      graph.setNodeAttribute(node, 'color',       brightFill(attrs));
      graph.setNodeAttribute(node, 'borderColor', brightBorder(attrs));
      graph.setNodeAttribute(node, 'zIndex',      100);

      onTooltip(null, { x: 0, y: 0 });
      setCursor('grabbing');
    });

    captor.on('mousemovebody', (coords: MouseCoords) => {
      if (!isDragging.current || !draggedNode.current) return;

      // Convert viewport → graph coordinates
      const pos = renderer.viewportToGraph({ x: coords.x, y: coords.y });

      // Track velocity: delta between this frame and the last
      if (lastDragPos.current) {
        const dvx = pos.x - lastDragPos.current.x;
        const dvy = pos.y - lastDragPos.current.y;
        dragVelocity.current = { vx: dvx, vy: dvy };
        if (Math.hypot(dvx, dvy) > 0.1) dragDidMove.current = true;
      }
      lastDragPos.current = { x: pos.x, y: pos.y };

      // Directly write dragged node position so it tracks cursor with zero sim lag
      graph.setNodeAttribute(draggedNode.current, 'x', pos.x);
      graph.setNodeAttribute(draggedNode.current, 'y', pos.y);

      // Update sim pinned position — onTick handles connected-node rendering
      sim.move(draggedNode.current, pos.x, pos.y);
      // Keep sim hot for the entire drag so connected nodes keep springing
      sim.reheat(0.4);

      // Prevent Sigma from also panning the camera in response to this move
      coords.preventSigmaDefault();
      (coords.original as MouseEvent).preventDefault?.();
      (coords.original as MouseEvent).stopPropagation?.();
    });

    const endDrag = () => {
      if (!isDragging.current || !draggedNode.current) return;
      const node = draggedNode.current;

      // Apply throw velocity so the node coasts after release
      const sn = sim.nodes.get(node);
      if (sn) {
        const THROW_SCALE = 8.0; // tune for iciness
        sn.vx = dragVelocity.current.vx * THROW_SCALE;
        sn.vy = dragVelocity.current.vy * THROW_SCALE;
      }
      lastDragPos.current  = null;
      dragVelocity.current = { vx: 0, vy: 0 };

      sim.unpin(node);
      const speed = Math.hypot(sn?.vx ?? 0, sn?.vy ?? 0);
      sim.reheat(Math.max(0.3, Math.min(0.8, speed * 0.1)));

      graph.setNodeAttribute(node, 'size',   origSize.current);
      graph.setNodeAttribute(node, 'zIndex', 1);

      isDragging.current  = false;
      draggedNode.current = null;

      setCursor(hoveredNode.current ? 'grab' : 'default');
      updateColors(renderer, hoveredNode.current, searchQuery);
    };

    captor.on('mouseup',    endDrag);
    captor.on('mouseleave', endDrag);

    // ── Hover ─────────────────────────────────────────────────────────────
    renderer.on('enterNode', ({ node, event }) => {
      if (isDragging.current) return;
      hoveredNode.current = node;
      updateColors(renderer, node, searchQuery);
      setCursor('grab');

      const attrs = graph.getNodeAttributes(node) as any;
      const tip: TooltipData = attrs.nodeType === 'insider'
        ? { type: 'insider', attrs: attrs as InsiderNodeAttributes }
        : { type: 'company', attrs: attrs as CompanyNodeAttributes };

      onTooltip(tip, {
        x: 'clientX' in event.original ? (event.original as MouseEvent).clientX : 0,
        y: 'clientY' in event.original ? (event.original as MouseEvent).clientY : 0,
      });
    });

    renderer.on('leaveNode', () => {
      if (isDragging.current) return;
      hoveredNode.current = null;
      updateColors(renderer, null, searchQuery);
      setCursor('default');
      onTooltip(null, { x: 0, y: 0 });
    });

    renderer.on('enterEdge', ({ edge, event }) => {
      if (isDragging.current) return;
      const attrs = graph.getEdgeAttributes(edge) as EdgeAttributes;
      onTooltip({ type: 'edge', attrs }, {
        x: 'clientX' in event.original ? (event.original as MouseEvent).clientX : 0,
        y: 'clientY' in event.original ? (event.original as MouseEvent).clientY : 0,
      });
    });

    renderer.on('leaveEdge', () => {
      if (isDragging.current) return;
      onTooltip(null, { x: 0, y: 0 });
    });

    // ── Click (open detail panel) ──────────────────────────────────────────
    renderer.on('clickNode', ({ node }) => {
      // Ignore clicks that were actually drag-releases
      if (isDragging.current || dragDidMove.current) {
        dragDidMove.current = false;
        return;
      }
      const attrs = graph.getNodeAttributes(node) as any;
      if (attrs.nodeType !== 'insider') return;
      onNodeClick?.({ type: 'insider', attrs: attrs as InsiderNodeAttributes });
    });

    return () => {
      sim.stop();
      renderer.kill();
      sigmaRef.current = null;
      simRef.current   = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  useEffect(() => {
    if (!sigmaRef.current) return;
    updateColors(sigmaRef.current, hoveredNode.current, searchQuery);
  }, [searchQuery, updateColors]);

  return <div ref={containerRef} className="w-full h-full" style={{ cursor: 'default' }} />;
});
