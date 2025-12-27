'use client';

import { useState, useCallback } from 'react';
import { Play, Square, BarChart3, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useForgeStore } from '@/store';
import { runSimulation } from '@/lib/engine';
import { fetchDeepScan } from '@/lib/api/nexusClient';
import { generateSineWaveData } from '@/lib/testing';
import type { UnifiedMarketData } from '@/lib/types/nexus';
import type { BacktestResult, TradeSignal } from '@/lib/types/backtest';
import TimelineCanvas from './TimelineCanvas';

/**
 * SIMULATION PANEL
 * 
 * Backtest kontrolü ve sonuç görselleştirmesi
 * API bağlantısı yoksa Mock Data kullanır
 */

export default function SimulationPanel() {
    const { nodes, edges, isSimulating, setSimulating } = useForgeStore();

    const [marketData, setMarketData] = useState<UnifiedMarketData[]>([]);
    const [signals, setSignals] = useState<TradeSignal[]>([]);
    const [result, setResult] = useState<BacktestResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [usedMockData, setUsedMockData] = useState(false);

    const handleRunSimulation = useCallback(async () => {
        setSimulating(true);
        setError(null);
        setUsedMockData(false);

        try {
            // Find source node to get symbol
            const sourceNode = nodes.find(n => {
                const data = n.data as { type?: string; symbol?: string };
                return data?.type === 'dataSource' || data?.symbol;
            });

            const symbol = (sourceNode?.data as { symbol?: string })?.symbol || 'BTCUSDT';

            let data: UnifiedMarketData[];

            try {
                // Try to fetch real data from Liquidity Nebula API
                const response = await Promise.race([
                    fetchDeepScan(symbol, '1h', 200),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('API Timeout')), 5000)
                    )
                ]);
                data = response.data;
            } catch (apiError) {
                // Fallback to mock data if API is unavailable
                console.warn('[SimulationPanel] API unavailable, using mock data');
                data = generateSineWaveData(200, 20, 50000);
                setUsedMockData(true);
            }

            setMarketData(data);

            // Run backtest
            const backtestResult = runSimulation(nodes, edges, data);
            setResult(backtestResult);
            setSignals(backtestResult.signals);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Simulation failed');
            console.error('[SimulationPanel] Error:', err);
        } finally {
            setSimulating(false);
        }
    }, [nodes, edges, setSimulating]);

    const handleStop = useCallback(() => {
        setSimulating(false);
    }, [setSimulating]);

    return (
        <div className="h-full flex flex-col bg-slate-900 border-t border-slate-700">
            {/* Control Bar */}
            <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between border-b border-slate-800 bg-slate-900/80">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-sky-500" />
                    <span className="text-sm font-semibold text-slate-300">SIMULATION</span>
                    {usedMockData && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded">
                            <AlertCircle className="w-3 h-3" />
                            MOCK DATA
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!isSimulating ? (
                        <button
                            onClick={handleRunSimulation}
                            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 
                         text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            BAŞLAT
                        </button>
                    ) : (
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 
                         text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Square className="w-4 h-4" />
                            DURDUR
                        </button>
                    )}
                </div>
            </div>

            {/* Results Panel */}
            {result && (
                <div className="flex-shrink-0 px-4 py-2 flex items-center gap-6 border-b border-slate-800 bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Win Rate</span>
                        <span className={`text-sm font-bold ${result.metrics.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {result.metrics.winRate.toFixed(1)}%
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Return</span>
                        <span className={`flex items-center gap-1 text-sm font-bold ${result.metrics.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {result.metrics.totalReturn >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {result.metrics.totalReturn.toFixed(2)}%
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Trades</span>
                        <span className="text-sm font-bold text-slate-300">
                            {result.metrics.tradeCount}
                        </span>
                    </div>
                </div>
            )}

            {/* Chart Area */}
            <div className="flex-1 relative p-2 min-h-0">
                {error && (
                    <div className="absolute inset-2 flex items-center justify-center bg-red-900/20 border border-red-500/30 rounded-lg">
                        <div className="text-center">
                            <p className="text-red-400 text-sm">{error}</p>
                            <p className="text-slate-500 text-xs mt-1">Simülasyon hatası</p>
                        </div>
                    </div>
                )}

                {isSimulating && (
                    <div className="absolute inset-2 flex items-center justify-center bg-slate-900/80 rounded-lg z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-slate-400">Simulating...</span>
                        </div>
                    </div>
                )}

                {marketData.length > 0 ? (
                    <TimelineCanvas
                        marketData={marketData}
                        signals={signals}
                        width={800}
                        height={300}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                        <div className="text-center">
                            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Strateji çizin ve BAŞLAT&apos;a basın</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
