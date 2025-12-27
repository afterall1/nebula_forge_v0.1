/**
 * MOCK DATA GENERATOR - Project Mirage
 * 
 * Multi-Dimensional Sentetik Veri Üretici
 * Cortex mantık düğümlerini test etmek için gelişmiş senaryo jeneratörü
 * 
 * @version 2.0 - Cortex Integration
 */

import type { UnifiedMarketData } from '@/lib/types/nexus';

// ═══════════════════════════════════════════════════════════════
// TYPES & CONFIG
// ═══════════════════════════════════════════════════════════════

export type MarketScenario = 'NORMAL' | 'SHORT_SQUEEZE' | 'SPOT_PUMP' | 'ACCUMULATION' | 'DISTRIBUTION';

interface GeneratorConfig {
    basePrice: number;
    baseFunding: number;
    baseOI: number;
    baseVolume: number;
    startTime?: number;
    intervalMs?: number; // Time between candles in ms
}

const DEFAULT_CONFIG: GeneratorConfig = {
    basePrice: 50000,
    baseFunding: 0.0001, // 0.01% base funding rate
    baseOI: 1000000000,  // 1B base open interest
    baseVolume: 10000,
    intervalMs: 60 * 60 * 1000, // 1 hour
};

// ═══════════════════════════════════════════════════════════════
// NOISE GENERATORS (Gaussian-like Randomness)
// ═══════════════════════════════════════════════════════════════

/**
 * Box-Muller transform for Gaussian noise
 */
function gaussianNoise(mean: number = 0, stdDev: number = 1): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * stdDev + mean;
}

/**
 * Add noise to a value with bounds
 */
function addNoise(value: number, noisePercent: number = 0.02): number {
    const noise = gaussianNoise(0, value * noisePercent);
    return value + noise;
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// ═══════════════════════════════════════════════════════════════
// CORE DATA POINT GENERATOR
// ═══════════════════════════════════════════════════════════════

interface DataPointParams {
    timestamp: number;
    spotPrice: number;
    futuresPrice: number;
    spotVolume: number;
    futuresVolume: number;
    openInterest: number;
    fundingRate: number;
    netInflow: number;
    cvd: number;
}

/**
 * Create a single UnifiedMarketData point with full CORTEX metrics
 */
function createDataPoint(params: DataPointParams): UnifiedMarketData {
    const {
        timestamp,
        spotPrice,
        futuresPrice,
        spotVolume,
        futuresVolume,
        openInterest,
        fundingRate,
        netInflow,
        cvd,
    } = params;

    // Use futures price as primary OHLC
    const volatility = futuresPrice * 0.005; // 0.5% volatility for OHLC
    const open = addNoise(futuresPrice, 0.002);
    const close = addNoise(futuresPrice, 0.002);
    const high = Math.max(open, close) + Math.abs(gaussianNoise(0, volatility));
    const low = Math.min(open, close) - Math.abs(gaussianNoise(0, volatility));

    // Total volume is sum of spot + futures
    const totalVolume = spotVolume + futuresVolume;

    return {
        timestamp,
        openTime: timestamp,
        closeTime: timestamp + DEFAULT_CONFIG.intervalMs! - 1,
        open,
        high,
        low,
        close,
        volume: totalVolume,
        quoteVolume: totalVolume * close,

        // CORTEX Metrics
        openInterest,
        fundingRate,
        longShortRatio: {
            accounts: addNoise(1.0, 0.1),
            positions: addNoise(1.0, 0.1),
        },
        netInflow,
        cvd,

        // Calculated fields
        spread: futuresPrice - spotPrice,
    };
}

// ═══════════════════════════════════════════════════════════════
// SCENARIO GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate market data for a specific scenario
 * 
 * @param type - Scenario type
 * @param length - Number of candles
 * @param config - Optional configuration overrides
 */
export function generateMarketScenario(
    type: MarketScenario,
    length: number,
    config: Partial<GeneratorConfig> = {}
): UnifiedMarketData[] {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const startTime = cfg.startTime ?? Date.now() - length * cfg.intervalMs!;

    switch (type) {
        case 'SHORT_SQUEEZE':
            return generateShortSqueezeScenario(length, cfg, startTime);
        case 'SPOT_PUMP':
            return generateSpotPumpScenario(length, cfg, startTime);
        case 'ACCUMULATION':
            return generateAccumulationScenario(length, cfg, startTime);
        case 'DISTRIBUTION':
            return generateDistributionScenario(length, cfg, startTime);
        case 'NORMAL':
        default:
            return generateNormalScenario(length, cfg, startTime);
    }
}

// ─────────────────────────────────────────────────────────────────
// SCENARIO A: SHORT SQUEEZE
// ─────────────────────────────────────────────────────────────────

/**
 * SHORT_SQUEEZE Scenario:
 * - Price: Parabolic rise (exponential)
 * - Open Interest: Rapid decline (liquidations)
 * - Funding Rate: Extremely negative (shorts are paying)
 * - Volume: Explosion
 */
function generateShortSqueezeScenario(
    length: number,
    config: GeneratorConfig,
    startTime: number
): UnifiedMarketData[] {
    const data: UnifiedMarketData[] = [];

    let spotPrice = config.basePrice;
    let futuresPrice = config.basePrice * 1.001; // Slight premium
    let openInterest = config.baseOI;
    let fundingRate = -0.0005; // Start negative (-0.05%)
    let cvd = 0;

    for (let i = 0; i < length; i++) {
        const progress = i / length; // 0 to 1
        const timestamp = startTime + i * config.intervalMs!;

        // Parabolic price increase (accelerating)
        const priceMultiplier = 1 + (progress * progress * 0.5); // Up to 50% gain
        spotPrice = addNoise(config.basePrice * priceMultiplier, 0.01);
        futuresPrice = addNoise(spotPrice * (1 + progress * 0.02), 0.01); // Growing premium

        // OI drops as shorts get liquidated
        openInterest = addNoise(config.baseOI * (1 - progress * 0.6), 0.02);
        openInterest = Math.max(openInterest, config.baseOI * 0.3); // Floor at 30%

        // Funding goes more negative (shorts desperate)
        fundingRate = addNoise(-0.0005 - progress * 0.003, 0.1); // Up to -0.35%
        fundingRate = clamp(fundingRate, -0.01, 0); // Cap at -1%

        // Volume explosion
        const volumeMultiplier = 1 + progress * 5; // Up to 6x volume
        const spotVolume = addNoise(config.baseVolume * volumeMultiplier * 0.3, 0.1);
        const futuresVolume = addNoise(config.baseVolume * volumeMultiplier * 0.7, 0.1);

        // CVD strongly positive (aggressive buying)
        cvd += addNoise(config.baseVolume * 0.3, 0.2);

        // Net inflow moderate positive
        const netInflow = addNoise(config.baseVolume * 0.1 * progress, 0.3);

        data.push(createDataPoint({
            timestamp,
            spotPrice,
            futuresPrice,
            spotVolume,
            futuresVolume,
            openInterest,
            fundingRate,
            netInflow,
            cvd,
        }));
    }

    return data;
}

// ─────────────────────────────────────────────────────────────────
// SCENARIO B: SPOT PUMP (Whale Accumulation)
// ─────────────────────────────────────────────────────────────────

/**
 * SPOT_PUMP Scenario:
 * - Price: Rising
 * - Spot Volume: Extremely high
 * - Futures Volume: Low
 * - Net Inflow: Strongly positive (whale entry)
 */
function generateSpotPumpScenario(
    length: number,
    config: GeneratorConfig,
    startTime: number
): UnifiedMarketData[] {
    const data: UnifiedMarketData[] = [];

    let spotPrice = config.basePrice;
    let futuresPrice = config.basePrice;
    let openInterest = config.baseOI;
    let cvd = 0;

    for (let i = 0; i < length; i++) {
        const progress = i / length;
        const timestamp = startTime + i * config.intervalMs!;

        // Steady price increase
        const priceMultiplier = 1 + progress * 0.2; // Up to 20% gain
        spotPrice = addNoise(config.basePrice * priceMultiplier, 0.01);
        futuresPrice = addNoise(spotPrice * 0.998, 0.005); // Slight discount (spot leading)

        // OI stays relatively flat (spot-driven)
        openInterest = addNoise(config.baseOI * (1 + progress * 0.1), 0.02);

        // Funding stays near neutral/slightly positive
        const fundingRate = addNoise(0.0001 + progress * 0.0001, 0.2);

        // Spot volume dominates
        const spotVolume = addNoise(config.baseVolume * 3, 0.15); // 3x normal
        const futuresVolume = addNoise(config.baseVolume * 0.5, 0.1); // Low futures

        // CVD moderately positive
        cvd += addNoise(config.baseVolume * 0.1, 0.3);

        // Strong net inflow (whales buying on spot)
        const netInflow = addNoise(config.baseVolume * 0.5, 0.2);

        data.push(createDataPoint({
            timestamp,
            spotPrice,
            futuresPrice,
            spotVolume,
            futuresVolume,
            openInterest,
            fundingRate,
            netInflow,
            cvd,
        }));
    }

    return data;
}

// ─────────────────────────────────────────────────────────────────
// SCENARIO C: ACCUMULATION (Quiet Loading)
// ─────────────────────────────────────────────────────────────────

/**
 * ACCUMULATION Scenario:
 * - Price: Flat/sideways
 * - Open Interest: Increasing
 * - Volume: High
 * - Net Inflow: Positive
 */
function generateAccumulationScenario(
    length: number,
    config: GeneratorConfig,
    startTime: number
): UnifiedMarketData[] {
    const data: UnifiedMarketData[] = [];

    let openInterest = config.baseOI;
    let cvd = 0;

    for (let i = 0; i < length; i++) {
        const progress = i / length;
        const timestamp = startTime + i * config.intervalMs!;

        // Price stays flat with minor oscillations
        const oscillation = Math.sin(i * 0.5) * config.basePrice * 0.001;
        const spotPrice = addNoise(config.basePrice + oscillation, 0.001);
        const futuresPrice = addNoise(spotPrice * 1.0005, 0.001);

        // OI steadily increases (positions being built)
        openInterest = addNoise(config.baseOI * (1 + progress * 0.3), 0.01);

        // Funding neutral
        const fundingRate = addNoise(0.0001, 0.3);

        // High volume
        const spotVolume = addNoise(config.baseVolume * 1.5, 0.1);
        const futuresVolume = addNoise(config.baseVolume * 2, 0.1);

        // CVD neutral (balanced buying/selling)
        cvd += addNoise(0, config.baseVolume * 0.05);

        // Positive net inflow
        const netInflow = addNoise(config.baseVolume * 0.2, 0.3);

        data.push(createDataPoint({
            timestamp,
            spotPrice,
            futuresPrice,
            spotVolume,
            futuresVolume,
            openInterest,
            fundingRate,
            netInflow,
            cvd,
        }));
    }

    return data;
}

// ─────────────────────────────────────────────────────────────────
// SCENARIO D: DISTRIBUTION
// ─────────────────────────────────────────────────────────────────

/**
 * DISTRIBUTION Scenario:
 * - Price: Flat/slightly declining
 * - Open Interest: Decreasing
 * - Net Inflow: Negative (whales exiting)
 */
function generateDistributionScenario(
    length: number,
    config: GeneratorConfig,
    startTime: number
): UnifiedMarketData[] {
    const data: UnifiedMarketData[] = [];

    let openInterest = config.baseOI;
    let cvd = 0;

    for (let i = 0; i < length; i++) {
        const progress = i / length;
        const timestamp = startTime + i * config.intervalMs!;

        // Price slowly declining
        const priceMultiplier = 1 - progress * 0.05; // Down 5%
        const spotPrice = addNoise(config.basePrice * priceMultiplier, 0.01);
        const futuresPrice = addNoise(spotPrice * 0.999, 0.005);

        // OI decreasing
        openInterest = addNoise(config.baseOI * (1 - progress * 0.2), 0.02);

        // Funding slightly negative
        const fundingRate = addNoise(-0.0001 - progress * 0.0001, 0.3);

        // Normal volume
        const spotVolume = addNoise(config.baseVolume, 0.1);
        const futuresVolume = addNoise(config.baseVolume, 0.1);

        // CVD negative (selling pressure)
        cvd -= addNoise(config.baseVolume * 0.1, 0.3);

        // Negative net inflow (outflows)
        const netInflow = addNoise(-config.baseVolume * 0.3, 0.2);

        data.push(createDataPoint({
            timestamp,
            spotPrice,
            futuresPrice,
            spotVolume,
            futuresVolume,
            openInterest,
            fundingRate,
            netInflow,
            cvd,
        }));
    }

    return data;
}

// ─────────────────────────────────────────────────────────────────
// SCENARIO E: NORMAL (Baseline)
// ─────────────────────────────────────────────────────────────────

/**
 * NORMAL Scenario:
 * - All metrics oscillate around baseline with random noise
 */
function generateNormalScenario(
    length: number,
    config: GeneratorConfig,
    startTime: number
): UnifiedMarketData[] {
    const data: UnifiedMarketData[] = [];

    let cvd = 0;

    for (let i = 0; i < length; i++) {
        const timestamp = startTime + i * config.intervalMs!;

        // Random walk price
        const priceNoise = gaussianNoise(0, config.basePrice * 0.01);
        const spotPrice = addNoise(config.basePrice + priceNoise, 0.005);
        const futuresPrice = addNoise(spotPrice * 1.0001, 0.003);

        // OI random walk
        const openInterest = addNoise(config.baseOI, 0.03);

        // Funding oscillates
        const fundingRate = addNoise(config.baseFunding, 0.5);

        // Normal volumes
        const spotVolume = addNoise(config.baseVolume, 0.2);
        const futuresVolume = addNoise(config.baseVolume, 0.2);

        // CVD random walk
        cvd += gaussianNoise(0, config.baseVolume * 0.05);

        // Net inflow around zero
        const netInflow = gaussianNoise(0, config.baseVolume * 0.1);

        data.push(createDataPoint({
            timestamp,
            spotPrice,
            futuresPrice,
            spotVolume,
            futuresVolume,
            openInterest,
            fundingRate,
            netInflow,
            cvd,
        }));
    }

    return data;
}

// ═══════════════════════════════════════════════════════════════
// LEGACY GENERATORS (Backward Compatibility)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate deterministic sine wave price data (Legacy)
 */
export function generateSineWaveData(
    length: number,
    period: number,
    basePrice: number,
    amplitude?: number,
    startTime?: number
): UnifiedMarketData[] {
    const amp = amplitude ?? basePrice * 0.05;
    const start = startTime ?? Date.now() - length * 60 * 60 * 1000;
    const data: UnifiedMarketData[] = [];

    for (let i = 0; i < length; i++) {
        const timestamp = start + i * 60 * 60 * 1000;
        const phase = (2 * Math.PI * i) / period;
        const centerPrice = basePrice + amp * Math.sin(phase);
        const volatility = amp * 0.1;

        const open = centerPrice + volatility * Math.sin(phase * 2);
        const close = centerPrice + volatility * Math.cos(phase * 3);
        const high = Math.max(open, close) + volatility * 0.5;
        const low = Math.min(open, close) - volatility * 0.5;
        const normalizedPhase = (Math.sin(phase) + 1) / 2;
        const volume = 1000 + 500 * (1 - normalizedPhase);

        data.push({
            timestamp,
            openTime: timestamp,
            closeTime: timestamp + 60 * 60 * 1000 - 1,
            open,
            high,
            low,
            close,
            volume,
            quoteVolume: volume * close,
            // CORTEX defaults
            openInterest: addNoise(1000000000, 0.02),
            fundingRate: addNoise(0.0001, 0.3),
            longShortRatio: { accounts: 1, positions: 1 },
            netInflow: 0,
            cvd: 0,
        });
    }

    return data;
}

/**
 * Generate trend data (Legacy)
 */
export function generateTrendData(
    length: number,
    startPrice: number,
    endPrice: number,
    volatility: number = 0.02
): UnifiedMarketData[] {
    const start = Date.now() - length * 60 * 60 * 1000;
    const priceStep = (endPrice - startPrice) / length;
    const data: UnifiedMarketData[] = [];

    for (let i = 0; i < length; i++) {
        const timestamp = start + i * 60 * 60 * 1000;
        const centerPrice = startPrice + priceStep * i;
        const noise = centerPrice * volatility * (Math.random() - 0.5);

        const open = centerPrice + noise;
        const close = centerPrice + priceStep + noise * 0.5;
        const high = Math.max(open, close) * (1 + volatility * 0.2);
        const low = Math.min(open, close) * (1 - volatility * 0.2);

        data.push({
            timestamp,
            openTime: timestamp,
            closeTime: timestamp + 60 * 60 * 1000 - 1,
            open,
            high,
            low,
            close,
            volume: 1000 + Math.random() * 500,
            quoteVolume: 0,
            // CORTEX defaults
            openInterest: addNoise(1000000000, 0.02),
            fundingRate: addNoise(0.0001, 0.3),
            longShortRatio: { accounts: 1, positions: 1 },
            netInflow: 0,
            cvd: 0,
        });
    }

    return data;
}

/**
 * Generate range-bound data (Legacy)
 */
export function generateRangeData(
    length: number,
    centerPrice: number,
    rangePercent: number = 0.05
): UnifiedMarketData[] {
    const range = centerPrice * rangePercent;
    const start = Date.now() - length * 60 * 60 * 1000;
    const data: UnifiedMarketData[] = [];

    for (let i = 0; i < length; i++) {
        const timestamp = start + i * 60 * 60 * 1000;
        const randomOffset = (Math.random() - 0.5) * range * 2;

        const open = centerPrice + randomOffset;
        const close = centerPrice + (Math.random() - 0.5) * range * 2;
        const high = Math.max(open, close) + Math.random() * range * 0.3;
        const low = Math.min(open, close) - Math.random() * range * 0.3;

        data.push({
            timestamp,
            openTime: timestamp,
            closeTime: timestamp + 60 * 60 * 1000 - 1,
            open,
            high,
            low,
            close,
            volume: 500 + Math.random() * 300,
            quoteVolume: 0,
            // CORTEX defaults
            openInterest: addNoise(1000000000, 0.02),
            fundingRate: addNoise(0.0001, 0.3),
            longShortRatio: { accounts: 1, positions: 1 },
            netInflow: 0,
            cvd: 0,
        });
    }

    return data;
}

/**
 * Generate RSI overbought data (Legacy)
 */
export function generateRSIOverboughtData(length: number, basePrice: number): UnifiedMarketData[] {
    const data: UnifiedMarketData[] = [];
    const start = Date.now() - length * 60 * 60 * 1000;
    let currentPrice = basePrice;

    for (let i = 0; i < length; i++) {
        const timestamp = start + i * 60 * 60 * 1000;
        const gain = currentPrice * 0.01;
        const open = currentPrice;
        const close = currentPrice + gain;
        const high = close * 1.002;
        const low = open * 0.998;

        data.push({
            timestamp,
            openTime: timestamp,
            closeTime: timestamp + 60 * 60 * 1000 - 1,
            open,
            high,
            low,
            close,
            volume: 1000,
            quoteVolume: 1000 * close,
            openInterest: 1000000000,
            fundingRate: 0.0001,
            longShortRatio: { accounts: 1, positions: 1 },
            netInflow: 0,
            cvd: 0,
        });

        currentPrice = close;
    }

    return data;
}

/**
 * Generate RSI oversold data (Legacy)
 */
export function generateRSIOversoldData(length: number, basePrice: number): UnifiedMarketData[] {
    const data: UnifiedMarketData[] = [];
    const start = Date.now() - length * 60 * 60 * 1000;
    let currentPrice = basePrice;

    for (let i = 0; i < length; i++) {
        const timestamp = start + i * 60 * 60 * 1000;
        const loss = currentPrice * 0.01;
        const open = currentPrice;
        const close = currentPrice - loss;
        const high = open * 1.002;
        const low = close * 0.998;

        data.push({
            timestamp,
            openTime: timestamp,
            closeTime: timestamp + 60 * 60 * 1000 - 1,
            open,
            high,
            low,
            close,
            volume: 1000,
            quoteVolume: 1000 * close,
            openInterest: 1000000000,
            fundingRate: 0.0001,
            longShortRatio: { accounts: 1, positions: 1 },
            netInflow: 0,
            cvd: 0,
        });

        currentPrice = close;
    }

    return data;
}
