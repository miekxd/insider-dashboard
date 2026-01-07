'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { createClient } from '@/lib/supabase/client';
import { LLMCall, ParsedLLMCall } from '@/types/insider';
import { BarChart3, RefreshCw, Info, Loader2, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const supabase = createClient();
  const [calls, setCalls] = useState<ParsedLLMCall[]>([]);
  const [allCalls, setAllCalls] = useState<ParsedLLMCall[]>([]);
  const [filter, setFilter] = useState<'all' | 'top-winners' | 'top-losers'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCall, setSelectedCall] = useState<ParsedLLMCall | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchCalls();
  }, []);

  useEffect(() => {
    filterCalls();
  }, [filter, allCalls]);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('llm_calls')
        .select('*')
        .order('entry_date', { ascending: false });

      if (error) throw error;

      const parsedData: ParsedLLMCall[] = (data || []).map((call: LLMCall) => ({
        ...call,
        transaction_dates: parseJSON(call.transaction_dates, []),
        insider_names: parseJSON(call.insider_names, []),
        market_patterns: parseJSON(call.market_patterns, []),
        insider_prices_json: parseJSON(call.insider_prices_json, []),
      }));

      setAllCalls(parsedData);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCalls = () => {
    if (filter === 'all') {
      setCalls(allCalls);
      return;
    }

    const callsWithPnL = allCalls
      .map((call: ParsedLLMCall) => ({
        call,
        pnl: calculatePnL(call)
      }))
      .filter((item: { call: ParsedLLMCall; pnl: number | null }) => item.pnl !== null)
      .sort((a: { call: ParsedLLMCall; pnl: number | null }, b: { call: ParsedLLMCall; pnl: number | null }) => {
        const pnlA = a.pnl || 0;
        const pnlB = b.pnl || 0;
        return filter === 'top-winners' ? pnlB - pnlA : pnlA - pnlB;
      })
      .slice(0, 20)
      .map((item: { call: ParsedLLMCall; pnl: number | null }) => item.call);

    setCalls(callsWithPnL);
  };

  const parseJSON = (value: any, defaultValue: any) => {
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const openDetailsDialog = (call: ParsedLLMCall) => {
    setSelectedCall(call);
    setDialogOpen(true);
  };

  const calculatePnL = (call: ParsedLLMCall): number | null => {
    if (call.price_change_pct !== null && call.price_change_pct !== undefined) {
      return call.price_change_pct;
    }
    if (!call.current_price || !call.entry_price) return null;
    return ((call.current_price - call.entry_price) / call.entry_price) * 100;
  };

  const getHoldingDays = (call: ParsedLLMCall): number | null => {
    if (call.holding_days !== null && call.holding_days !== undefined) {
      return call.holding_days;
    }
    const entryDate = new Date(call.entry_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - entryDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG BUY':
        return { bg: '#10B981', text: 'white' };
      case 'BUY':
        return { bg: '#3B82F6', text: 'white' };
      case 'WATCH':
        return { bg: '#F59E0B', text: 'white' };
      default:
        return { bg: '#6B7280', text: 'white' };
    }
  };

  const getPnLColor = (pnl: number | null) => {
    if (pnl === null) return 'var(--text-secondary)';
    return pnl >= 0 ? '#10B981' : '#EF4444';
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Calculate stats
  const totalCalls = allCalls.length;
  const callsWithPnL = allCalls.filter((c: ParsedLLMCall) => calculatePnL(c) !== null);
  const avgPnL = callsWithPnL.length > 0 
    ? callsWithPnL.reduce((sum: number, call: ParsedLLMCall) => {
        const pnl = calculatePnL(call);
        return sum + (pnl || 0);
      }, 0) / callsWithPnL.length 
    : 0;
  const totalValue = allCalls.reduce((sum: number, call: ParsedLLMCall) => sum + (call.total_transaction_value || 0), 0);
  const strongBuyCount = allCalls.filter((c: ParsedLLMCall) => c.recommendation === 'STRONG BUY').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Professional Header */}
      <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" style={{ color: 'var(--purple-primary)' }} />
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Insider Trading Analysis
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCalls}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Compact Stats Bar */}
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Total:</span>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{totalCalls}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Avg P&L:</span>
            <span 
              className="font-bold font-mono" 
              style={{ color: avgPnL >= 0 ? '#10B981' : '#EF4444' }}
            >
              {avgPnL >= 0 ? '+' : ''}{avgPnL.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Value:</span>
            <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
              ${(totalValue / 1000000).toFixed(1)}M
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Strong Buy:</span>
            <span className="font-bold" style={{ color: 'var(--purple-primary)' }}>{strongBuyCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b px-6 py-2 flex items-center gap-1" style={{ 
        borderColor: 'var(--border-primary)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        {(['all', 'top-winners', 'top-losers'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className="px-3 py-1 rounded text-xs font-medium transition-all duration-150"
            style={{
              backgroundColor: filter === filterType ? 'var(--purple-primary)' : 'transparent',
              color: filter === filterType ? 'white' : 'var(--text-secondary)',
            }}
          >
            {filterType === 'all' ? 'All' : 
             filterType === 'top-winners' ? 'Top Winners' : 
             'Top Losers'}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-3 p-2 rounded text-xs" style={{ 
          backgroundColor: '#FEE2E2',
          borderColor: '#FCA5A5',
          borderWidth: '1px',
          color: '#DC2626'
        }}>
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-red-500 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Professional Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--purple-primary)' }} />
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <BarChart3 className="w-10 h-10 mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No trading calls found
            </p>
          </div>
        ) : (
          <div className="px-6 py-4">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  {(filter === 'top-winners' || filter === 'top-losers') && (
                    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      #
                    </th>
                  )}
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Ticker
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Company
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Rec
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Insider Entry
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Our Entry
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Current Price
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    P&L
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Days
                  </th>
                  <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call: ParsedLLMCall, index: number) => {
                  const pnl = calculatePnL(call);
                  const holdingDays = getHoldingDays(call);
                  const recColor = getRecommendationColor(call.recommendation);
                  const rank = index + 1;

                  return (
                    <tr
                      key={call.id}
                      className="hover:bg-opacity-50 transition-colors cursor-pointer"
                      style={{ 
                        borderBottom: '1px solid var(--border-primary)',
                        backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)'
                      }}
                      onClick={() => openDetailsDialog(call)}
                    >
                      {(filter === 'top-winners' || filter === 'top-losers') && (
                        <td className="py-2.5 px-3">
                          <div className="flex items-center">
                            <span 
                              className="text-xs font-bold w-5 h-5 rounded flex items-center justify-center"
                              style={{ 
                                backgroundColor: rank <= 3 ? 'var(--purple-primary)' : 'var(--bg-tertiary)',
                                color: rank <= 3 ? 'white' : 'var(--text-primary)'
                              }}
                            >
                              {rank}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="py-2.5 px-3">
                        <span 
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: 'var(--purple-primary)', 
                            color: 'white',
                            fontFamily: 'monospace'
                          }}
                        >
                          {call.ticker}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {call.company_name || '—'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span 
                            className="text-xs font-bold px-1.5 py-0.5 rounded inline-block w-fit"
                            style={{ backgroundColor: recColor.bg, color: recColor.text }}
                          >
                            {call.recommendation}
                          </span>
                          {call.signal_strength && (
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {call.signal_strength}/10
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {call.insider_avg_price ? `$${call.insider_avg_price.toFixed(2)}` : '—'}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {call.transaction_dates && call.transaction_dates.length > 0 
                            ? formatDate(call.transaction_dates.sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())[0])
                            : '—'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {call.entry_price ? `$${call.entry_price.toFixed(2)}` : '—'}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {formatDate(call.entry_date)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {call.current_price ? `$${call.current_price.toFixed(2)}` : '—'}
                        </div>
                        {call.last_price_update && (
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {formatDate(call.last_price_update)}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {pnl !== null ? (
                          <div 
                            className="text-xs font-mono font-bold"
                            style={{ color: getPnLColor(pnl) }}
                          >
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {holdingDays !== null ? (
                          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {holdingDays}d
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e: any) => {
                            e.stopPropagation();
                            openDetailsDialog(call);
                          }}
                          className="p-1 rounded hover:bg-opacity-80 transition-colors"
                          style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                          <Info className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay 
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)'
            }}
          >
            {selectedCall && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selectedCall.ticker} - {selectedCall.company_name}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      className="p-2 rounded-md hover:bg-opacity-80 transition-colors"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      <X className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        LLM Rationale
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {selectedCall.llm_rationale}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Transaction Details
                      </h4>
                      <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <div><strong>Insiders:</strong> {selectedCall.number_of_insiders || 0}</div>
                        <div><strong>Total Value:</strong> ${selectedCall.total_transaction_value ? (selectedCall.total_transaction_value / 1000000).toFixed(2) : '0'}M</div>
                        <div><strong>Time Horizon:</strong> {selectedCall.time_horizon || 'N/A'}</div>
                        <div><strong>Traded:</strong> {selectedCall.traded ? 'Yes' : 'No'}</div>
                        {selectedCall.rank && (
                          <div><strong>Rank:</strong> {selectedCall.rank}</div>
                        )}
                        {selectedCall.pnl_dollars !== null && selectedCall.pnl_dollars !== undefined && (
                          <div><strong>P&L ($):</strong> ${selectedCall.pnl_dollars.toFixed(2)}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Insider Names
                      </h4>
                      <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                        {selectedCall.insider_names.map((name: string, idx: number) => (
                          <li key={idx}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Transaction Dates
                      </h4>
                      <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                        {selectedCall.transaction_dates.map((date: string, idx: number) => (
                          <li key={idx}>{formatDate(date)}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Insider Prices
                      </h4>
                      {selectedCall.insider_prices_json.length > 0 ? (
                        <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                          {selectedCall.insider_prices_json.map((price: number | null, idx: number) => (
                            <li key={idx}>${price ? price.toFixed(2) : 'N/A'}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No prices recorded</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Market Patterns
                      </h4>
                      {selectedCall.market_patterns.length > 0 ? (
                        <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                          {selectedCall.market_patterns.map((pattern: string, idx: number) => (
                            <li key={idx}>{pattern}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No patterns recorded</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Metadata
                      </h4>
                      <div className="space-y-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <div><strong>Batch ID:</strong> {selectedCall.batch_id}</div>
                        <div><strong>Call Date:</strong> {formatDate(selectedCall.call_date)}</div>
                        {selectedCall.last_price_update && (
                          <div><strong>Price Updated:</strong> {formatDate(selectedCall.last_price_update)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

