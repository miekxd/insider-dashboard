import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

// Raw row returned by the Supabase graph query
export interface GraphRow {
  insider_id: number;
  canonical_name: string;
  entity_type: 'OFFICER' | 'DIRECTOR' | 'OWNER_10PCT' | 'FUND' | 'UNKNOWN';
  total_buy_value: number;
  total_buy_transactions: number;
  buy_sell_ratio: number | null;
  unique_tickers_bought: number;
  active_since: string | null;
  last_transaction_date: string | null;
  insider_tier: string | null;

  company_id: number;
  ticker: string;
  company_name: string;
  sector: string | null;
  industry?: string | null;
  exchange?: string | null;
  market_cap?: number | null;
  description?: string | null;
  company_total_buy_value: number;
  company_total_buy_transactions?: number;
  unique_insiders_bought: number;
  last_insider_buy_date?: string | null;
  company_avg_return_pct?: number | null;

  buy_count: number;
  edge_value: number;
  avg_buy_price: number | null;
  title: string | null;
  is_officer: boolean;
  is_director: boolean;
  is_ten_percent_owner: boolean;
  first_filing_date: string | null;
  last_filing_date: string | null;
}

// ─── Shared tooltip interfaces ────────────────────────────────────────────────
// Both Sigma node attributes and D3 node types satisfy these structurally,
// so GraphTooltip / InsiderDetailPanel can work with either renderer.

export interface InsiderAttrs {
  canonical_name: string;
  entity_type: GraphRow['entity_type'];
  insider_tier: string | null;
  total_buy_value: number;
  total_buy_transactions: number;
  buy_sell_ratio: number | null;
  unique_tickers_bought: number;
  active_since: string | null;
  last_transaction_date: string | null;
}

export interface CompanyAttrs {
  ticker: string;
  company_name: string;
  sector: string | null;
  industry?: string | null;
  exchange?: string | null;
  market_cap?: number | null;
  unique_insiders_bought: number;
  company_total_buy_value: number;
  total_buy_transactions?: number;
  last_insider_buy_date?: string | null;
  avg_return_pct?: number | null;
  description?: string | null;
}

export interface EdgeAttrs {
  buy_count: number;
  edge_value: number;
  avg_buy_price: number | null;
  title: string | null;
  is_officer: boolean;
  is_director: boolean;
  is_ten_percent_owner: boolean;
  first_filing_date: string | null;
  last_filing_date: string | null;
  insiderName: string;
  ticker: string;
}

// ─── Sigma / graphology node attributes ───────────────────────────────────────

export interface InsiderNodeAttributes extends InsiderAttrs {
  nodeType: 'insider';
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  borderColor: string;
  type: 'bordered';
}

export interface CompanyNodeAttributes extends CompanyAttrs {
  nodeType: 'company';
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  borderColor: string;
  type: 'diamond';
}

export type NodeAttributes = InsiderNodeAttributes | CompanyNodeAttributes;

export interface EdgeAttributes extends EdgeAttrs {
  size: number;
  color: string;
}

// ─── D3-force node types ───────────────────────────────────────────────────────

export interface D3InsiderNode extends SimulationNodeDatum, InsiderAttrs {
  id: string;
  nodeType: 'insider';
  label: string;
  size: number;
  fill: string;
  stroke: string;
}

export interface D3CompanyNode extends SimulationNodeDatum, CompanyAttrs {
  id: string;
  nodeType: 'company';
  label: string;
  size: number;
  fill: string;
  stroke: string;
}

export type D3Node = D3InsiderNode | D3CompanyNode;

export interface D3Link extends SimulationLinkDatum<D3Node>, EdgeAttrs {
  id: string;
  strokeWidth: number;
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export type MinValueFilter = 50000 | 250000 | 500000 | 1000000 | 5000000;
export type RoleFilter = 'all' | 'OFFICER' | 'DIRECTOR' | 'OWNER_10PCT' | 'UNKNOWN';
export type TimeFilter = '30d' | '60d' | '90d' | 'all';

export interface GraphFilters {
  minValue: MinValueFilter;
  role: RoleFilter;
  time: TimeFilter;
  search: string;
}
