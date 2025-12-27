'use client';

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Cpu } from 'lucide-react';

/**
 * PROCESS NODE - Mantık Kapısı
 * 
 * Koşul ve işlem tanımlaması için düğüm
 * Giriş: Sol | Çıkış: Sağ
 */

const LOGIC_OPTIONS = [
    { value: 'rsi_gt_70', label: 'RSI > 70' },
    { value: 'rsi_lt_30', label: 'RSI < 30' },
    { value: 'price_gt_ma200', label: 'Price > MA200' },
    { value: 'price_lt_ma200', label: 'Price < MA200' },
    { value: 'divergence', label: 'Divergence Detected' },
    { value: 'volume_spike', label: 'Volume Spike' },
    { value: 'oi_increase', label: 'OI Increasing' },
    { value: 'funding_positive', label: 'Funding > 0' },
];

interface ProcessNodeData {
    label?: string;
    logic?: string;
}

function ProcessNode({ data, selected }: NodeProps) {
    const nodeData = data as ProcessNodeData;
    const [logic, setLogic] = useState(nodeData.logic || 'rsi_gt_70');

    return (
        <div
            className={`
        min-w-[220px] bg-slate-900 border rounded-xl shadow-lg
        ${selected ? 'border-sky-500 shadow-sky-500/20' : 'border-slate-700'}
        transition-all duration-200
      `}
        >
            {/* Input Handle - Left */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-sky-500 !border-2 !border-sky-300"
            />

            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
                <Cpu className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                    Logic Gate
                </span>
            </div>

            {/* Content */}
            <div className="p-3">
                <select
                    value={logic}
                    onChange={(e) => setLogic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg 
                     text-slate-200 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500
                     cursor-pointer"
                >
                    {LOGIC_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <div className="mt-2 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                    <span className="text-xs text-slate-500">Processing</span>
                </div>
            </div>

            {/* Output Handle - Right */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-sky-500 !border-2 !border-sky-300"
            />
        </div>
    );
}

export default memo(ProcessNode);
