'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LLMCall, ParsedLLMCall } from '@/types/insider';
import {
  FilterType,
  FILTER_TYPES,
  TOP_LIST_LIMIT,
  REFRESH_DEBOUNCE_MS,
} from '@/lib/constants';
import { parseLLMCall, calculatePnL, calculateStats } from '@/lib/calculations';

interface UseLLMCalls1_5Return {
  /** Filtered calls based on current filter */
  calls: ParsedLLMCall[];
  /** All calls from the database */
  allCalls: ParsedLLMCall[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string;
  /** Clear error message */
  clearError: () => void;
  /** Refresh data from database */
  refresh: () => Promise<void>;
  /** Whether refresh is currently debounced */
  isRefreshDisabled: boolean;
  /** Current filter type */
  filter: FilterType;
  /** Set filter type */
  setFilter: (filter: FilterType) => void;
  /** Computed statistics */
  stats: ReturnType<typeof calculateStats>;
}

/**
 * Custom hook for fetching and managing LLM calls data from v1.5 table
 *
 * Features:
 * - Data fetching with Supabase from llm_calls_1.5 table
 * - Filtering (all, top winners, top losers)
 * - Computed statistics with memoization
 * - Rate-limited refresh to prevent API spam
 * - Proper error handling
 *
 * @example
 * const { calls, loading, error, refresh, filter, setFilter, stats } = useLLMCalls1_5();
 */
export function useLLMCalls1_5(): UseLLMCalls1_5Return {
  const supabase = createClient();

  // State
  const [allCalls, setAllCalls] = useState<ParsedLLMCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>(FILTER_TYPES.ALL);
  const [isRefreshDisabled, setIsRefreshDisabled] = useState(false);

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch calls from database (v1.5 table)
   *
   * Wrapped in useCallback to maintain stable reference
   * and prevent unnecessary effect re-runs
   */
  const fetchCalls = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('llm_calls_1.5')
        .select('*')
        .order('entry_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        const parsedData: ParsedLLMCall[] = (data || []).map(
          (call: LLMCall) => parseLLMCall(call)
        );
        setAllCalls(parsedData);
      }
    } catch (err: unknown) {
      // Only update error state if component is still mounted
      if (isMountedRef.current) {
        // Proper error handling with type narrowing
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An unexpected error occurred');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [supabase]);

  /**
   * Rate-limited refresh function
   *
   * Prevents users from spamming the refresh button
   * and overwhelming the database
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (isRefreshDisabled) {
      return;
    }

    // Disable refresh button temporarily
    setIsRefreshDisabled(true);

    await fetchCalls();

    // Re-enable after debounce period
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsRefreshDisabled(false);
      }
    }, REFRESH_DEBOUNCE_MS);
  }, [fetchCalls, isRefreshDisabled]);

  /**
   * Clear error message
   */
  const clearError = useCallback((): void => {
    setError('');
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  /**
   * Filter calls based on current filter
   *
   * Memoized to prevent unnecessary recalculations
   * Only recomputes when allCalls or filter changes
   */
  const calls = useMemo((): ParsedLLMCall[] => {
    if (filter === FILTER_TYPES.ALL) {
      return allCalls;
    }

    // Create array with pre-computed PnL values (single pass)
    const callsWithPnL = allCalls
      .map((call) => ({
        call,
        pnl: calculatePnL(call),
      }))
      .filter((item) => item.pnl !== null);

    // Sort based on filter type
    const sorted = callsWithPnL.sort((a, b) => {
      const pnlA = a.pnl ?? 0;
      const pnlB = b.pnl ?? 0;
      return filter === FILTER_TYPES.TOP_WINNERS ? pnlB - pnlA : pnlA - pnlB;
    });

    // Return top N results
    return sorted.slice(0, TOP_LIST_LIMIT).map((item) => item.call);
  }, [allCalls, filter]);

  /**
   * Compute statistics from all calls
   *
   * Memoized to prevent unnecessary recalculations
   */
  const stats = useMemo(() => calculateStats(allCalls), [allCalls]);

  return {
    calls,
    allCalls,
    loading,
    error,
    clearError,
    refresh,
    isRefreshDisabled,
    filter,
    setFilter,
    stats,
  };
}

export default useLLMCalls1_5;