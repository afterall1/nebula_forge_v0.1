'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js';
import type { UnifiedMarketData } from '@/lib/types/nexus';
import type { TradeSignal } from '@/lib/types/backtest';

/**
 * TIMELINE CANVAS
 * 
 * PixiJS ile mum grafiği ve sinyal görselleştirmesi
 * Enhanced trade visualization with BUY/SELL/EXIT markers
 */

interface TimelineCanvasProps {
    marketData: UnifiedMarketData[];
    signals: TradeSignal[];
    width?: number;
    height?: number;
}

// Colors
const COLORS = {
    background: 0x0f172a,
    gridLine: 0x1e3a5f,
    bullish: 0x22c55e,
    bearish: 0xef4444,
    buySignal: 0x22c55e,
    sellSignal: 0xef4444,
    exitSignal: 0xfbbf24,  // Amber/Yellow for exit
    text: 0x94a3b8,
};

// Signal type extension (for EXIT support)
type ExtendedSignalType = 'BUY' | 'SELL' | 'EXIT';

export default function TimelineCanvas({
    marketData,
    signals,
    width = 800,
    height = 400,
}: TimelineCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);

    /**
     * Draw trade markers on the chart
     * - BUY: Green up triangle below candle
     * - SELL: Red down triangle above candle
     * - EXIT: Yellow X marker at price level
     */
    const drawTrades = useCallback((
        container: Container,
        signalMap: Map<number, TradeSignal>,
        marketData: UnifiedMarketData[],
        priceToY: (price: number) => number,
        padding: { left: number },
        candleSpacing: number
    ) => {
        // Clear existing trade markers
        container.removeChildren();

        for (let i = 0; i < marketData.length; i++) {
            const candle = marketData[i];
            const signal = signalMap.get(candle.timestamp);

            if (!signal) continue;

            const x = padding.left + i * candleSpacing + candleSpacing / 2;
            const signalType = signal.type as ExtendedSignalType;

            // Create marker graphics
            const marker = new Graphics();

            // Calculate positions
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);
            const priceY = priceToY(signal.price);

            switch (signalType) {
                case 'BUY':
                    drawBuyMarker(marker, x, lowY + 12, COLORS.buySignal);
                    break;

                case 'SELL':
                    drawSellMarker(marker, x, highY - 12, COLORS.sellSignal);
                    break;

                case 'EXIT':
                    drawExitMarker(marker, x, priceY, COLORS.exitSignal);
                    break;
            }

            container.addChild(marker);
        }
    }, []);

    /**
     * Draw BUY marker - Green up triangle
     */
    const drawBuyMarker = (graphics: Graphics, x: number, y: number, color: number) => {
        const size = 8;

        // Glow effect
        graphics.circle(x, y - size / 2, size * 1.2);
        graphics.fill({ color, alpha: 0.2 });

        // Triangle pointing up
        graphics.moveTo(x, y - size);
        graphics.lineTo(x - size * 0.7, y);
        graphics.lineTo(x + size * 0.7, y);
        graphics.closePath();
        graphics.fill({ color });

        // Border
        graphics.setStrokeStyle({ width: 1, color: 0xffffff, alpha: 0.5 });
        graphics.moveTo(x, y - size);
        graphics.lineTo(x - size * 0.7, y);
        graphics.lineTo(x + size * 0.7, y);
        graphics.closePath();
        graphics.stroke();
    };

    /**
     * Draw SELL marker - Red down triangle
     */
    const drawSellMarker = (graphics: Graphics, x: number, y: number, color: number) => {
        const size = 8;

        // Glow effect
        graphics.circle(x, y + size / 2, size * 1.2);
        graphics.fill({ color, alpha: 0.2 });

        // Triangle pointing down
        graphics.moveTo(x, y + size);
        graphics.lineTo(x - size * 0.7, y);
        graphics.lineTo(x + size * 0.7, y);
        graphics.closePath();
        graphics.fill({ color });

        // Border
        graphics.setStrokeStyle({ width: 1, color: 0xffffff, alpha: 0.5 });
        graphics.moveTo(x, y + size);
        graphics.lineTo(x - size * 0.7, y);
        graphics.lineTo(x + size * 0.7, y);
        graphics.closePath();
        graphics.stroke();
    };

    /**
     * Draw EXIT marker - Yellow X
     */
    const drawExitMarker = (graphics: Graphics, x: number, y: number, color: number) => {
        const size = 6;

        // Glow effect
        graphics.circle(x, y, size * 1.5);
        graphics.fill({ color, alpha: 0.2 });

        // X shape
        graphics.setStrokeStyle({ width: 2, color });
        graphics.moveTo(x - size, y - size);
        graphics.lineTo(x + size, y + size);
        graphics.stroke();

        graphics.moveTo(x + size, y - size);
        graphics.lineTo(x - size, y + size);
        graphics.stroke();

        // Center dot
        graphics.circle(x, y, 2);
        graphics.fill({ color });
    };

    const renderChart = useCallback(async () => {
        if (!containerRef.current || marketData.length === 0) return;

        // Clean up existing app
        if (appRef.current) {
            appRef.current.destroy(true);
            appRef.current = null;
        }

        // Create new Pixi Application
        const app = new Application();
        await app.init({
            width,
            height,
            backgroundColor: COLORS.background,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
        appRef.current = app;

        // Create containers
        const chartContainer = new Container();
        const tradesContainer = new Container();
        app.stage.addChild(chartContainer);
        app.stage.addChild(tradesContainer);

        // Calculate price range
        const prices = marketData.flatMap(d => [d.high, d.low]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;

        // Chart dimensions
        const padding = { top: 20, right: 60, bottom: 30, left: 10 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Candle dimensions
        const candleCount = marketData.length;
        const candleWidth = Math.max(2, Math.min(12, chartWidth / candleCount - 1));
        const candleSpacing = chartWidth / candleCount;

        // Price to Y coordinate function
        const priceToY = (price: number) =>
            padding.top + ((maxPrice - price) / priceRange) * chartHeight;

        // Draw grid lines
        const gridGraphics = new Graphics();
        gridGraphics.setStrokeStyle({ width: 1, color: COLORS.gridLine, alpha: 0.3 });

        // Horizontal grid lines (price levels)
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            gridGraphics.moveTo(padding.left, y);
            gridGraphics.lineTo(width - padding.right, y);
            gridGraphics.stroke();

            // Price label
            const price = maxPrice - (priceRange / 5) * i;
            const priceText = new Text({
                text: price.toFixed(2),
                style: new TextStyle({
                    fontSize: 10,
                    fill: COLORS.text,
                    fontFamily: 'monospace',
                }),
            });
            priceText.x = width - padding.right + 5;
            priceText.y = y - 5;
            chartContainer.addChild(priceText);
        }
        chartContainer.addChild(gridGraphics);

        // Create signal lookup map
        const signalMap = new Map<number, TradeSignal>();
        for (const signal of signals) {
            signalMap.set(signal.timestamp, signal);
        }

        // Draw candles
        const candleGraphics = new Graphics();

        for (let i = 0; i < marketData.length; i++) {
            const candle = marketData[i];
            const x = padding.left + i * candleSpacing + candleSpacing / 2;

            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);

            const isBullish = candle.close >= candle.open;
            const color = isBullish ? COLORS.bullish : COLORS.bearish;

            // Draw wick
            candleGraphics.setStrokeStyle({ width: 1, color });
            candleGraphics.moveTo(x, highY);
            candleGraphics.lineTo(x, lowY);
            candleGraphics.stroke();

            // Draw body
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY) || 1;

            candleGraphics.rect(
                x - candleWidth / 2,
                bodyTop,
                candleWidth,
                bodyHeight
            );
            candleGraphics.fill({ color });
        }

        chartContainer.addChild(candleGraphics);

        // Draw trade signals using dedicated function
        drawTrades(tradesContainer, signalMap, marketData, priceToY, padding, candleSpacing);

    }, [marketData, signals, width, height, drawTrades]);

    useEffect(() => {
        renderChart();

        return () => {
            if (appRef.current) {
                appRef.current.destroy(true);
                appRef.current = null;
            }
        };
    }, [renderChart]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full rounded-lg overflow-hidden"
            style={{ minHeight: height }}
        />
    );
}

