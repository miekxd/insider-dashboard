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
  company_total_buy_value: number;
  unique_insiders_bought: number;

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

// Node attributes stored in graphology
export interface InsiderNodeAttributes {
  nodeType: 'insider';
  label: string;
  canonical_name: string;
  entity_type: GraphRow['entity_type'];
  total_buy_value: number;
  total_buy_transactions: number;
  buy_sell_ratio: number | null;
  unique_tickers_bought: number;
  active_since: string | null;
  last_transaction_date: string | null;
  insider_tier: string | null;
  // layout
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface CompanyNodeAttributes {
  nodeType: 'company';
  label: string;
  ticker: string;
  company_name: string;
  sector: string | null;
  unique_insiders_bought: number;
  company_total_buy_value: number;
  // layout
  x: number;
  y: number;
  size: number;
  color: string;
}

export type NodeAttributes = InsiderNodeAttributes | CompanyNodeAttributes;

export interface EdgeAttributes {
  buy_count: number;
  edge_value: number;
  avg_buy_price: number | null;
  title: string | null;
  is_officer: boolean;
  is_director: boolean;
  is_ten_percent_owner: boolean;
  first_filing_date: string | null;
  last_filing_date: string | null;
  size: number;
  color: string;
  // source/target names for tooltip
  insiderName: string;
  ticker: string;
}

export type MinValueFilter = 50000 | 250000 | 500000 | 1000000 | 5000000;
export type RoleFilter = 'all' | 'OFFICER' | 'DIRECTOR' | 'OWNER_10PCT' | 'UNKNOWN';
export type TimeFilter = '30d' | '60d' | '90d' | 'all';

export interface GraphFilters {
  minValue: MinValueFilter;
  role: RoleFilter;
  time: TimeFilter;
  search: string;
}
