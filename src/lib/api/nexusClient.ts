/**
 * NEXUS CLIENT
 * Liquidity Nebula API veri köprüsü
 */

import type {
    TickerData,
    CandleData,
    UnifiedMarketData,
    MetricDataPoint,
    DeepScanResponse,
    NexusResponse
} from '@/lib/types/nexus';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const BASE_URL = process.env.NEXT_PUBLIC_NEXUS_API_URL || 'http://localhost:3000';

class NexusUplinkError extends Error {
    constructor(message: string, public statusCode?: number) {
        super(`[NEXUS UPLINK OFFLINE] ${message}`);
        this.name = 'NexusUplinkError';
    }
}

// ═══════════════════════════════════════════════════════════════
// CORE FETCH WRAPPER
// ═══════════════════════════════════════════════════════════════

async function nexusFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new NexusUplinkError(
                `Request failed: ${response.status} ${response.statusText}`,
                response.status
            );
        }

        return response.json();
    } catch (error) {
        if (error instanceof NexusUplinkError) throw error;
        throw new NexusUplinkError(
            error instanceof Error ? error.message : 'Connection failed'
        );
    }
}

// ═══════════════════════════════════════════════════════════════
// PRIMARY DATA FETCH - Live Market Data via Proxy
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch market data from local proxy (live data)
 * 
 * Uses /api/nexus/market which proxies to Liquidity Nebula API
 * Data is returned in UnifiedMarketData[] format (Cortex compatible)
 * 
 * @param symbol - Trading pair (e.g., 'BTCUSDT')
 * @param interval - Candle interval (e.g., '1h', '15m')
 * @param limit - Number of candles to fetch (default: 100)
 * @returns UnifiedMarketData[] with nested metrics and spotPrice
 */
export async function fetchMarketData(
    symbol: string,
    interval: string = '1h',
    limit: number = 100
): Promise<UnifiedMarketData[]> {
    try {
        const params = new URLSearchParams({
            symbol,
            interval,
            limit: limit.toString(),
        });

        const response = await fetch(`/api/nexus/market?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Live data: no cache
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[NexusClient] Market data fetch failed:', response.status, errorData);

            throw new NexusUplinkError(
                errorData?.error || `Request failed: ${response.status}`,
                response.status
            );
        }

        const data = await response.json();

        // Map response to UnifiedMarketData[] if needed
        // The proxy should return data already in correct format
        // If not, we map it here for compatibility
        if (Array.isArray(data)) {
            return data.map(mapToUnifiedMarketData);
        }

        // Handle wrapped response { data: [...] }
        if (data?.data && Array.isArray(data.data)) {
            return data.data.map(mapToUnifiedMarketData);
        }

        console.warn('[NexusClient] Unexpected response format, returning empty array');
        return [];

    } catch (error) {
        console.error('[NexusClient] fetchMarketData error:', error);

        // Return empty array on error instead of throwing
        // This allows graceful degradation
        return [];
    }
}

/**
 * Map API response to UnifiedMarketData (Cortex-compatible)
 * Ensures metrics and spotPrice are nested correctly
 */
function mapToUnifiedMarketData(item: Record<string, unknown>): UnifiedMarketData {
    return {
        timestamp: (item.timestamp as number) || (item.openTime as number) || 0,
        openTime: item.openTime as number | undefined,
        closeTime: item.closeTime as number | undefined,
        open: (item.open as number) || 0,
        high: (item.high as number) || 0,
        low: (item.low as number) || 0,
        close: (item.close as number) || 0,
        volume: (item.volume as number) || 0,
        quoteVolume: item.quoteVolume as number | undefined,

        // Spot data (nested)
        spotPrice: item.spotPrice as UnifiedMarketData['spotPrice'],

        // Metrics (nested - Cortex structure)
        metrics: item.metrics as UnifiedMarketData['metrics'] ?? {
            openInterest: item.openInterest as number | undefined,
            fundingRate: item.fundingRate as number | undefined,
            netInflow: item.netInflow as number | undefined,
            cvd: item.cvd as number | undefined,
        },

        // Calculated fields
        spread: item.spread as number | undefined,
        divergence: item.divergence as number | undefined,
    };
}

// ═══════════════════════════════════════════════════════════════
// API METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch market snapshot (all tickers)
 */
export async function fetchMarketSnapshot(): Promise<TickerData[]> {
    return nexusFetch<TickerData[]>('/api/binance/metrics');
}

/**
 * Fetch klines (candlestick data)
 */
export async function fetchKlines(
    symbol: string,
    interval: string = '1h',
    limit: number = 500
): Promise<CandleData[]> {
    const params = new URLSearchParams({
        symbol,
        interval,
        limit: limit.toString(),
    });

    return nexusFetch<CandleData[]>(`/api/klines?${params}`);
}

/**
 * Fetch metrics (open interest, funding rate, etc.)
 */
export async function fetchMetrics(
    symbol: string,
    metric: string,
    interval: string = '1h',
    limit: number = 500
): Promise<MetricDataPoint[]> {
    const params = new URLSearchParams({
        symbol,
        metric,
        interval,
        limit: limit.toString(),
    });

    return nexusFetch<MetricDataPoint[]>(`/api/nexus/v1/metrics?${params}`);
}

/**
 * Deep Scan - Unified market data with metrics fusion
 * 
 * If deep-scan endpoint doesn't exist, falls back to
 * parallel fetching klines + metrics and merging them.
 */
export async function fetchDeepScan(
    symbol: string,
    interval: string = '1h',
    limit: number = 500
): Promise<DeepScanResponse> {
    const params = new URLSearchParams({
        symbol,
        interval,
        limit: limit.toString(),
    });

    try {
        // Try native deep-scan endpoint first
        return await nexusFetch<DeepScanResponse>(`/api/nexus/v1/deep-scan?${params}`);
    } catch (error) {
        // Fallback: Parallel fetch and merge
        console.warn('[Nexus] Deep-scan endpoint unavailable, using fallback merge strategy');
        return fallbackDeepScan(symbol, interval, limit);
    }
}

/**
 * Fallback strategy: Parallel fetch klines + metrics, then merge
 */
async function fallbackDeepScan(
    symbol: string,
    interval: string,
    limit: number
): Promise<DeepScanResponse> {
    const [klines, openInterest, fundingRate] = await Promise.all([
        fetchKlines(symbol, interval, limit),
        fetchMetrics(symbol, 'openInterest', interval, limit).catch(() => []),
        fetchMetrics(symbol, 'fundingRate', interval, limit).catch(() => []),
    ]);

    // Create lookup maps for metrics
    const oiMap = new Map(openInterest.map(m => [m.timestamp, m.value]));
    const frMap = new Map(fundingRate.map(m => [m.timestamp, m.value]));

    // Merge data
    const unifiedData: UnifiedMarketData[] = klines.map(candle => ({
        timestamp: candle.openTime,
        openTime: candle.openTime,
        closeTime: candle.closeTime,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        quoteVolume: candle.quoteVolume,
        openInterest: oiMap.get(candle.openTime),
        fundingRate: frMap.get(candle.openTime),
    }));

    return {
        symbol,
        interval,
        data: unifiedData,
        meta: {
            dataPoints: unifiedData.length,
            startTime: unifiedData[0]?.timestamp || 0,
            endTime: unifiedData[unifiedData.length - 1]?.timestamp || 0,
        },
    };
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

/**
 * Check if Nexus API is online
 */
export async function checkNexusHealth(): Promise<boolean> {
    try {
        await nexusFetch('/api/binance/metrics');
        return true;
    } catch {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { NexusUplinkError, BASE_URL };
