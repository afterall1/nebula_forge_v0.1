/**
 * BACKTEST TYPES
 * 
 * Strateji simülasyonu için tip tanımlamaları
 */

import type { UnifiedMarketData } from '@/lib/types/nexus';

// ═══════════════════════════════════════════════════════════════
// TRADE SIGNALS
// ═══════════════════════════════════════════════════════════════

export type SignalType = 'BUY' | 'SELL';

export interface TradeSignal {
    id: string;
    timestamp: number;
    type: SignalType;
    price: number;
    reason: string;
}

// ═══════════════════════════════════════════════════════════════
// EQUITY CURVE
// ═══════════════════════════════════════════════════════════════

export interface EquityPoint {
    time: number;
    equity: number;
}

// ═══════════════════════════════════════════════════════════════
// BACKTEST RESULTS
// ═══════════════════════════════════════════════════════════════

export interface BacktestMetrics {
    // Basic metrics
    winRate: number;
    totalReturn: number;
    tradeCount: number;

    // ═══════════════════════════════════════════════════════════════
    // CORTEX: Professional Risk Metrics
    // Ref: Van Tharp SQN, TraderSync, Lopez de Prado
    // ═══════════════════════════════════════════════════════════════

    /** 
     * System Quality Number (Van Tharp)
     * Formula: (Avg Profit / StdDev of Profits) * sqrt(Trade Count)
     * Interpretation: <1.6 Poor, 1.6-2.0 Average, 2.0-2.5 Good, 2.5-3.0 Excellent, >3.0 Superb
     */
    sqn: number;

    /**
     * Sharpe Ratio (Simplified, Risk-Free Rate = 0)
     * Formula: Avg Daily Return / StdDev of Daily Returns
     * Interpretation: <1 Sub-optimal, 1-2 Good, 2-3 Very Good, >3 Excellent
     */
    sharpeRatio: number;

    /**
     * Maximum Drawdown (%)
     * Peak to trough decline in equity curve
     * Lower is better; >30% typically unacceptable
     */
    maxDrawdown: number;

    /**
     * Profit Factor
     * Formula: Gross Profits / Gross Losses
     * Interpretation: <1 Losing, 1-1.5 Marginal, 1.5-2.0 Good, >2.0 Excellent
     */
    profitFactor: number;
}

export interface BacktestResult {
    signals: TradeSignal[];
    equityCurve: EquityPoint[];
    metrics: BacktestMetrics;
}

// ═══════════════════════════════════════════════════════════════
// EXECUTION CONTEXT
// ═══════════════════════════════════════════════════════════════

export interface NodeExecutionContext {
    currentCandle: UnifiedMarketData;
    prevCandles: UnifiedMarketData[];
    indicators: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// NODE DATA TYPES
// ═══════════════════════════════════════════════════════════════

export interface SourceNodeData {
    symbol: string;
    interval?: string;
}

export interface ProcessNodeData {
    logic: string;
    operator?: '>' | '<' | '==' | '>=' | '<=';
    value?: number;
}

export interface ResultNodeData {
    outputType: 'signal' | 'alert';
    signalType?: SignalType;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export interface BacktestConfig {
    initialCapital: number;
    positionSize: number;
    slippage: number;
    commission: number;
}

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
    initialCapital: 10000,
    positionSize: 0.1,
    slippage: 0.001,
    commission: 0.001,
};
