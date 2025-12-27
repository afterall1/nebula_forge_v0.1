/**
 * BACKTEST ENGINE
 * 
 * Görsel strateji grafiğini alır, simüle eder, sonuç üretir
 */

import type { Edge } from '@xyflow/react';
import type { UnifiedMarketData } from '@/lib/types/nexus';
import type {
    BacktestResult,
    BacktestConfig,
    TradeSignal,
    EquityPoint,
    NodeExecutionContext,
    BacktestMetrics,
} from '@/lib/types/backtest';
import { DEFAULT_BACKTEST_CONFIG } from '@/lib/types/backtest';
import { evaluateNode } from './NodeRegistry';

// ═══════════════════════════════════════════════════════════════
// GRAPH UTILITIES
// ═══════════════════════════════════════════════════════════════

interface ParsedNode {
    id: string;
    type: string;
    data: Record<string, unknown>;
}

/**
 * Topologically sort nodes from Source to Result
 */
function topologicalSort(
    nodes: Array<{ id: string; type?: string; data?: unknown }>,
    edges: Edge[]
): ParsedNode[] {
    const nodeMap = new Map<string, ParsedNode>();
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Initialize
    for (const node of nodes) {
        const nodeData = node.data as Record<string, unknown>;
        nodeMap.set(node.id, {
            id: node.id,
            type: (nodeData?.type as string) || node.type || 'default',
            data: nodeData || {},
        });
        inDegree.set(node.id, 0);
        adjacencyList.set(node.id, []);
    }

    // Build graph
    for (const edge of edges) {
        const targets = adjacencyList.get(edge.source) || [];
        targets.push(edge.target);
        adjacencyList.set(edge.source, targets);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    // Kahn's algorithm
    const queue: string[] = [];
    const sorted: ParsedNode[] = [];

    for (const [nodeId, degree] of Array.from(inDegree.entries())) {
        if (degree === 0) queue.push(nodeId);
    }

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const node = nodeMap.get(currentId);
        if (node) sorted.push(node);

        for (const neighbor of adjacencyList.get(currentId) || []) {
            const newDegree = (inDegree.get(neighbor) || 0) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) queue.push(neighbor);
        }
    }

    return sorted;
}

/**
 * Get input node IDs for a given node
 */
function getInputNodeIds(nodeId: string, edges: Edge[]): string[] {
    return edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

// ═══════════════════════════════════════════════════════════════
// METRICS CALCULATION
// ═══════════════════════════════════════════════════════════════

function calculateMetrics(
    signals: TradeSignal[],
    equityCurve: EquityPoint[],
    initialCapital: number
): BacktestMetrics {
    const tradeCount = signals.length;

    if (tradeCount < 2) {
        return {
            winRate: 0,
            totalReturn: 0,
            tradeCount,
        };
    }

    // Calculate win rate from trade pairs
    let wins = 0;
    let totalPairs = 0;

    for (let i = 0; i < signals.length - 1; i += 2) {
        const entry = signals[i];
        const exit = signals[i + 1];
        if (!exit) break;

        const pnl =
            entry.type === 'BUY' ? exit.price - entry.price : entry.price - exit.price;

        if (pnl > 0) wins++;
        totalPairs++;
    }

    const finalEquity = equityCurve[equityCurve.length - 1]?.equity || initialCapital;
    const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;

    return {
        winRate: totalPairs > 0 ? (wins / totalPairs) * 100 : 0,
        totalReturn,
        tradeCount,
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Run backtest simulation on the visual strategy
 *
 * @param nodes - React Flow nodes array
 * @param edges - React Flow edges array
 * @param marketData - Historical market data
 * @param config - Backtest configuration (optional)
 */
export function runSimulation(
    nodes: Array<{ id: string; type?: string; data?: Record<string, unknown>; position?: unknown }>,
    edges: Edge[],
    marketData: UnifiedMarketData[],
    config: BacktestConfig = DEFAULT_BACKTEST_CONFIG
): BacktestResult {
    try {
        // Sort data by time
        const sortedData = [...marketData].sort((a, b) => a.timestamp - b.timestamp);

        if (sortedData.length === 0) {
            return {
                signals: [],
                equityCurve: [{ time: Date.now(), equity: config.initialCapital }],
                metrics: { winRate: 0, totalReturn: 0, tradeCount: 0 },
            };
        }

        // Topologically sort nodes
        const sortedNodes = topologicalSort(nodes, edges);

        if (sortedNodes.length === 0) {
            console.warn('[BacktestEngine] No nodes to process');
            return {
                signals: [],
                equityCurve: [{ time: Date.now(), equity: config.initialCapital }],
                metrics: { winRate: 0, totalReturn: 0, tradeCount: 0 },
            };
        }

        // Simulation state
        const signals: TradeSignal[] = [];
        const equityCurve: EquityPoint[] = [];
        let equity = config.initialCapital;
        let position: 'LONG' | 'SHORT' | null = null;
        let entryPrice = 0;

        // Process each candle
        for (let i = 0; i < sortedData.length; i++) {
            const currentCandle = sortedData[i];
            const prevCandles = sortedData.slice(Math.max(0, i - 200), i);

            // Create execution context
            const context: NodeExecutionContext = {
                currentCandle,
                prevCandles,
                indicators: {},
            };

            // Store node outputs
            const nodeOutputs = new Map<string, unknown>();

            // Execute nodes in topological order
            for (const node of sortedNodes) {
                // Get inputs from connected nodes
                const inputNodeIds = getInputNodeIds(node.id, edges);
                const inputs = inputNodeIds.map((id) => nodeOutputs.get(id));

                // Evaluate node
                const result = evaluateNode(node.type, node.data, inputs, context);

                // Store output
                nodeOutputs.set(node.id, result.passed ? result.value : false);

                // If result node triggered with signal
                if (
                    (node.type === 'resultNode' || node.type === 'output') &&
                    result.signal
                ) {
                    const signal = result.signal;

                    // Position management
                    if (signal.type === 'BUY' && position !== 'LONG') {
                        // Close short if exists
                        if (position === 'SHORT') {
                            const pnl =
                                ((entryPrice - currentCandle.close) / entryPrice) *
                                config.positionSize *
                                equity;
                            equity += pnl;
                        }

                        // Open long
                        position = 'LONG';
                        entryPrice = currentCandle.close;
                        signals.push(signal);
                    } else if (signal.type === 'SELL' && position !== 'SHORT') {
                        // Close long if exists
                        if (position === 'LONG') {
                            const pnl =
                                ((currentCandle.close - entryPrice) / entryPrice) *
                                config.positionSize *
                                equity;
                            equity += pnl;
                        }

                        // Open short
                        position = 'SHORT';
                        entryPrice = currentCandle.close;
                        signals.push(signal);
                    }
                }
            }

            // Update equity curve (mark-to-market)
            let currentEquity = equity;
            if (position === 'LONG') {
                const unrealizedPnL =
                    ((currentCandle.close - entryPrice) / entryPrice) *
                    config.positionSize *
                    equity;
                currentEquity = equity + unrealizedPnL;
            } else if (position === 'SHORT') {
                const unrealizedPnL =
                    ((entryPrice - currentCandle.close) / entryPrice) *
                    config.positionSize *
                    equity;
                currentEquity = equity + unrealizedPnL;
            }

            equityCurve.push({
                time: currentCandle.timestamp,
                equity: currentEquity,
            });
        }

        return {
            signals,
            equityCurve,
            metrics: calculateMetrics(signals, equityCurve, config.initialCapital),
        };
    } catch (error) {
        console.error('[BacktestEngine] Simulation error:', error);
        return {
            signals: [],
            equityCurve: [{ time: Date.now(), equity: config.initialCapital }],
            metrics: { winRate: 0, totalReturn: 0, tradeCount: 0 },
        };
    }
}
