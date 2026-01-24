'use client';

import { useState, useCallback } from 'react';
import { RefreshCw, X, Sun, Moon, Activity } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLLMCalls1_5 } from '@/hooks/useLLMCalls1_5';
import { ParsedLLMCall } from '@/types/insider';
import { FILTER_OPTIONS, FilterType } from '@/lib/constants';
import { formatCompactCurrency } from '@/lib/formatters';

// Components
import { StatsRow } from '@/components/StatsRow';
import { DataTable } from '@/components/DataTable';
import { CallDetailModal } from '@/components/CallDetailModal';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Version 1.5 page component
 *
 * Dashboard displaying insider trading data from llm_calls_1.5 table.
 * Uses composition pattern with extracted components.
 */
export default function Version1_5Page() {
  const { theme, toggleTheme } = useTheme();

  // Data management via custom hook for v1.5
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
  } = useLLMCalls1_5();

  // Modal state
  const [selectedCall, setSelectedCall] = useState<ParsedLLMCall | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Handle row click - memoized to prevent unnecessary re-renders
  const handleRowClick = useCallback((call: ParsedLLMCall) => {
    setSelectedCall(call);
    setDialogOpen(true);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilter: FilterType) => {
      setFilter(newFilter);
    },
    [setFilter]
  );

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
            {/* Title */}
            <div>
              <h1
                className="font-display text-lg font-semibold tracking-tight leading-none"
                style={{ color: 'var(--text-primary)' }}
              >
                Insider Trades v1.5
              </h1>
              <span
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {stats.totalCalls} positions tracked
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                disabled={loading || isRefreshDisabled}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--text-on-accent)',
                }}
                title={isRefreshDisabled ? 'Please wait before refreshing again' : 'Refresh data'}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded transition-colors"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                }}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
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

      {/* Filter Tabs */}
      <div className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <nav className="flex gap-1 py-2" role="tablist" aria-label="Filter positions">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                className="px-4 py-2 text-sm font-medium rounded transition-colors"
                style={{
                  backgroundColor:
                    filter === f.key ? 'var(--accent-primary)' : 'transparent',
                  color:
                    filter === f.key
                      ? 'var(--text-on-accent)'
                      : 'var(--text-secondary)',
                }}
                role="tab"
                aria-selected={filter === f.key}
                aria-controls="positions-table"
              >
                {f.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pt-4">
          <div
            className="flex items-center justify-between px-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--accent-negative-muted)',
              color: 'var(--accent-negative)',
            }}
            role="alert"
          >
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-4 hover:opacity-70"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
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
              <Activity
                className="w-12 h-12 mb-4"
                style={{ color: 'var(--text-tertiary)' }}
              />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No positions found
              </p>
            </div>
          ) : (
            <DataTable
              calls={calls}
              filter={filter}
              onRowClick={handleRowClick}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Disclaimer Footer */}
      <footer
        className="border-t py-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <p
            className="text-xs text-center leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            This website provides automated analysis of publicly available SEC Form 4 filings for educational and informational purposes only. This is NOT investment advice. All investments carry risk. Past insider trading activity does not predict future stock performance. Consult a licensed financial advisor before making investment decisions. Data may contain errors or delays.
          </p>
        </div>
      </footer>

      {/* Detail Modal */}
      <CallDetailModal
        call={selectedCall}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}