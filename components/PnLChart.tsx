'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { DailyPnLPoint } from '@/hooks/usePortfolioPnL';

interface PnLChartProps {
  data: DailyPnLPoint[];
  loading?: boolean;
  error?: string;
  /** When true, renders as a full-page view (taller, no outer border/padding wrapper) */
  fullPage?: boolean;
}

const MARGIN = { top: 14, right: 14, bottom: 28, left: 52 };
const VIEW_W = 960;
const VIEW_H = 160;
const INNER_W = VIEW_W - MARGIN.left - MARGIN.right;
const INNER_H = VIEW_H - MARGIN.top - MARGIN.bottom;

interface HoverState {
  idx: number;
  x: number;
  y: number;
}

export const PnLChart = memo(function PnLChart({ data, loading, error, fullPage }: PnLChartProps) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const chart = useMemo(() => {
    if (data.length < 2) return null;

    const dates = data.map((d) => new Date(d.date + 'T12:00:00'));
    const values = data.map((d) => d.avg_pnl_pct);

    const xScale = d3.scaleTime()
      .domain(d3.extent(dates) as [Date, Date])
      .range([0, INNER_W]);

    const rawMin = d3.min(values) ?? 0;
    const rawMax = d3.max(values) ?? 0;
    const pad = Math.max(Math.abs(rawMax - rawMin) * 0.18, 1.5);
    const yScale = d3.scaleLinear()
      .domain([Math.min(rawMin - pad, -pad), Math.max(rawMax + pad, pad)])
      .range([INNER_H, 0]);

    const lineGen = d3.line<DailyPnLPoint>()
      .x((d) => xScale(new Date(d.date + 'T12:00:00')))
      .y((d) => yScale(d.avg_pnl_pct))
      .curve(d3.curveMonotoneX);

    const areaGen = d3.area<DailyPnLPoint>()
      .x((d) => xScale(new Date(d.date + 'T12:00:00')))
      .y0(yScale(0))
      .y1((d) => yScale(d.avg_pnl_pct))
      .curve(d3.curveMonotoneX);

    const yTicks = yScale.ticks(4).map((v) => ({ v, y: yScale(v) }));
    const xTicks = xScale.ticks(6).map((d) => ({ d, x: xScale(d) }));
    const zeroY = yScale(0);

    return {
      xScale,
      yScale,
      linePath: lineGen(data) ?? '',
      areaPath: areaGen(data) ?? '',
      yTicks,
      xTicks,
      zeroY,
      latestValue: values[values.length - 1],
    };
  }, [data]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      if (!chart || data.length === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      // Map client x → SVG inner x (accounting for viewBox scaling)
      const svgFraction = (e.clientX - rect.left) / rect.width;
      const innerX = svgFraction * INNER_W;
      const hoveredDate = chart.xScale.invert(innerX);
      // Find nearest data point
      const bisect = d3.bisector((d: DailyPnLPoint) => new Date(d.date + 'T12:00:00')).left;
      const idx = Math.min(bisect(data, hoveredDate, 1), data.length - 1);
      const cx = chart.xScale(new Date(data[idx].date + 'T12:00:00'));
      const cy = chart.yScale(data[idx].avg_pnl_pct);
      setHover({ idx, x: cx, y: cy });
    },
    [chart, data]
  );

  const isPositive = (chart?.latestValue ?? 0) >= 0;
  const color = isPositive ? 'var(--accent-positive)' : 'var(--accent-negative)';

  const svgHeight = fullPage ? 420 : VIEW_H;

  const content = (
    <>
      <div className="flex items-center justify-between mb-2">
        <span
          className={fullPage ? 'text-sm font-medium' : 'text-xs font-medium'}
          style={{ color: 'var(--text-tertiary)' }}
        >
          Portfolio P&amp;L — daily average across all positions
        </span>
        {chart && (
          <span
            className="font-mono text-xs font-semibold tabular-nums"
            style={{ color }}
          >
            {chart.latestValue >= 0 ? '+' : ''}
            {chart.latestValue.toFixed(2)}% latest
          </span>
        )}
      </div>

      {loading && (
        <div
          className="flex items-center justify-center text-xs"
          style={{ height: svgHeight, color: 'var(--text-tertiary)' }}
        >
          Loading…
        </div>
      )}

      {!loading && error && (
        <div
          className="flex items-center justify-center text-xs"
          style={{ height: svgHeight, color: 'var(--text-tertiary)' }}
        >
          P&amp;L history unavailable
        </div>
      )}

      {!loading && !error && data.length < 2 && (
        <div
          className="flex flex-col items-center justify-center gap-2 text-xs"
          style={{ height: svgHeight, color: 'var(--text-tertiary)' }}
        >
          <span>No historical data yet.</span>
          <span>
            Populate <code className="font-mono">position_price_history</code> to see the chart.
          </span>
        </div>
      )}

      {!loading && !error && chart && (
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ height: svgHeight, display: 'block' }}
        >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Y grid lines + labels */}
              {chart.yTicks.map(({ v, y }) => (
                <g key={v}>
                  <line
                    x1={0} y1={y} x2={INNER_W} y2={y}
                    stroke="var(--border-primary)"
                    strokeWidth={1}
                    strokeDasharray={v === 0 ? '0' : '3,3'}
                  />
                  <text
                    x={-6} y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={10}
                    fill="var(--text-tertiary)"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {v >= 0 ? '+' : ''}{v.toFixed(1)}%
                  </text>
                </g>
              ))}

              {/* Zero line (solid) */}
              <line
                x1={0} y1={chart.zeroY} x2={INNER_W} y2={chart.zeroY}
                stroke="var(--border-primary)"
                strokeWidth={1.5}
              />

              {/* X axis labels */}
              {chart.xTicks.map(({ d, x }) => (
                <text
                  key={x}
                  x={x} y={INNER_H + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--text-tertiary)"
                  fontFamily="Inter, sans-serif"
                >
                  {d3.timeFormat('%b %d')(d)}
                </text>
              ))}

              {/* Area fill */}
              <defs>
                <linearGradient id="pnl-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <path d={chart.areaPath} fill="url(#pnl-area-gradient)" />

              {/* Line */}
              <path
                d={chart.linePath}
                fill="none"
                stroke={color}
                strokeWidth={1.75}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Hover dot + vertical rule */}
              {hover && (
                <>
                  <line
                    x1={hover.x} y1={0} x2={hover.x} y2={INNER_H}
                    stroke="var(--border-primary)"
                    strokeWidth={1}
                    strokeDasharray="3,3"
                  />
                  <circle
                    cx={hover.x} cy={hover.y} r={4}
                    fill={color}
                    stroke="var(--bg-primary)"
                    strokeWidth={2}
                  />
                  {/* Tooltip bubble */}
                  {(() => {
                    const pt = data[hover.idx];
                    const v = pt.avg_pnl_pct;
                    const label = `${pt.date}  ${v >= 0 ? '+' : ''}${v.toFixed(2)}%  (${pt.position_count} pos)`;
                    const labelW = label.length * 6.2 + 16;
                    const bx = Math.min(Math.max(hover.x - labelW / 2, 0), INNER_W - labelW);
                    const by = hover.y > INNER_H / 2 ? hover.y - 36 : hover.y + 12;
                    return (
                      <g>
                        <rect
                          x={bx} y={by}
                          width={labelW} height={22}
                          rx={4}
                          fill="var(--bg-elevated)"
                          stroke="var(--border-primary)"
                          strokeWidth={1}
                        />
                        <text
                          x={bx + labelW / 2} y={by + 14}
                          textAnchor="middle"
                          fontSize={10}
                          fill="var(--text-primary)"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {label}
                        </text>
                      </g>
                    );
                  })()}
                </>
              )}

              {/* Invisible hit area for hover */}
              <rect
                x={0} y={0} width={INNER_W} height={INNER_H}
                fill="transparent"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'crosshair' }}
              />
            </g>
          </svg>
        )}
    </>
  );

  if (fullPage) {
    return (
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-primary)',
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className="border-b"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
      }}
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-3">
        {content}
      </div>
    </div>
  );
});

export default PnLChart;
