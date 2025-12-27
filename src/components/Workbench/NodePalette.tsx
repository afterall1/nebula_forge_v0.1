'use client';

import { useCallback } from 'react';
import { Database, Cpu, Zap } from 'lucide-react';
import { useForgeStore, type ForgeNodeType } from '@/store';

/**
 * NODE PALETTE
 * 
 * Sol tarafta düğüm ekleme toolbar'ı
 * Blueprint estetiğinde drag & drop interface
 */

interface NodeTypeConfig {
    type: ForgeNodeType;
    nodeType: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
}

const NODE_TYPES: NodeTypeConfig[] = [
    {
        type: 'dataSource',
        nodeType: 'sourceNode',
        label: 'Market Data',
        icon: <Database className="w-5 h-5" />,
        color: 'orange',
        description: 'Fiyat verisi kaynağı',
    },
    {
        type: 'logic',
        nodeType: 'processNode',
        label: 'Logic Gate',
        icon: <Cpu className="w-5 h-5" />,
        color: 'sky',
        description: 'Koşul ve mantık',
    },
    {
        type: 'output',
        nodeType: 'resultNode',
        label: 'Signal',
        icon: <Zap className="w-5 h-5" />,
        color: 'emerald',
        description: 'Trade sinyali çıkışı',
    },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; hover: string }> = {
    orange: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        hover: 'hover:border-orange-500/60 hover:bg-orange-500/20',
    },
    sky: {
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/30',
        text: 'text-sky-400',
        hover: 'hover:border-sky-500/60 hover:bg-sky-500/20',
    },
    emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        hover: 'hover:border-emerald-500/60 hover:bg-emerald-500/20',
    },
};

export default function NodePalette() {
    const addNode = useForgeStore((state) => state.addNode);

    const handleAddNode = useCallback((nodeConfig: NodeTypeConfig) => {
        // Calculate a random position near center
        const x = 200 + Math.random() * 200;
        const y = 100 + Math.random() * 200;

        addNode(nodeConfig.type, { x, y }, nodeConfig.label);
    }, [addNode]);

    return (
        <div className="w-48 h-full bg-slate-900/95 border-r border-slate-700 flex flex-col">
            {/* Header */}
            <div className="px-3 py-3 border-b border-slate-800">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Node Palette
                </h3>
            </div>

            {/* Node Types */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {NODE_TYPES.map((nodeConfig) => {
                    const colors = colorClasses[nodeConfig.color];

                    return (
                        <button
                            key={nodeConfig.type}
                            onClick={() => handleAddNode(nodeConfig)}
                            className={`
                w-full p-3 rounded-lg border transition-all duration-200 text-left
                ${colors.bg} ${colors.border} ${colors.hover}
                cursor-pointer group
              `}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className={colors.text}>{nodeConfig.icon}</span>
                                <span className={`text-sm font-medium ${colors.text}`}>
                                    {nodeConfig.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 group-hover:text-slate-400">
                                {nodeConfig.description}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-slate-800">
                <p className="text-[10px] text-slate-600 text-center">
                    Click to add node
                </p>
            </div>
        </div>
    );
}
