import { NextRequest, NextResponse } from 'next/server';

/**
 * NEBULA MARKET PROXY
 * 
 * Güvenli sunucu tarafı proxy - Liquidity Nebula API
 * API Key'i client'tan gizler, CORS sorunlarını aşar
 * 
 * @endpoint GET /api/nexus/market
 * @query symbol - Trading pair (e.g., BTCUSDT)
 * @query interval - Candle interval (e.g., 1h, 4h, 1d)
 * @query limit - Number of candles (default: 100)
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const NEBULA_API_URL = process.env.NEBULA_API_URL;
const NEBULA_API_KEY = process.env.NEBULA_API_KEY;

// ═══════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    try {
        // ─────────────────────────────────────────────────────────
        // 1. Validate Environment Variables
        // ─────────────────────────────────────────────────────────
        if (!NEBULA_API_URL || !NEBULA_API_KEY) {
            console.error('[Nebula Proxy] Missing environment variables');
            return NextResponse.json(
                {
                    error: 'Server configuration error',
                    code: 'ENV_MISSING'
                },
                { status: 500 }
            );
        }

        // ─────────────────────────────────────────────────────────
        // 2. Parse Query Parameters
        // ─────────────────────────────────────────────────────────
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const interval = searchParams.get('interval') || '1h';
        const limit = searchParams.get('limit') || '100';

        if (!symbol) {
            return NextResponse.json(
                {
                    error: 'Missing required parameter: symbol',
                    code: 'MISSING_SYMBOL'
                },
                { status: 400 }
            );
        }

        // ─────────────────────────────────────────────────────────
        // 3. Build Upstream Request
        // ─────────────────────────────────────────────────────────
        const upstreamUrl = new URL(`${NEBULA_API_URL}/api/v1/market/klines`);
        upstreamUrl.searchParams.set('symbol', symbol);
        upstreamUrl.searchParams.set('interval', interval);
        upstreamUrl.searchParams.set('limit', limit);

        // ─────────────────────────────────────────────────────────
        // 4. Fetch from Upstream
        // ─────────────────────────────────────────────────────────
        const response = await fetch(upstreamUrl.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${NEBULA_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            // Next.js 15 cache control
            next: { revalidate: 60 }, // Cache for 60 seconds
        });

        // ─────────────────────────────────────────────────────────
        // 5. Handle Upstream Errors
        // ─────────────────────────────────────────────────────────
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Nebula Proxy] Upstream error: ${response.status}`, errorText);

            if (response.status === 401) {
                return NextResponse.json(
                    {
                        error: 'Upstream authentication failed',
                        code: 'UPSTREAM_AUTH_FAILED'
                    },
                    { status: 401 }
                );
            }

            return NextResponse.json(
                {
                    error: 'Upstream request failed',
                    code: 'UPSTREAM_ERROR',
                    status: response.status
                },
                { status: 502 }
            );
        }

        // ─────────────────────────────────────────────────────────
        // 6. Return Data to Client
        // ─────────────────────────────────────────────────────────
        const data = await response.json();

        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
            },
        });

    } catch (error) {
        // ─────────────────────────────────────────────────────────
        // Error Handling
        // ─────────────────────────────────────────────────────────
        console.error('[Nebula Proxy] Unexpected error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
