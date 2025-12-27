/**
 * MOCK DATA GENERATOR
 * 
 * Deterministik, tahmin edilebilir market verisi üretici
 * Backtest motorunu gerçek piyasa gürültüsünden izole eder
 */

import type { UnifiedMarketData } from '@/lib/types/nexus';

// ═══════════════════════════════════════════════════════════════
// SINE WAVE GENERATOR
// ═══════════════════════════════════════════════════════════════

/**
 * Generate deterministic sine wave price data
 * 
 * @param length - Number of candles to generate
 * @param period - Sine wave period (candles per full cycle)
 * @param basePrice - Center price for oscillation
 * @param amplitude - Price swing amplitude (default 5% of basePrice)
 * @param startTime - Starting timestamp (default: now - length hours)
 */
export function generateSineWaveData(
    length: number,
    period: number,
    basePrice: number,
    amplitude?: number,
    startTime?: number
): UnifiedMarketData[] {
    const amp = amplitude ?? basePrice * 0.05; // 5% default amplitude
    const start = startTime ?? Date.now() - length * 60 * 60 * 1000;
    const data: UnifiedMarketData[] = [];

    for (let i = 0; i < length; i++) {
        const timestamp = start + i * 60 * 60 * 1000; // 1 hour intervals
        const phase = (2 * Math.PI * i) / period;

        // Sine wave with slight noise for OHLC variance
        const centerPrice = basePrice + amp * Math.sin(phase);
        const volatility = amp * 0.1; // 10% of amplitude for OHLC spread

        const open = centerPrice + volatility * Math.sin(phase * 2);
        const close = centerPrice + volatility * Math.cos(phase * 3);
        const high = Math.max(open, close) + volatility * 0.5;
        const low = Math.min(open, close) - volatility * 0.5;

        // Volume follows inverse of price (higher volume at lows)
        const normalizedPhase = (Math.sin(phase) + 1) / 2; // 0 to 1
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
        });
    }

    return data;
}

// ═══════════════════════════════════════════════════════════════
// TREND GENERATOR
// ═══════════════════════════════════════════════════════════════

/**
 * Generate uptrend or downtrend data
 * 
 * @param length - Number of candles
 * @param startPrice - Starting price
 * @param endPrice - Ending price
 * @param volatility - Random noise factor (0-1)
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
        });
    }

    return data;
}

// ═══════════════════════════════════════════════════════════════
// RANGE-BOUND GENERATOR
// ═══════════════════════════════════════════════════════════════

/**
 * Generate sideways/range-bound data
 * 
 * @param length - Number of candles
 * @param centerPrice - Center of the range
 * @param rangePercent - Range width as percentage
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
        });
    }

    return data;
}

// ═══════════════════════════════════════════════════════════════
// PATTERN GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate RSI overbought scenario (for testing RSI > 70 logic)
 * Creates consistent upward movement to push RSI above 70
 */
export function generateRSIOverboughtData(length: number, basePrice: number): UnifiedMarketData[] {
    const data: UnifiedMarketData[] = [];
    const start = Date.now() - length * 60 * 60 * 1000;
    let currentPrice = basePrice;

    for (let i = 0; i < length; i++) {
        const timestamp = start + i * 60 * 60 * 1000;

        // Consistent gains to push RSI up
        const gain = currentPrice * 0.01; // 1% gain per candle
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
        });

        currentPrice = close;
    }

    return data;
}

/**
 * Generate RSI oversold scenario (for testing RSI < 30 logic)
 * Creates consistent downward movement to push RSI below 30
 */
export function generateRSIOversoldData(length: number, basePrice: number): UnifiedMarketData[] {
    const data: UnifiedMarketData[] = [];
    const start = Date.now() - length * 60 * 60 * 1000;
    let currentPrice = basePrice;

    for (let i = 0; i < length; i++) {
        const timestamp = start + i * 60 * 60 * 1000;

        // Consistent losses to push RSI down
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
        });

        currentPrice = close;
    }

    return data;
}
