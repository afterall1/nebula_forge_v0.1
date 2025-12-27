/**
 * NODE REGISTRY
 * 
 * React Flow düğümlerini çalıştırılabilir mantığa eşler
 */

import type { NodeExecutionContext, TradeSignal, SignalType } from '@/lib/types/backtest';

// ═══════════════════════════════════════════════════════════════
// NODE EVALUATOR TYPES
// ═══════════════════════════════════════════════════════════════

export type NodeEvaluatorResult = {
    value: unknown;
    signal?: TradeSignal;
    passed: boolean;
};

// ═══════════════════════════════════════════════════════════════
// UTILITY: Generate unique ID
// ═══════════════════════════════════════════════════════════════

let signalCounter = 0;
function generateSignalId(): string {
    return `signal-${Date.now()}-${++signalCounter}`;
}

// ═══════════════════════════════════════════════════════════════
// OPERATOR EVALUATORS
// ═══════════════════════════════════════════════════════════════

function evaluateOperator(
    operator: string,
    leftValue: number,
    rightValue: number
): boolean {
    switch (operator) {
        case '>':
            return leftValue > rightValue;
        case '<':
            return leftValue < rightValue;
        case '==':
            return leftValue === rightValue;
        case '>=':
            return leftValue >= rightValue;
        case '<=':
            return leftValue <= rightValue;
        default:
            return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// INDICATOR CALCULATORS
// ═══════════════════════════════════════════════════════════════

function calculateSimpleRSI(candles: { close: number }[], period: number = 14): number {
    if (candles.length < period + 1) return 50;

    const changes = candles.slice(-period - 1).map((c, i, arr) =>
        i === 0 ? 0 : c.close - arr[i - 1].close
    ).slice(1);

    const gains = changes.filter(c => c > 0);
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c));

    const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / period : 0;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateSMA(candles: { close: number }[], period: number): number {
    if (candles.length < period) return candles[candles.length - 1]?.close || 0;

    const slice = candles.slice(-period);
    return slice.reduce((sum, c) => sum + c.close, 0) / period;
}

// ═══════════════════════════════════════════════════════════════
// MAIN EVALUATOR
// ═══════════════════════════════════════════════════════════════

/**
 * Evaluate a node based on its type and data
 * 
 * @param nodeType - The type of node (sourceNode, processNode, resultNode)
 * @param data - The node's data configuration
 * @param inputs - Input values from connected nodes
 * @param context - Current execution context with candle data
 */
export function evaluateNode(
    nodeType: string,
    data: Record<string, unknown>,
    inputs: unknown[],
    context: NodeExecutionContext
): NodeEvaluatorResult {
    try {
        switch (nodeType) {
            // ─────────────────────────────────────────────────────────
            // SOURCE NODE - Returns current price data
            // ─────────────────────────────────────────────────────────
            case 'sourceNode':
            case 'dataSource': {
                const price = context.currentCandle.close;
                return {
                    value: price,
                    passed: true,
                };
            }

            // ─────────────────────────────────────────────────────────
            // PROCESS NODE - Evaluates conditions
            // ─────────────────────────────────────────────────────────
            case 'processNode':
            case 'logic': {
                const logic = data.logic as string || 'price_gt_50000';
                const inputValue = inputs[0] as number || context.currentCandle.close;
                const allCandles = [...context.prevCandles, context.currentCandle];

                let passed = false;
                let outputValue: unknown = inputValue;
                let signalType: SignalType = 'BUY';

                // Evaluate based on logic type
                switch (logic) {
                    case 'rsi_gt_70': {
                        const rsi = calculateSimpleRSI(allCandles);
                        passed = rsi > 70;
                        outputValue = rsi;
                        signalType = 'SELL';
                        break;
                    }
                    case 'rsi_lt_30': {
                        const rsi = calculateSimpleRSI(allCandles);
                        passed = rsi < 30;
                        outputValue = rsi;
                        signalType = 'BUY';
                        break;
                    }
                    case 'price_gt_ma200': {
                        const ma200 = calculateSMA(allCandles, 200);
                        passed = context.currentCandle.close > ma200;
                        outputValue = { price: context.currentCandle.close, ma200 };
                        signalType = 'BUY';
                        break;
                    }
                    case 'price_lt_ma200': {
                        const ma200 = calculateSMA(allCandles, 200);
                        passed = context.currentCandle.close < ma200;
                        outputValue = { price: context.currentCandle.close, ma200 };
                        signalType = 'SELL';
                        break;
                    }
                    case 'volume_spike': {
                        const avgVolume = context.prevCandles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
                        passed = context.currentCandle.volume > avgVolume * 2;
                        outputValue = { current: context.currentCandle.volume, avg: avgVolume };
                        break;
                    }
                    case 'oi_increase': {
                        const prevOI = context.prevCandles[context.prevCandles.length - 1]?.openInterest || 0;
                        const currOI = context.currentCandle.openInterest || 0;
                        passed = currOI > prevOI * 1.05;
                        outputValue = { prev: prevOI, current: currOI };
                        signalType = 'BUY';
                        break;
                    }
                    case 'funding_positive': {
                        passed = (context.currentCandle.fundingRate || 0) > 0;
                        outputValue = context.currentCandle.fundingRate;
                        signalType = 'SELL';
                        break;
                    }
                    case 'divergence': {
                        const recentCandles = context.prevCandles.slice(-5);
                        const priceIncreasing = context.currentCandle.close > (recentCandles[0]?.close || 0);
                        const oiDecreasing = (context.currentCandle.openInterest || 0) < (recentCandles[0]?.openInterest || 0);
                        passed = priceIncreasing && oiDecreasing;
                        outputValue = { priceIncreasing, oiDecreasing };
                        signalType = 'SELL';
                        break;
                    }

                    // ═══════════════════════════════════════════════════════════════
                    // CORTEX LOGIC NODES (Academic Research Based)
                    // Ref: Van Tharp Market Regimes, LuxAlgo, Lopez de Prado
                    // ═══════════════════════════════════════════════════════════════

                    /**
                     * FUNDING SQUEEZE LOGIC
                     * Detects: Spot Driven Rally / Short Squeeze Warning
                     * Condition: Price UP (>1%) AND Funding Rate NEGATIVE
                     */
                    case 'FundingAnomaly': {
                        const prevClose = context.prevCandles[context.prevCandles.length - 1]?.close || context.currentCandle.close;
                        const priceChange = ((context.currentCandle.close - prevClose) / prevClose) * 100;
                        const fundingRate = context.currentCandle.fundingRate || 0;

                        // Price rising >1% while funding is negative = Short squeeze potential
                        passed = priceChange > 1 && fundingRate < 0;
                        outputValue = {
                            priceChange: priceChange.toFixed(2) + '%',
                            fundingRate: fundingRate.toFixed(4),
                            signal: passed ? 'Spot Driven Rally / Short Squeeze Warning' : 'Normal',
                        };
                        signalType = 'BUY'; // Squeeze = Bullish momentum
                        break;
                    }

                    /**
                     * ABSORPTION LOGIC
                     * Detects: Accumulation/Distribution (Smart Money Loading)
                     * Condition: Price FLAT (<0.2%) AND OI UP (>2%) AND High Volume/CVD
                     */
                    case 'Absorption': {
                        const prevClose = context.prevCandles[context.prevCandles.length - 1]?.close || context.currentCandle.close;
                        const priceChange = Math.abs(((context.currentCandle.close - prevClose) / prevClose) * 100);

                        const prevOI = context.prevCandles[context.prevCandles.length - 1]?.openInterest || 0;
                        const currOI = context.currentCandle.openInterest || 0;
                        const oiChange = prevOI > 0 ? ((currOI - prevOI) / prevOI) * 100 : 0;

                        // Use CVD if available, otherwise fall back to volume spike detection
                        const cvd = context.currentCandle.cvd || 0;
                        const avgVolume = context.prevCandles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
                        const volumeHigh = context.currentCandle.volume > avgVolume * 1.5 || Math.abs(cvd) > 0;

                        // Flat price + OI increase + High activity = Position loading
                        passed = priceChange < 0.2 && oiChange > 2 && volumeHigh;
                        outputValue = {
                            priceChange: priceChange.toFixed(3) + '%',
                            oiChange: oiChange.toFixed(2) + '%',
                            volumeRatio: (context.currentCandle.volume / avgVolume).toFixed(2),
                            cvd: cvd,
                            signal: passed ? 'Positions being loaded (Accumulation/Distribution)' : 'Normal',
                        };
                        signalType = 'BUY'; // Accumulation is typically bullish
                        break;
                    }

                    /**
                     * SMART MONEY FLOW LOGIC
                     * Detects: Bullish Divergence (Whales buying the dip)
                     * Condition: Price DOWN but Net Inflow POSITIVE
                     */
                    case 'InflowDivergence': {
                        const prevClose = context.prevCandles[context.prevCandles.length - 1]?.close || context.currentCandle.close;
                        const priceChange = ((context.currentCandle.close - prevClose) / prevClose) * 100;
                        const netInflow = context.currentCandle.netInflow || 0;

                        // Price falling but money flowing in = Smart money accumulating
                        passed = priceChange < -0.5 && netInflow > 0;
                        outputValue = {
                            priceChange: priceChange.toFixed(2) + '%',
                            netInflow: netInflow,
                            signal: passed ? 'Bullish Divergence - Smart Money Accumulating' : 'Normal',
                        };
                        signalType = 'BUY'; // Divergence = potential reversal
                        break;
                    }

                    default: {
                        // Custom comparison: "price > 50000" style
                        const operator = data.operator as string || '>';
                        const threshold = data.value as number || 50000;
                        passed = evaluateOperator(operator, inputValue, threshold);
                        outputValue = inputValue;
                        signalType = operator === '>' ? 'BUY' : 'SELL';
                    }
                }

                return {
                    value: outputValue,
                    passed,
                    signal: passed ? {
                        id: generateSignalId(),
                        timestamp: context.currentCandle.timestamp,
                        type: signalType,
                        price: context.currentCandle.close,
                        reason: logic,
                    } : undefined,
                };
            }

            // ─────────────────────────────────────────────────────────
            // FILTER NODE - Van Tharp Regime Detection
            // ─────────────────────────────────────────────────────────
            case 'filterNode':
            case 'filter': {
                const filterType = data.logic as string || 'RegimeCheck';
                const allCandles = [...context.prevCandles, context.currentCandle];

                let passed = false;
                let outputValue: unknown = null;

                switch (filterType) {
                    /**
                     * VOLATILITY REGIME CHECK
                     * Van Tharp's Market Regimes Theory
                     * Uses ATR (Average True Range) to determine volatility state
                     */
                    case 'RegimeCheck': {
                        // Calculate ATR-like metric (simplified: average of high-low)
                        const atrPeriod = 14;
                        const recentCandles = allCandles.slice(-atrPeriod);

                        const trueRanges = recentCandles.map(c => c.high - c.low);
                        const atr = trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;

                        // Normalize ATR as percentage of current price
                        const atrPercent = (atr / context.currentCandle.close) * 100;

                        // Threshold: >2% = High Volatility, <1% = Low Volatility
                        const regime = atrPercent > 2 ? 'HIGH_VOLATILITY' :
                            atrPercent < 1 ? 'LOW_VOLATILITY' : 'NORMAL';

                        // Pass filter if in high volatility (more opportunities)
                        passed = regime === 'HIGH_VOLATILITY';

                        outputValue = {
                            atr: atr.toFixed(2),
                            atrPercent: atrPercent.toFixed(2) + '%',
                            regime: regime,
                            recommendation: regime === 'HIGH_VOLATILITY'
                                ? 'Wide stops, momentum strategies'
                                : regime === 'LOW_VOLATILITY'
                                    ? 'Tight stops, mean reversion'
                                    : 'Standard parameters',
                        };
                        break;
                    }

                    default: {
                        passed = true;
                        outputValue = { filter: filterType, status: 'unrecognized' };
                    }
                }

                return {
                    value: outputValue,
                    passed,
                };
            }

            // ─────────────────────────────────────────────────────────
            // RESULT NODE - Generates final signal
            // ─────────────────────────────────────────────────────────
            case 'resultNode':
            case 'output': {
                const inputPassed = inputs.length > 0 ? Boolean(inputs[0]) : false;
                const signalType = (data.signalType as SignalType) || 'BUY';

                if (inputPassed) {
                    return {
                        value: true,
                        passed: true,
                        signal: {
                            id: generateSignalId(),
                            timestamp: context.currentCandle.timestamp,
                            type: signalType,
                            price: context.currentCandle.close,
                            reason: 'Result triggered',
                        },
                    };
                }

                return {
                    value: false,
                    passed: false,
                };
            }

            default:
                console.warn(`[NodeRegistry] Unknown node type: ${nodeType}`);
                return { value: null, passed: false };
        }
    } catch (error) {
        console.error(`[NodeRegistry] Error evaluating ${nodeType}:`, error);
        return { value: null, passed: false };
    }
}

/**
 * Get available logic types for ProcessNode
 */
export function getAvailableLogicTypes(): string[] {
    return [
        // Classic indicators
        'rsi_gt_70',
        'rsi_lt_30',
        'price_gt_ma200',
        'price_lt_ma200',
        'volume_spike',

        // Futures metrics
        'oi_increase',
        'funding_positive',
        'divergence',

        // CORTEX: Advanced Academic-Based Logic
        'FundingAnomaly',    // Short Squeeze Detection
        'Absorption',        // Accumulation/Distribution
        'InflowDivergence',  // Smart Money Flow
    ];
}

/**
 * Get available filter types for FilterNode
 */
export function getAvailableFilterTypes(): string[] {
    return [
        'RegimeCheck',  // Van Tharp Volatility Regime
    ];
}
