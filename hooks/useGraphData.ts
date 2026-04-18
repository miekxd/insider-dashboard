'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GraphRow, GraphFilters, D3Node, D3InsiderNode, D3CompanyNode, D3Link } from '@/types/graph';
import { getTierColor, getRoleColor, getTierColorBright, getRoleColorBright, COMPANY_COLOR, COMPANY_COLOR_BRIGHT } from '@/lib/graphColors';

function tierSizeBoost(tier: string | null | undefined): number {
  if (tier === 'ELITE') return 2.0;
  if (tier === 'STRONG') return 1.5;
  if (tier === 'AVERAGE') return 1.2;
  return 1.0;
}

function insiderSize(totalBuyValue: number, tier?: string | null): number {
  if (!totalBuyValue || totalBuyValue <= 0) return 24 * tierSizeBoost(tier);
  const base = Math.max(24, Math.min(42, Math.log10(totalBuyValue / 50000) * 9 + 24));
  return Math.min(78, base * tierSizeBoost(tier));
}

function companySize(uniqueInsiders: number): number {
  return Math.max(30, Math.min(66, uniqueInsiders * 6 + 24));
}

function edgeStrokeWidth(buyCount: number): number {
  return Math.max(2, Math.min(6, buyCount * 0.6));
}

function isWithinTimeRange(dateStr: string | null, filter: GraphFilters['time']): boolean {
  if (filter === 'all' || !dateStr) return true;
  const days = filter === '30d' ? 30 : filter === '60d' ? 60 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(dateStr) >= cutoff;
}

export interface UseGraphDataReturn {
  nodes: D3Node[];
  links: D3Link[];
  loading: boolean;
  error: string;
  nodeCount: number;
  edgeCount: number;
  refresh: (filters: GraphFilters) => Promise<void>;
}

export function useGraphData(filters: GraphFilters): UseGraphDataReturn {
  const supabase = createClient();
  const [nodes, setNodes] = useState<D3Node[]>([]);
  const [links, setLinks] = useState<D3Link[]>([]);
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
              industry,
              exchange,
              market_cap,
              description,
              total_buy_value,
              total_buy_transactions,
              unique_insiders_bought,
              last_insider_buy_date,
              avg_return_pct
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
            industry: company.industry,
            exchange: company.exchange,
            market_cap: company.market_cap,
            description: company.description,
            company_total_buy_value: company.total_buy_value,
            company_total_buy_transactions: company.total_buy_transactions,
            unique_insiders_bought: company.unique_insiders_bought,
            last_insider_buy_date: company.last_insider_buy_date,
            company_avg_return_pct: company.avg_return_pct,
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

      // Build D3 nodes and links
      const insiderMap = new Map<string, D3InsiderNode>();
      const companyMap = new Map<string, D3CompanyNode>();
      const linkMap = new Map<string, D3Link>();

      for (const row of rows) {
        const insiderKey = `insider-${row.insider_id}`;
        const companyKey = `company-${row.company_id}`;

        if (!insiderMap.has(insiderKey)) {
          insiderMap.set(insiderKey, {
            id: insiderKey,
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
            size: insiderSize(row.total_buy_value, row.insider_tier),
            fill: getTierColor(row.insider_tier),
            stroke: getRoleColor(row.entity_type),
          });
        }

        if (!companyMap.has(companyKey)) {
          companyMap.set(companyKey, {
            id: companyKey,
            nodeType: 'company',
            label: row.ticker,
            ticker: row.ticker,
            company_name: row.company_name,
            sector: row.sector,
            industry: row.industry,
            exchange: row.exchange,
            market_cap: row.market_cap,
            description: row.description,
            unique_insiders_bought: row.unique_insiders_bought,
            company_total_buy_value: row.company_total_buy_value,
            total_buy_transactions: row.company_total_buy_transactions,
            last_insider_buy_date: row.last_insider_buy_date,
            avg_return_pct: row.company_avg_return_pct,
            size: companySize(row.unique_insiders_bought),
            fill: COMPANY_COLOR,
            stroke: COMPANY_COLOR_BRIGHT,
          });
        }

        const linkKey = `${insiderKey}->${companyKey}`;
        if (!linkMap.has(linkKey)) {
          linkMap.set(linkKey, {
            id: linkKey,
            source: insiderKey,
            target: companyKey,
            strokeWidth: edgeStrokeWidth(row.buy_count),
            buy_count: row.buy_count,
            edge_value: row.edge_value,
            avg_buy_price: row.avg_buy_price,
            title: row.title,
            is_officer: row.is_officer,
            is_director: row.is_director,
            is_ten_percent_owner: row.is_ten_percent_owner,
            first_filing_date: row.first_filing_date,
            last_filing_date: row.last_filing_date,
            insiderName: row.canonical_name,
            ticker: row.ticker,
          });
        }
      }

      const allNodes: D3Node[] = [...insiderMap.values(), ...companyMap.values()];
      const allLinks: D3Link[] = [...linkMap.values()];

      setNodes(allNodes);
      setLinks(allLinks);
      setNodeCount(allNodes.length);
      setEdgeCount(allLinks.length);
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

  return { nodes, links, loading, error, nodeCount, edgeCount, refresh };
}
