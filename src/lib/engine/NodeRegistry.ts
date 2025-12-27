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
        'rsi_gt_70',
        'rsi_lt_30',
        'price_gt_ma200',
        'price_lt_ma200',
        'volume_spike',
        'oi_increase',
        'funding_positive',
        'divergence',
    ];
}
