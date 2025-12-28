/**
 * CORTEX STREAM GATEWAY
 * Server-Sent Events (SSE) proxy for real-time market data
 * 
 * @endpoint GET /api/nexus/stream?symbol=BTCUSDT
 * @returns SSE stream with TICKER updates
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic to prevent caching of the stream
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT';

    // SSE Encoder
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Bağlantı başlangıç mesajı
            const initData = JSON.stringify({
                type: 'STATUS',
                payload: 'CONNECTED',
                timestamp: Date.now()
            });
            controller.enqueue(encoder.encode(`data: ${initData}\n\n`));

            // Basit Polling Mekanizması (Binance Public API)
            // Gerçekte WebSocket kullanılır ama basitlik ve stabilite için burada interval fetch kullanıyoruz.
            const intervalId = setInterval(async () => {
                try {
                    // Binance API'den güncel fiyatı çek
                    const response = await fetch(
                        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`,
                        { cache: 'no-store' }
                    );

                    if (!response.ok) {
                        throw new Error(`Exchange Error: ${response.status}`);
                    }

                    const data = await response.json();

                    const tickerEvent = JSON.stringify({
                        type: 'TICKER',
                        payload: {
                            symbol: data.symbol,
                            price: parseFloat(data.price),
                            time: Date.now()
                        },
                        timestamp: Date.now()
                    });

                    // SSE formatında veri gönder
                    controller.enqueue(encoder.encode(`data: ${tickerEvent}\n\n`));
                } catch (error) {
                    console.error('[CortexStream] Fetch Error:', error);
                    const errorEvent = JSON.stringify({
                        type: 'ERROR',
                        payload: error instanceof Error ? error.message : 'Fetch Failed',
                        timestamp: Date.now()
                    });
                    controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
                }
            }, 2000); // 2 saniyede bir güncelle

            // Bağlantı koptuğunda temizle
            req.signal.addEventListener('abort', () => {
                clearInterval(intervalId);
                controller.close();
            });
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Nginx proxy buffering bypass
        },
    });
}
