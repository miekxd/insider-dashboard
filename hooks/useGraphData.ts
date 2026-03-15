'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Graph from 'graphology';
import { createClient } from '@/lib/supabase/client';
import { GraphRow, GraphFilters, InsiderNodeAttributes, CompanyNodeAttributes, EdgeAttributes } from '@/types/graph';
import { getTierColor, getRoleColor, COMPANY_COLOR } from '@/lib/graphColors';

function tierSizeBoost(tier: string | null | undefined): number {
  if (tier === 'ELITE') return 2.0;
  if (tier === 'STRONG') return 1.5;
  if (tier === 'AVERAGE') return 1.2;
  return 1.0;
}

function insiderSize(totalBuyValue: number, tier?: string | null): number {
  if (!totalBuyValue || totalBuyValue <= 0) return 2 * tierSizeBoost(tier);
  const base = Math.max(2, Math.min(5, Math.log10(totalBuyValue / 50000) * 1.5 + 2));
  return Math.min(8, base * tierSizeBoost(tier));
}

function companySize(uniqueInsiders: number): number {
  return Math.max(3, Math.min(6, uniqueInsiders + 2));
}

function edgeSize(buyCount: number): number {
  return Math.max(0.3, Math.min(1.5, buyCount * 0.15));
}

function isWithinTimeRange(dateStr: string | null, filter: GraphFilters['time']): boolean {
  if (filter === 'all' || !dateStr) return true;
  const days = filter === '30d' ? 30 : filter === '60d' ? 60 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(dateStr) >= cutoff;
}

export interface UseGraphDataReturn {
  graph: Graph | null;
  loading: boolean;
  error: string;
  nodeCount: number;
  edgeCount: number;
  refresh: (filters: GraphFilters) => Promise<void>;
}

export function useGraphData(filters: GraphFilters): UseGraphDataReturn {
  const supabase = createClient();
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchGraph = useCallback(async (f: GraphFilters) => {
    try {
      setLoading(true);
      setError('');

      // Build query — filter by minValue and role server-side
      let query = supabase
        .from('insider_profiles')
        .select(`
          id,
          canonical_name,
          entity_type,
          total_buy_value,
          total_buy_transactions,
          buy_sell_ratio,
          unique_tickers_bought,
          active_since,
          last_transaction_date,
          insider_tier,
          insider_company_roles!inner (
            buy_count,
            total_buy_value,
            avg_buy_price,
            title,
            is_officer,
            is_director,
            is_ten_percent_owner,
            first_filing_date,
            last_filing_date,
            company_profiles!inner (
              id,
              ticker,
              company_name,
              sector,
              total_buy_value,
              unique_insiders_bought
            )
          )
        `)
        .gt('total_buy_value', f.minValue)
        .gt('insider_company_roles.buy_count', 0);

      if (f.role !== 'all') {
        query = query.eq('entity_type', f.role);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      if (!isMountedRef.current) return;

      // Flatten nested Supabase response into GraphRow[]
      const rows: GraphRow[] = [];
      for (const insider of (data || [])) {
        const roles = (insider as any).insider_company_roles || [];
        for (const role of roles) {
          const company = role.company_profiles;
          if (!company) continue;
          if (company.ticker === 'N/A' || company.ticker === 'NONE') continue;

          // Time filter on edge
          if (!isWithinTimeRange(role.last_filing_date, f.time)) continue;

          rows.push({
            insider_id: insider.id,
            canonical_name: insider.canonical_name,
            entity_type: insider.entity_type,
            total_buy_value: insider.total_buy_value,
            total_buy_transactions: insider.total_buy_transactions,
            buy_sell_ratio: insider.buy_sell_ratio,
            unique_tickers_bought: insider.unique_tickers_bought,
            active_since: insider.active_since,
            last_transaction_date: insider.last_transaction_date,
            insider_tier: insider.insider_tier,
            company_id: company.id,
            ticker: company.ticker,
            company_name: company.company_name,
            sector: company.sector,
            company_total_buy_value: company.total_buy_value,
            unique_insiders_bought: company.unique_insiders_bought,
            buy_count: role.buy_count,
            edge_value: role.total_buy_value,
            avg_buy_price: role.avg_buy_price,
            title: role.title,
            is_officer: role.is_officer,
            is_director: role.is_director,
            is_ten_percent_owner: role.is_ten_percent_owner,
            first_filing_date: role.first_filing_date,
            last_filing_date: role.last_filing_date,
          });
        }
      }

      // Build graphology graph
      const g = new Graph({ multi: false, type: 'directed' });

      const insiderNodeIds = new Set<string>();
      const companyNodeIds = new Set<string>();

      for (const row of rows) {
        const insiderKey = `insider-${row.insider_id}`;
        const companyKey = `company-${row.company_id}`;

        if (!insiderNodeIds.has(insiderKey)) {
          insiderNodeIds.add(insiderKey);
          const attrs: InsiderNodeAttributes = {
            nodeType: 'insider',
            label: row.canonical_name,
            canonical_name: row.canonical_name,
            entity_type: row.entity_type,
            total_buy_value: row.total_buy_value,
            total_buy_transactions: row.total_buy_transactions,
            buy_sell_ratio: row.buy_sell_ratio,
            unique_tickers_bought: row.unique_tickers_bought,
            active_since: row.active_since,
            last_transaction_date: row.last_transaction_date,
            insider_tier: row.insider_tier,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: insiderSize(row.total_buy_value, row.insider_tier),
            color: getTierColor(row.insider_tier),
            borderColor: getRoleColor(row.entity_type),
          };
          g.addNode(insiderKey, attrs);
        }

        if (!companyNodeIds.has(companyKey)) {
          companyNodeIds.add(companyKey);
          const attrs: CompanyNodeAttributes = {
            nodeType: 'company',
            label: row.ticker,
            ticker: row.ticker,
            company_name: row.company_name,
            sector: row.sector,
            unique_insiders_bought: row.unique_insiders_bought,
            company_total_buy_value: row.company_total_buy_value,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: companySize(row.unique_insiders_bought),
            color: COMPANY_COLOR,
            borderColor: COMPANY_COLOR,
          };
          g.addNode(companyKey, attrs);
        }

        const edgeKey = `${insiderKey}->${companyKey}`;
        if (!g.hasEdge(edgeKey)) {
          const edgeAttrs: EdgeAttributes = {
            buy_count: row.buy_count,
            edge_value: row.edge_value,
            avg_buy_price: row.avg_buy_price,
            title: row.title,
            is_officer: row.is_officer,
            is_director: row.is_director,
            is_ten_percent_owner: row.is_ten_percent_owner,
            first_filing_date: row.first_filing_date,
            last_filing_date: row.last_filing_date,
            size: edgeSize(row.buy_count),
            color: '#333333',
            insiderName: row.canonical_name,
            ticker: row.ticker,
          };
          g.addEdgeWithKey(edgeKey, insiderKey, companyKey, edgeAttrs);
        }
      }

      setGraph(g);
      setNodeCount(g.order);
      setEdgeCount(g.size);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load graph data');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [supabase]);

  const refresh = useCallback((f: GraphFilters) => fetchGraph(f), [fetchGraph]);

  useEffect(() => {
    fetchGraph(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minValue, filters.role, filters.time]);

  return { graph, loading, error, nodeCount, edgeCount, refresh };
}
