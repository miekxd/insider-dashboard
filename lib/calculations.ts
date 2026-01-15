/**
 * Calculation utilities for the Insider Dashboard
 *
 * These functions handle business logic calculations like P&L,
 * holding periods, and data parsing.
 */

import { LLMCall, ParsedLLMCall } from '@/types/insider';

/**
 * Safely parses a JSON value with a fallback default
 *
 * @typeParam T - The expected type of the parsed value
 * @param value - The value to parse (string, object, or null)
 * @param defaultValue - Fallback if parsing fails
 * @returns Parsed value or default
 *
 * @example
 * parseJSON<string[]>('["a", "b"]', []) // Returns ["a", "b"]
 * parseJSON<string[]>(null, [])          // Returns []
 * parseJSON<string[]>('invalid', [])     // Returns []
 */
export function parseJSON<T>(value: unknown, defaultValue: T): T {
  try {
    if (typeof value === 'string') {
      return JSON.parse(value) as T;
    }
    return (value as T) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Calculates the P&L percentage for a position
 *
 * Computes from entry and current prices.
 *
 * @param call - The LLM call data
 * @returns P&L percentage or null if cannot be calculated
 */
export function calculatePnL(call: ParsedLLMCall): number | null {
  if (!call.current_price || !call.entry_price) {
    return null;
  }

  return ((call.current_price - call.entry_price) / call.entry_price) * 100;
}

/**
 * Calculates the number of days a position has been held
 *
 * Computes from entry date to today.
 *
 * @param call - The LLM call data
 * @returns Number of holding days or null
 */
export function getHoldingDays(call: ParsedLLMCall): number | null {
  if (!call.entry_date) {
    return null;
  }

  const entryDate = new Date(call.entry_date);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - entryDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Parses raw LLM call data into a typed structure
 *
 * Converts JSON string fields to proper arrays.
 *
 * @param call - Raw LLM call from database
 * @returns Parsed call with typed arrays
 */
export function parseLLMCall(call: LLMCall): ParsedLLMCall {
  return {
    ...call,
    transaction_dates: parseJSON<string[]>(call.transaction_dates, []),
    insider_names: parseJSON<string[]>(call.insider_names, []),
    market_patterns: parseJSON<string[]>(call.market_patterns, []),
    insider_prices_json: parseJSON<(number | null)[]>(call.insider_prices_json, []),
  };
}

/**
 * Calculates aggregate statistics for a list of calls
 *
 * @param calls - Array of parsed LLM calls
 * @returns Statistics object
 */
export function calculateStats(calls: ParsedLLMCall[]): {
  totalCalls: number;
  avgPnL: number;
  totalValue: number;
  strongBuyCount: number;
  winRate: number;
  winCount: number;
  callsWithPnL: number;
} {
  const callsWithPnL = calls.filter((c) => calculatePnL(c) !== null);
  const winningCalls = callsWithPnL.filter((c) => (calculatePnL(c) ?? 0) > 0);

  const avgPnL = callsWithPnL.length > 0
    ? callsWithPnL.reduce((sum, call) => sum + (calculatePnL(call) ?? 0), 0) / callsWithPnL.length
    : 0;

  const totalValue = calls.reduce(
    (sum, call) => sum + (call.total_transaction_value ?? 0),
    0
  );

  const strongBuyCount = calls.filter(
    (c) => c.recommendation === 'STRONG BUY'
  ).length;

  const winRate = callsWithPnL.length > 0
    ? (winningCalls.length / callsWithPnL.length) * 100
    : 0;

  return {
    totalCalls: calls.length,
    avgPnL,
    totalValue,
    strongBuyCount,
    winRate,
    winCount: winningCalls.length,
    callsWithPnL: callsWithPnL.length,
  };
}
