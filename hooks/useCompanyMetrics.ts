'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface CompanyInsider {
  canonical_name: string;
  entity_type: string;
  insider_tier: string | null;
  buy_count: number;
  total_buy_value: number;
  avg_buy_price: number | null;
  last_filing_date: string | null;
  title: string | null;
  win_rate: number | null;
  avg_return_pct: number | null;
}

export interface CompanyMetrics {
  current_price: number | null;
  previous_close: number | null;
  price_change_pct: number | null;
  insiders: CompanyInsider[];
}

export function useCompanyMetrics(ticker: string | null) {
  const supabase = createClient();
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) { setMetrics(null); return; }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [priceRes, companyRes] = await Promise.all([
          supabase
            .from('ticker_prices')
            .select('current_price, previous_close, price_change_pct')
            .eq('ticker', ticker!)
            .single(),
          supabase
            .from('company_profiles')
            .select('id')
            .eq('ticker', ticker!)
            .single(),
        ]);

        if (cancelled) return;
        if (!companyRes.data) {
          setMetrics({ current_price: priceRes.data?.current_price ?? null, previous_close: priceRes.data?.previous_close ?? null, price_change_pct: priceRes.data?.price_change_pct ?? null, insiders: [] });
          return;
        }

        const { data: rolesData } = await supabase
          .from('insider_company_roles')
          .select(`
            buy_count,
            total_buy_value,
            avg_buy_price,
            last_filing_date,
            title,
            win_rate,
            avg_return_pct,
            insider_profiles (
              canonical_name,
              entity_type,
              insider_tier
            )
          `)
          .eq('company_profile_id', companyRes.data.id)
          .gt('buy_count', 0)
          .order('total_buy_value', { ascending: false })
          .limit(25);

        if (cancelled) return;

        const insiders: CompanyInsider[] = (rolesData ?? [])
          .filter((r: any) => r.insider_profiles)
          .map((r: any) => ({
            canonical_name: r.insider_profiles.canonical_name,
            entity_type: r.insider_profiles.entity_type,
            insider_tier: r.insider_profiles.insider_tier,
            buy_count: r.buy_count,
            total_buy_value: r.total_buy_value,
            avg_buy_price: r.avg_buy_price,
            last_filing_date: r.last_filing_date,
            title: r.title,
            win_rate: r.win_rate,
            avg_return_pct: r.avg_return_pct,
          }));

        setMetrics({
          current_price: priceRes.data?.current_price ?? null,
          previous_close: priceRes.data?.previous_close ?? null,
          price_change_pct: priceRes.data?.price_change_pct ?? null,
          insiders,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ticker]);

  return { metrics, loading };
}
