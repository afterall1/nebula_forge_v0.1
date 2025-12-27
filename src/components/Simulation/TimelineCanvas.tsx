'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js';
import type { UnifiedMarketData } from '@/lib/types/nexus';
import type { TradeSignal } from '@/lib/types/backtest';

/**
 * TIMELINE CANVAS
 * 
 * PixiJS ile mum grafiği ve sinyal görselleştirmesi
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
    text: 0x94a3b8,
};

export default function TimelineCanvas({
    marketData,
    signals,
    width = 800,
    height = 400,
}: TimelineCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);

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
        const signalContainer = new Container();
        app.stage.addChild(chartContainer);
        app.stage.addChild(signalContainer);

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

        // Create signal lookup
        const signalMap = new Map<number, TradeSignal>();
        for (const signal of signals) {
            signalMap.set(signal.timestamp, signal);
        }

        // Draw candles
        const candleGraphics = new Graphics();

        for (let i = 0; i < marketData.length; i++) {
            const candle = marketData[i];
            const x = padding.left + i * candleSpacing + candleSpacing / 2;

            // Price to Y coordinate
            const priceToY = (price: number) =>
                padding.top + ((maxPrice - price) / priceRange) * chartHeight;

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

            // Draw signal if exists
            const signal = signalMap.get(candle.timestamp);
            if (signal) {
                const signalGraphics = new Graphics();
                const signalY = signal.type === 'BUY' ? lowY + 15 : highY - 15;
                const signalColor = signal.type === 'BUY' ? COLORS.buySignal : COLORS.sellSignal;

                // Draw arrow
                if (signal.type === 'BUY') {
                    // Up arrow
                    signalGraphics.moveTo(x, signalY - 10);
                    signalGraphics.lineTo(x - 6, signalY);
                    signalGraphics.lineTo(x + 6, signalY);
                    signalGraphics.closePath();
                    signalGraphics.fill({ color: signalColor });
                } else {
                    // Down arrow
                    signalGraphics.moveTo(x, signalY + 10);
                    signalGraphics.lineTo(x - 6, signalY);
                    signalGraphics.lineTo(x + 6, signalY);
                    signalGraphics.closePath();
                    signalGraphics.fill({ color: signalColor });
                }

                signalContainer.addChild(signalGraphics);
            }
        }

        chartContainer.addChild(candleGraphics);
    }, [marketData, signals, width, height]);

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
