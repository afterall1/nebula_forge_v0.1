'use client';

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database } from 'lucide-react';

/**
 * SOURCE NODE - Veri Kaynağı
 * 
 * Market data seçimi için başlangıç düğümü
 * Giriş: Yok | Çıkış: Sağ
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

                <div className="mt-2 text-xs text-slate-500 text-center">
                    Real-time price feed
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
