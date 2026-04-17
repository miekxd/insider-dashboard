'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface TradeOutcome {
  ticker: string;
  transaction_date: string;
  entry_price: number;
  current_price: number;
  return_pct: number;
  transaction_value: number;
}

export interface InsiderMetrics {
  trade_count: number;
  win_rate: number;       // 0–1
  avg_return: number;     // percent
  best_return: number;    // percent
  worst_return: number;   // percent
  total_invested: number;
  trades: TradeOutcome[];
}

export function useInsiderMetrics(canonicalName: string | null) {
  const supabase = createClient();
  const [metrics, setMetrics] = useState<InsiderMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canonicalName) { setMetrics(null); return; }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      try {
        // 1. Resolve insider_profile_id from canonical_name
        const { data: profile, error: profileErr } = await supabase
          .from('insider_profiles')
          .select('id')
          .eq('canonical_name', canonicalName!)
          .single();

        if (profileErr || !profile) { if (!cancelled) { setMetrics(null); setLoading(false); } return; }

        // 2. Get all P-code transactions for this insider via profile ID
        const { data: txns, error: txnErr } = await supabase
          .from('insider_transactions')
          .select('ticker, transaction_date, price_per_share, transaction_value')
          .eq('insider_profile_id', profile.id)
          .eq('transaction_code', 'P')
          .gt('price_per_share', 0)
          .order('transaction_date', { ascending: false });

        if (txnErr || !txns?.length) { if (!cancelled) { setMetrics(null); setLoading(false); } return; }

        // 2. Fetch current prices for those tickers
        const tickers = [...new Set(txns.map(t => t.ticker))];
        const { data: prices, error: priceErr } = await supabase
          .from('ticker_prices')
          .select('ticker, current_price')
          .in('ticker', tickers);

        if (priceErr || cancelled) return;

        const priceMap = new Map((prices ?? []).map(p => [p.ticker, p.current_price]));

        // 3. Compute outcomes — only for trades where we have a current price
        const trades: TradeOutcome[] = txns
          .filter(t => priceMap.has(t.ticker))
          .map(t => {
            const current = priceMap.get(t.ticker)!;
            return {
              ticker: t.ticker,
              transaction_date: t.transaction_date,
              entry_price: t.price_per_share,
              current_price: current,
              return_pct: ((current - t.price_per_share) / t.price_per_share) * 100,
              transaction_value: t.transaction_value ?? 0,
            };
          });

        if (!trades.length) { if (!cancelled) { setMetrics(null); setLoading(false); } return; }

        const wins        = trades.filter(t => t.return_pct > 0).length;
        const avg_return  = trades.reduce((s, t) => s + t.return_pct, 0) / trades.length;
        const best_return = Math.max(...trades.map(t => t.return_pct));
        const worst_return = Math.min(...trades.map(t => t.return_pct));
        const total_invested = trades.reduce((s, t) => s + t.transaction_value, 0);

        if (!cancelled) {
          setMetrics({
            trade_count: trades.length,
            win_rate: wins / trades.length,
            avg_return,
            best_return,
            worst_return,
            total_invested,
            trades,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [canonicalName]);

  return { metrics, loading };
}
