export interface LLMCall {
  id: number;
  call_date: string;
  batch_id: string | null;
  ticker: string;
  company_name: string | null;
  recommendation: string;
  rank: number | null;
  signal_strength: number | null;
  time_horizon: string | null;
  number_of_insiders: number | null;
  total_transaction_value: number | null;
  transaction_dates: string | null;  // JSON string
  insider_names: string | null;      // JSON string
  entry_price: number | null;
  entry_date: string;
  entry_timestamp: string;
  price_change_pct: number | null;
  holding_days: number | null;
  pnl_dollars: number | null;
  llm_rationale: string | null;
  market_patterns: string | null;    // JSON string
  created_at: string | null;
  updated_at: string | null;
  insider_avg_price: number | null;
  insider_prices_json: string | null; // JSON string
  current_price: number | null;
  last_price_update: string | null;
  traded: boolean | null;
}

export interface ParsedLLMCall extends Omit<LLMCall, 'transaction_dates' | 'insider_names' | 'market_patterns' | 'insider_prices_json'> {
  transaction_dates: string[];
  insider_names: string[];
  market_patterns: string[];
  insider_prices_json: (number | null)[];
}

