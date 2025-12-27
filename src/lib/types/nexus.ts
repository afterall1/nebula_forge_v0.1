/**
 * NEXUS TYPES
 * Liquidity Nebula API veri tipleri
 * 
 * @version 2.0 - Spot/Futures Separation Architecture
 */

// ═══════════════════════════════════════════════════════════════
// CORE MARKET DATA
// ═══════════════════════════════════════════════════════════════

/**
 * Unified Market Data
 * 
 * Ana veri yapısı - Futures verileri birincil, Spot verileri referans
 */
export interface UnifiedMarketData {
    timestamp: number;

    // ───────────────────────────────────────────────────────────────
    // FUTURES DATA (Primary / Ana Grafik)
    // ───────────────────────────────────────────────────────────────
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;

    // Time boundaries (optional, for raw candle data)
    openTime?: number;
    closeTime?: number;
    quoteVolume?: number;

    // ───────────────────────────────────────────────────────────────
    // SPOT DATA (Reference / Referans)
    // ───────────────────────────────────────────────────────────────
    spotPrice?: {
        open: number;
        close: number;
        volume: number;
    };

    // ───────────────────────────────────────────────────────────────
    // INTELLIGENCE METRICS (Cortex Layer)
    // ───────────────────────────────────────────────────────────────
    metrics?: {
        /** Açık Pozisyon ($) */
        openInterest?: number;

        /** Fonlama Oranı (örn: 0.0001 = 0.01%) */
        fundingRate?: number;

        /** Spot Net Giriş (Exchange Inflow - Outflow) */
        netInflow?: number;

        /** Cumulative Volume Delta - Agresif Alıcı/Satıcı farkı */
        cvd?: number;

        /** Long Liquidation Volume ($) */
        liquidationLong?: number;

        /** Short Liquidation Volume ($) */
        liquidationShort?: number;

        /** Long/Short Ratio */
        longShortRatio?: {
            accounts: number;
            positions: number;
        };
    };

    // ───────────────────────────────────────────────────────────────
    // CALCULATED FIELDS (Derived / Türetilmiş)
    // ───────────────────────────────────────────────────────────────

    /** Futures - Spot fiyat farkı */
    spread?: number;

    /** Fiyat-metrik sapma skoru */
    divergence?: number;
}

// ═══════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Helper: Get open interest from UnifiedMarketData
 * Supports both old flat structure and new nested structure
 */
export function getOpenInterest(data: UnifiedMarketData): number | undefined {
    return data.metrics?.openInterest;
}

/**
 * Helper: Get funding rate from UnifiedMarketData
 */
export function getFundingRate(data: UnifiedMarketData): number | undefined {
    return data.metrics?.fundingRate;
}

/**
 * Helper: Get CVD from UnifiedMarketData
 */
export function getCVD(data: UnifiedMarketData): number | undefined {
    return data.metrics?.cvd;
}

/**
 * Helper: Get net inflow from UnifiedMarketData
 */
export function getNetInflow(data: UnifiedMarketData): number | undefined {
    return data.metrics?.netInflow;
}

// ═══════════════════════════════════════════════════════════════
// CANDLE DATA (Raw Exchange Format)
// ═══════════════════════════════════════════════════════════════

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
    priceChange?: number;
    priceChangePercent?: number;
    high24h?: number;
    low24h?: number;
    volume24h?: number;
    quoteVolume24h?: number;
    openInterest?: number;
    fundingRate?: number;
    lastUpdate?: number;
}

// ═══════════════════════════════════════════════════════════════
// TOKEN METADATA
// ═══════════════════════════════════════════════════════════════

export interface TokenMetadata {
    id?: string;
    symbol: string;
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    marketCap?: number;
    circulatingSupply?: number;
    totalSupply?: number;
    maxSupply?: number;
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
    | 'takerBuySell'
    | 'cvd'
    | 'netInflow'
    | 'liquidations';

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
