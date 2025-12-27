'use client';

import { useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    type ColorMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useForgeStore } from '@/store';
import { nodeTypes } from './Nodes';

/**
 * FORGE EDITOR
 * 
 * Ana strateji düzenleme alanı
 * React Flow tabanlı görsel node editörü
 */

const colorMode: ColorMode = 'dark';

export default function ForgeEditor() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect
    } = useForgeStore();

    const onNodeClick = useCallback((_: React.MouseEvent, node: { id: string }) => {
        useForgeStore.getState().setActiveNode(node.id);
    }, []);

    const onPaneClick = useCallback(() => {
        useForgeStore.getState().setActiveNode(null);
    }, []);

    return (
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                colorMode={colorMode}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                defaultEdgeOptions={{
                    animated: true,
                    style: { stroke: '#0ea5e9', strokeWidth: 2 },
                }}
                proOptions={{ hideAttribution: true }}
            >
                {/* Grid Background */}
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={12}
                    size={1}
                    color="#334155"
                />

                {/* Zoom Controls */}
                <Controls
                    className="!bg-slate-800 !border-slate-700 !rounded-lg !shadow-lg"
                    showInteractive={false}
                />

                {/* MiniMap */}
                <MiniMap
                    className="!bg-slate-900 !border-slate-700 !rounded-lg"
                    nodeColor="#0ea5e9"
                    maskColor="rgba(0, 0, 0, 0.7)"
                    pannable
                    zoomable
                />
            </ReactFlow>
        </div>
    );
}
