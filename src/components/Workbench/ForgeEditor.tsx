'use client';

import { useCallback, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    type ColorMode,
    useReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useForgeStore, type ForgeNodeType } from '@/store';
import { nodeTypes } from './Nodes';

/**
 * FORGE EDITOR
 * 
 * Ana strateji düzenleme alanı
 * React Flow tabanlı görsel node editörü
 * Supports both click-to-add and drag-and-drop
 */

const colorMode: ColorMode = 'dark';

function ForgeEditorInner() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode
    } = useForgeStore();

    const onNodeClick = useCallback((_: React.MouseEvent, node: { id: string }) => {
        useForgeStore.getState().setActiveNode(node.id);
    }, []);

    const onPaneClick = useCallback(() => {
        useForgeStore.getState().setActiveNode(null);
    }, []);

    // Drag-and-drop handlers
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();

        const nodeData = event.dataTransfer.getData('application/nebulaforge-node');
        if (!nodeData) return;

        try {
            const { type, label } = JSON.parse(nodeData) as {
                type: ForgeNodeType;
                nodeType: string;
                label: string;
            };

            // Calculate drop position in flow coordinates
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            addNode(type, position, label);
        } catch (error) {
            console.error('Failed to parse dropped node data:', error);
        }
    }, [screenToFlowPosition, addNode]);

    return (
        <div ref={reactFlowWrapper} className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
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

// Wrapper component with ReactFlowProvider
export default function ForgeEditor() {
    return (
        <ReactFlowProvider>
            <ForgeEditorInner />
        </ReactFlowProvider>
    );
}

