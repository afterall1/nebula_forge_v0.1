'use client';

import { memo, useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database, Radio } from 'lucide-react';
import { useForgeStore } from '@/store/forgeStore';
import { connectToStream, disconnectStream } from '@/lib/api/nexusClient';

/**
 * SOURCE NODE - Veri Kaynağı
 * 
 * Market data seçimi için başlangıç düğümü
 * Giriş: Yok | Çıkış: Sağ
 * Live Mode: SSE üzerinden canlı veri akışı
 */

const AVAILABLE_SYMBOLS = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'SOLUSDT',
    'XRPUSDT',
    'ADAUSDT',
    'DOGEUSDT',
    'AVAXUSDT',
];

interface SourceNodeData {
    label?: string;
    symbol?: string;
}

function SourceNode({ data, selected }: NodeProps) {
    const nodeData = data as SourceNodeData;
    const [symbol, setSymbol] = useState(nodeData.symbol || 'BTCUSDT');

    // Store integration for live mode
    const { isLiveMode, setLiveMode, updateLatestCandle } = useForgeStore();

    // Effect: Manage stream connection based on live mode
    useEffect(() => {
        if (isLiveMode) {
            console.log('🔌 Connecting to Live Stream:', symbol);

            const cleanup = connectToStream(symbol, (ticker) => {
                if (ticker.price) {
                    updateLatestCandle(ticker.price);
                }
            });

            return cleanup;
        } else {
            console.log('💤 Disconnecting Stream (Mock Mode)');
            disconnectStream();
        }
    }, [isLiveMode, symbol, updateLatestCandle]);

    // Toggle handler
    const handleToggleLiveMode = () => {
        setLiveMode(!isLiveMode);
    };

    return (
        <div
            className={`
        min-w-[200px] bg-slate-900 border rounded-xl shadow-lg
        ${selected ? 'border-orange-500 shadow-orange-500/20' : 'border-slate-700'}
        transition-all duration-200
      `}
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
                <Database className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                    Market Data
                </span>
            </div>

            {/* Content */}
            <div className="p-3">
                <select
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg 
                     text-slate-200 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500
                     cursor-pointer"
                >
                    {AVAILABLE_SYMBOLS.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>

                {/* Live Mode Toggle */}
                <div
                    onClick={handleToggleLiveMode}
                    className="mt-3 flex items-center justify-between gap-2 p-2 bg-black/30 rounded-lg cursor-pointer
                               hover:bg-black/40 transition-colors border border-slate-700/50"
                >
                    <div className="flex items-center gap-2">
                        <span
                            className={`w-2 h-2 rounded-full ${isLiveMode
                                    ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50'
                                    : 'bg-yellow-500'
                                }`}
                        />
                        <span className="text-xs font-mono text-gray-300">
                            {isLiveMode ? 'LIVE' : 'MOCK'}
                        </span>
                    </div>
                    <Radio
                        className={`w-3.5 h-3.5 ${isLiveMode ? 'text-green-400' : 'text-yellow-500'
                            }`}
                    />
                </div>

                <div className="mt-2 text-xs text-slate-500 text-center">
                    {isLiveMode ? 'Binance Live Feed' : 'Mock Data Mode'}
                </div>
            </div>

            {/* Output Handle - Right */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-orange-500 !border-2 !border-orange-300"
            />
        </div>
    );
}

export default memo(SourceNode);

