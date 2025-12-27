'use client';

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap, Bell } from 'lucide-react';

/**
 * RESULT NODE - Sonuç Çıktısı
 * 
 * Trade signal veya alert çıktısı
 * Giriş: Sol | Çıkış: Yok
 */

type OutputType = 'signal' | 'alert';

interface ResultNodeData {
    label?: string;
    outputType?: OutputType;
    isActive?: boolean;
}

function ResultNode({ data, selected }: NodeProps) {
    const nodeData = data as ResultNodeData;
    const [outputType, setOutputType] = useState<OutputType>(nodeData.outputType || 'signal');
    const [isActive] = useState(nodeData.isActive ?? true);

    return (
        <div
            className={`
        min-w-[180px] bg-slate-900 border rounded-xl shadow-lg
        ${selected ? 'border-emerald-500 shadow-emerald-500/20' : 'border-slate-700'}
        transition-all duration-200
      `}
        >
            {/* Input Handle - Left */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-300"
            />

            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
                {outputType === 'signal' ? (
                    <Zap className="w-4 h-4 text-emerald-500" />
                ) : (
                    <Bell className="w-4 h-4 text-emerald-500" />
                )}
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    {outputType === 'signal' ? 'Trade Signal' : 'Alert'}
                </span>
            </div>

            {/* Content */}
            <div className="p-3">
                {/* Output Type Toggle */}
                <div className="flex gap-1 p-1 bg-slate-800 rounded-lg mb-3">
                    <button
                        onClick={() => setOutputType('signal')}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all
              ${outputType === 'signal'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Signal
                    </button>
                    <button
                        onClick={() => setOutputType('alert')}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all
              ${outputType === 'alert'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Alert
                    </button>
                </div>

                {/* LED Indicator */}
                <div className="flex items-center justify-center gap-2">
                    <div
                        className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${isActive
                                ? 'bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.6)]'
                                : 'bg-slate-600'
                            }
            `}
                        style={{
                            animation: isActive ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                        }}
                    />
                    <span className={`text-xs font-medium ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {isActive ? 'ACTIVE' : 'STANDBY'}
                    </span>
                </div>
            </div>

            {/* CSS for LED glow animation */}
            <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 8px 2px rgba(16, 185, 129, 0.6);
          }
          50% {
            box-shadow: 0 0 16px 4px rgba(16, 185, 129, 0.8);
          }
        }
      `}</style>
        </div>
    );
}

export default memo(ResultNode);
