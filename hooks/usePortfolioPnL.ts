'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface DailyPnLPoint {
  date: string;          // 'YYYY-MM-DD'
  avg_pnl_pct: number;
  position_count: number;
}

export interface PnLFilters {
  minSignal: number;
  recommendations: string[];  // empty = all
  sectors: string[];           // empty = all
}

interface UsePortfolioPnLReturn {
  data: DailyPnLPoint[];
  loading: boolean;
  error: string;
}

export function usePortfolioPnL(filters: PnLFilters): UsePortfolioPnLReturn {
  const supabase = createClient();
  const [data, setData] = useState<DailyPnLPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const recsKey = filters.recommendations.slice().sort().join(',');
  const sectorsKey = filters.sectors.slice().sort().join(',');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        // Step 1: resolve which llm_call_ids match the filters
        let callQuery = supabase.from('llm_calls').select('id');
        if (filters.minSignal > 0) {
          callQuery = callQuery.gte('signal_strength', filters.minSignal);
        }
        if (filters.recommendations.length > 0) {
          callQuery = callQuery.in('recommendation', filters.recommendations);
        }
        if (filters.sectors.length > 0) {
          callQuery = callQuery.in('sector', filters.sectors);
        }

        const { data: calls, error: callsError } = await callQuery;
        if (callsError) throw callsError;

        const callIds = (calls ?? []).map((r) => r.id);
        if (callIds.length === 0) {
          if (!cancelled) { setData([]); setLoading(false); }
          return;
        }

        // Step 2: fetch price history for matching positions
        const { data: rows, error: fetchError } = await supabase
          .from('position_price_history')
          .select('price_date, pnl_pct')
          .in('llm_call_id', callIds)
          .not('pnl_pct', 'is', null)
          .order('price_date', { ascending: true });

        if (fetchError) throw fetchError;

        // Aggregate by date client-side
        const byDate = new Map<string, { sum: number; count: number }>();
        for (const row of rows ?? []) {
          const date = row.price_date as string;
          const pnl = Number(row.pnl_pct);
          const existing = byDate.get(date);
          if (existing) {
            existing.sum += pnl;
            existing.count += 1;
          } else {
            byDate.set(date, { sum: pnl, count: 1 });
          }
        }

        const aggregated: DailyPnLPoint[] = Array.from(byDate.entries()).map(
          ([date, { sum, count }]) => ({
            date,
            avg_pnl_pct: sum / count,
            position_count: count,
          })
        );

        if (!cancelled) setData(aggregated);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load P&L history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minSignal, recsKey, sectorsKey]);

  return { data, loading, error };
}
