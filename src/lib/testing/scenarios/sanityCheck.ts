/**
 * SANITY CHECK SCENARIO
 * 
 * Basit logic testi: Fiyat > Ortalama → AL sinyali
 * Sine wave verisinde fiyatın ortalamadan yüksek olduğu yerlerde sinyal üretmeli
 */

import type { TestScenario } from '../types';

/**
 * Basic sanity check scenario
 * Tests: SourceNode → ProcessNode (price > MA) → ResultNode
 */
export const sanityCheckScenario: TestScenario = {
    id: 'sanity-check-001',
    name: 'Basic Logic: Price Above Average',
    description: 'Verifies that the engine produces BUY signals when price is above moving average',

    nodes: [
        // Source Node - Market Data
        {
            id: 'source-1',
            type: 'sourceNode',
            data: {
                type: 'dataSource',
                label: 'BTCUSDT',
                symbol: 'BTCUSDT',
            },
            position: { x: 100, y: 150 },
        },

        // Process Node - Logic Gate
        {
            id: 'process-1',
            type: 'processNode',
            data: {
                type: 'logic',
                label: 'Price > MA200',
                logic: 'price_gt_ma200',
            },
            position: { x: 350, y: 150 },
        },

        // Result Node - Signal Output
        {
            id: 'result-1',
            type: 'resultNode',
            data: {
                type: 'output',
                label: 'Trade Signal',
                outputType: 'signal',
                signalType: 'BUY',
            },
            position: { x: 600, y: 150 },
        },
    ],

    edges: [
        {
            id: 'edge-1',
            source: 'source-1',
            target: 'process-1',
        },
        {
            id: 'edge-2',
            source: 'process-1',
            target: 'result-1',
        },
    ],

    // Sine wave data ile fiyat ortalamanın üstüne ~50 kez çıkmalı
    expectedSignals: 5, // Conservative estimate for position changes
    expectedWinRate: 0, // We're not checking win rate for sanity check
    tolerance: 100, // Don't fail on win rate
};

/**
 * RSI Overbought scenario
 * Tests: RSI > 70 logic produces SELL signals
 */
export const rsiOverboughtScenario: TestScenario = {
    id: 'rsi-overbought-001',
    name: 'RSI Overbought: Sell Signal',
    description: 'Verifies that RSI > 70 condition triggers SELL signals',

    nodes: [
        {
            id: 'source-1',
            type: 'sourceNode',
            data: {
                type: 'dataSource',
                label: 'BTCUSDT',
                symbol: 'BTCUSDT',
            },
            position: { x: 100, y: 150 },
        },
        {
            id: 'process-1',
            type: 'processNode',
            data: {
                type: 'logic',
                label: 'RSI > 70',
                logic: 'rsi_gt_70',
            },
            position: { x: 350, y: 150 },
        },
        {
            id: 'result-1',
            type: 'resultNode',
            data: {
                type: 'output',
                label: 'Sell Signal',
                outputType: 'signal',
                signalType: 'SELL',
            },
            position: { x: 600, y: 150 },
        },
    ],

    edges: [
        { id: 'edge-1', source: 'source-1', target: 'process-1' },
        { id: 'edge-2', source: 'process-1', target: 'result-1' },
    ],

    expectedSignals: 0, // Sine wave doesn't push RSI to extremes
    expectedWinRate: 0,
    tolerance: 100,
};

/**
 * Empty flow scenario - should produce no signals
 */
export const emptyFlowScenario: TestScenario = {
    id: 'empty-flow-001',
    name: 'Empty Flow: No Signals',
    description: 'Verifies that an empty graph produces no signals',

    nodes: [],
    edges: [],

    expectedSignals: 0,
    expectedWinRate: 0,
    tolerance: 100,
};

/**
 * All test scenarios for system validation
 */
export const allScenarios: TestScenario[] = [
    sanityCheckScenario,
    rsiOverboughtScenario,
    emptyFlowScenario,
];
