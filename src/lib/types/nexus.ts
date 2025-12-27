/**
 * NEXUS TYPES
 * Liquidity Nebula API veri tipleri
 */

// ═══════════════════════════════════════════════════════════════
// MARKET DATA
// ═══════════════════════════════════════════════════════════════

export interface UnifiedMarketData {
    timestamp: number;
    openTime: number;
    closeTime: number;

    // Price data
    open: number;
    high: number;
    low: number;
    close: number;

    // Volume
    volume: number;
    quoteVolume: number;

    // Metrics (optional, from deep-scan)
    openInterest?: number;
    fundingRate?: number;
    longShortRatio?: number;

    // Calculated fields
    spread?: number;
    divergence?: number;
}

export interface CandleData {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
    quoteVolume: number;
    trades: number;
    takerBuyBaseVolume: number;
    takerBuyQuoteVolume: number;
}

// ═══════════════════════════════════════════════════════════════
// TICKER DATA
// ═══════════════════════════════════════════════════════════════

export interface TickerData {
    symbol: string;
    price: number;
    priceChange: number;
    priceChangePercent: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    quoteVolume24h: number;
    openInterest?: number;
    fundingRate?: number;
    lastUpdate: number;
}

// ═══════════════════════════════════════════════════════════════
// TOKEN METADATA
// ═══════════════════════════════════════════════════════════════

export interface TokenMetadata {
    symbol: string;
    name: string;
    description?: string;
    logo?: string;
    website?: string;

    // Market info
    marketCap?: number;
    circulatingSupply?: number;
    totalSupply?: number;
    maxSupply?: number;

    // Unlock data
    vestingSchedule?: VestingEvent[];
}

export interface VestingEvent {
    date: string;
    amount: number;
    percentage: number;
    type: string;
}

// ═══════════════════════════════════════════════════════════════
// METRICS
// ═══════════════════════════════════════════════════════════════

export type MetricType =
    | 'openInterest'
    | 'fundingRate'
    | 'longShortRatio'
    | 'takerBuySell';

export interface MetricDataPoint {
    timestamp: number;
    value: number;
    symbol?: string;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export interface NexusResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    timestamp: number;
}

export interface DeepScanResponse {
    symbol: string;
    interval: string;
    data: UnifiedMarketData[];
    meta: {
        dataPoints: number;
        startTime: number;
        endTime: number;
    };
}
