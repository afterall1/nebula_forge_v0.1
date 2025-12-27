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
    winRate: number;
    totalReturn: number;
    tradeCount: number;
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
