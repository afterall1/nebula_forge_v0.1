import { Hexagon } from 'lucide-react';
import { ForgeEditor, NodePalette } from '@/components/Workbench';
import { SimulationPanel, AnalysisPanel } from '@/components/Simulation';

export default function Home() {
    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="flex-shrink-0 h-12 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Hexagon className="w-5 h-5 text-sky-500" />
                    <h1 className="text-sm font-bold tracking-wider text-slate-200">
                        NEBULA FORGE
                    </h1>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-sky-500/20 text-sky-400 rounded">
                        v1.0
                    </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Visual Strategy Builder</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </header>

            {/* Main Content: Palette | Editor/Simulation | Analysis */}
            <div className="flex-1 flex min-h-0">
                {/* Left: Node Palette */}
                <NodePalette />

                {/* Center: Editor + Simulation (vertical split) */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Editor Area - 60% */}
                    <div className="flex-[6] relative min-h-0 border-b border-slate-700">
                        <ForgeEditor />
                    </div>

                    {/* Simulation Area - 40% */}
                    <div className="flex-[4] min-h-0">
                        <SimulationPanel />
                    </div>
                </div>

                {/* Right: Analysis Panel (conditional) */}
                <AnalysisPanel />
            </div>
        </div>
    );
}
