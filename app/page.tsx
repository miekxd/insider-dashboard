'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { RefreshCw, X, Sun, Moon, Activity, Layers, Network, LineChart } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLLMCalls } from '@/hooks/useLLMCalls';
import { usePortfolioPnL, PnLFilters } from '@/hooks/usePortfolioPnL';
import { ParsedLLMCall } from '@/types/insider';
import { FILTER_OPTIONS, FilterType, VERSION_LINKS } from '@/lib/constants';
import { formatCompactCurrency } from '@/lib/formatters';

// Components
import { StatsRow } from '@/components/StatsRow';
import { DataTable } from '@/components/DataTable';
import { CallDetailModal } from '@/components/CallDetailModal';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PnLChart } from '@/components/PnLChart';

const ALL_RECOMMENDATIONS = ['STRONG BUY', 'BUY', 'WATCH'];
const ALL_SECTORS = ['Finance', 'Healthcare', 'Consumer', 'Technology', 'Materials', 'Energy', 'Industrial', 'Real Estate', 'Other'];

type ActiveTab = FilterType | 'pnl';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  const {
    calls,
    loading,
    error,
    clearError,
    refresh,
    isRefreshDisabled,
    filter,
    setFilter,
    stats,
    minSignal,
    setMinSignal,
    maxSignal,
  } = useLLMCalls();

  const [pnlRecs, setPnlRecs] = useState<string[]>([]);
  const [pnlSectors, setPnlSectors] = useState<string[]>([]);

  const pnlFilters = useMemo<PnLFilters>(() => ({
    minSignal: 0,
    recommendations: pnlRecs,
    sectors: pnlSectors,
  }), [pnlRecs, pnlSectors]);

  const portfolioPnL = usePortfolioPnL(pnlFilters);

  const toggleRec = useCallback((rec: string) => {
    setPnlRecs((prev) =>
      prev.includes(rec) ? prev.filter((r) => r !== rec) : [...prev, rec]
    );
  }, []);

  const toggleSector = useCallback((sector: string) => {
    setPnlSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>(FILTER_OPTIONS[0].key);
  const [selectedCall, setSelectedCall] = useState<ParsedLLMCall | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTabChange = useCallback(
    (tab: ActiveTab) => {
      setActiveTab(tab);
      if (tab !== 'pnl') {
        setFilter(tab as FilterType);
      }
    },
    [setFilter]
  );

  const handleRowClick = useCallback((call: ParsedLLMCall) => {
    setSelectedCall(call);
    setDialogOpen(true);
  }, []);

  const isPnlTab = activeTab === 'pnl';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div>
              <h1
                className="font-display text-lg font-semibold tracking-tight leading-none"
                style={{ color: 'var(--text-primary)' }}
              >
                Insider Trades
              </h1>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {stats.totalCalls} positions tracked
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/graph"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors hover:opacity-80"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                title="Open Insider Network Graph"
              >
                <Network className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Network</span>
              </Link>
              {VERSION_LINKS.length > 0 && (
                <div className="flex items-center gap-1">
                  <Layers
                    className="w-3.5 h-3.5"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-hidden
                  />
                  {VERSION_LINKS.map((v) => (
                    <Link
                      key={v.path}
                      href={v.path}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors hover:opacity-80"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                      title={`Open ${v.label}`}
                    >
                      {v.label}
                    </Link>
                  ))}
                </div>
              )}
              <button
                onClick={refresh}
                disabled={loading || isRefreshDisabled}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--text-on-accent)' }}
                title={isRefreshDisabled ? 'Please wait before refreshing again' : 'Refresh data'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded transition-colors"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <StatsRow
        avgPnL={stats.avgPnL}
        totalValue={stats.totalValue}
        strongBuyCount={stats.strongBuyCount}
        totalCalls={stats.totalCalls}
        winRate={stats.winRate}
        winCount={stats.winCount}
        callsWithPnL={stats.callsWithPnL}
        formatCompactCurrency={formatCompactCurrency}
      />

      {/* Tab bar */}
      <div className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            {/* Left: position tabs + P&L History tab */}
            <nav className="flex items-center gap-1" role="tablist" aria-label="View">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleTabChange(f.key)}
                  className="px-4 py-2 text-sm font-medium rounded transition-colors"
                  style={{
                    backgroundColor: activeTab === f.key ? 'var(--accent-primary)' : 'transparent',
                    color: activeTab === f.key ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  }}
                  role="tab"
                  aria-selected={activeTab === f.key}
                >
                  {f.label}
                </button>
              ))}

              {/* Divider */}
              <div
                className="mx-1 h-4 w-px"
                style={{ backgroundColor: 'var(--border-primary)' }}
                aria-hidden
              />

              <button
                onClick={() => handleTabChange('pnl')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded transition-colors"
                style={{
                  backgroundColor: isPnlTab ? 'var(--accent-primary)' : 'transparent',
                  color: isPnlTab ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                }}
                role="tab"
                aria-selected={isPnlTab}
              >
                <LineChart className="w-3.5 h-3.5" />
                P&amp;L History
              </button>
            </nav>

            {/* Right: signal score filter — only on position tabs */}
            {!isPnlTab && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Score ≥
                </span>
                <input
                  type="range"
                  min={0}
                  max={maxSignal}
                  step={1}
                  value={minSignal}
                  onChange={(e) => setMinSignal(Number(e.target.value))}
                  className="w-28 accent-[var(--accent-primary)]"
                  aria-label="Minimum signal score"
                />
                <span
                  className="font-mono text-xs tabular-nums w-8 text-right"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {minSignal === 0 ? 'all' : minSignal}
                </span>
                {minSignal > 0 && (
                  <button
                    onClick={() => setMinSignal(0)}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                    title="Clear signal filter"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && !isPnlTab && (
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pt-4">
          <div
            className="flex items-center justify-between px-4 py-3 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--accent-negative-muted)', color: 'var(--accent-negative)' }}
            role="alert"
          >
            <span>{error}</span>
            <button onClick={clearError} className="ml-4 hover:opacity-70" aria-label="Dismiss error">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* P&L History tab */}
      {isPnlTab && (
        <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6 space-y-4">
          {/* Filters */}
          <div
            className="rounded-lg border p-4 space-y-3"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}
          >
            {/* Recommendation pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                Rating
              </span>
              {ALL_RECOMMENDATIONS.map((rec) => {
                const active = pnlRecs.length === 0 || pnlRecs.includes(rec);
                return (
                  <button
                    key={rec}
                    onClick={() => toggleRec(rec)}
                    className="text-xs px-2.5 py-1 rounded font-medium transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: active ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
                    }}
                  >
                    {rec}
                  </button>
                );
              })}
              {pnlRecs.length > 0 && (
                <button
                  onClick={() => setPnlRecs([])}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                >
                  reset
                </button>
              )}
            </div>

            {/* Sector pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                Sector
              </span>
              {ALL_SECTORS.map((sector) => {
                const active = pnlSectors.length === 0 || pnlSectors.includes(sector);
                return (
                  <button
                    key={sector}
                    onClick={() => toggleSector(sector)}
                    className="text-xs px-2.5 py-1 rounded font-medium transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: active ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
                    }}
                  >
                    {sector}
                  </button>
                );
              })}
              {pnlSectors.length > 0 && (
                <button
                  onClick={() => setPnlSectors([])}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                >
                  reset
                </button>
              )}
            </div>
          </div>

          <PnLChart
            data={portfolioPnL.data}
            loading={portfolioPnL.loading}
            error={portfolioPnL.error}
            fullPage
          />
        </main>
      )}

      {/* Positions tab */}
      {!isPnlTab && (
        <main
          className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6"
          id="positions-table"
          role="tabpanel"
        >
          <ErrorBoundary>
            {loading ? (
              <SkeletonLoader rows={10} />
            ) : calls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Activity className="w-12 h-12 mb-4" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No positions found
                </p>
              </div>
            ) : (
              <DataTable calls={calls} filter={filter} onRowClick={handleRowClick} />
            )}
          </ErrorBoundary>
        </main>
      )}

      {/* Footer */}
      <footer
        className="border-t py-6"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            This website provides automated analysis of publicly available SEC Form 4 filings for educational and informational purposes only. This is NOT investment advice. All investments carry risk. Past insider trading activity does not predict future stock performance. Consult a licensed financial advisor before making investment decisions. Data may contain errors or delays.
          </p>
        </div>
      </footer>

      <CallDetailModal call={selectedCall} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
