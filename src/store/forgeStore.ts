import { create } from 'zustand';
import {
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    type Connection,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';

/**
 * FORGE STORE
 * 
 * Strateji editörü ve global uygulama durumu
 * React Flow entegrasyonu ile
 */

// ═══════════════════════════════════════════════════════════════
// CUSTOM NODE TYPES
// ═══════════════════════════════════════════════════════════════

export type ForgeNodeType =
    | 'dataSource'    // Veri kaynağı (BTCUSDT, ETHUSDT, vs.)
    | 'indicator'     // Teknik indikatör (RSI, MACD, vs.)
    | 'condition'     // Koşul (>, <, ==, vs.)
    | 'logic'         // Mantık (AND, OR, NOT)
    | 'output'        // Çıkış (Signal, Alert, vs.)
    | 'custom';       // Özel düğüm

export interface ForgeNodeData {
    label: string;
    type: ForgeNodeType;
    config?: Record<string, unknown>;
    [key: string]: unknown; // Index signature for compatibility
}

export type ForgeNode = Node<ForgeNodeData>;
export type ForgeEdge = Edge;

// ═══════════════════════════════════════════════════════════════
// INITIAL DATA (Genius Touch)
// ═══════════════════════════════════════════════════════════════

const initialNodes: ForgeNode[] = [
    {
        id: 'node-datasource-1',
        type: 'default',
        position: { x: 100, y: 150 },
        data: {
            label: '📊 BTCUSDT',
            type: 'dataSource',
            config: {
                symbol: 'BTCUSDT',
                interval: '1h',
            },
        },
    },
    {
        id: 'node-output-1',
        type: 'default',
        position: { x: 450, y: 150 },
        data: {
            label: '🚀 Signal Output',
            type: 'output',
            config: {
                signalType: 'alert',
            },
        },
    },
];

const initialEdges: ForgeEdge[] = [
    {
        id: 'edge-1',
        source: 'node-datasource-1',
        target: 'node-output-1',
        animated: true,
    },
];

// ═══════════════════════════════════════════════════════════════
// STORE INTERFACE
// ═══════════════════════════════════════════════════════════════

interface ForgeState {
    // React Flow State
    nodes: ForgeNode[];
    edges: ForgeEdge[];

    // UI State
    activeNodeId: string | null;
    isSimulating: boolean;

    // React Flow Actions
    onNodesChange: OnNodesChange<ForgeNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    // Custom Actions
    addNode: (type: ForgeNodeType, position: { x: number; y: number }, label?: string) => void;
    removeNode: (id: string) => void;
    updateNodeData: (id: string, data: Partial<ForgeNodeData>) => void;

    // UI Actions
    setActiveNode: (id: string | null) => void;
    setSimulating: (status: boolean) => void;

    // Utility Actions
    clearCanvas: () => void;
    resetToDefault: () => void;
}

// ═══════════════════════════════════════════════════════════════
// STORE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

let nodeIdCounter = 2; // Start after initial nodes

export const useForgeStore = create<ForgeState>((set, get) => ({
    // Initial State
    nodes: initialNodes,
    edges: initialEdges,
    activeNodeId: null,
    isSimulating: false,

    // ─────────────────────────────────────────────────────────────
    // React Flow Handlers
    // ─────────────────────────────────────────────────────────────

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(
                { ...connection, animated: true },
                get().edges
            ),
        });
    },

    // ─────────────────────────────────────────────────────────────
    // Custom Node Actions
    // ─────────────────────────────────────────────────────────────

    addNode: (type, position, label) => {
        const id = `node-${type}-${++nodeIdCounter}`;

        const typeLabels: Record<ForgeNodeType, string> = {
            dataSource: '📊 Data Source',
            indicator: '📈 Indicator',
            condition: '⚖️ Condition',
            logic: '🔗 Logic Gate',
            output: '🚀 Output',
            custom: '⚙️ Custom Node',
        };

        // Map ForgeNodeType to React Flow node type
        const nodeTypeMap: Record<ForgeNodeType, string> = {
            dataSource: 'sourceNode',
            indicator: 'processNode',
            condition: 'processNode',
            logic: 'processNode',
            output: 'resultNode',
            custom: 'default',
        };

        const newNode: ForgeNode = {
            id,
            type: nodeTypeMap[type] || 'default',
            position,
            data: {
                label: label || typeLabels[type],
                type,
                config: {},
            },
        };

        set({
            nodes: [...get().nodes, newNode],
        });
    },

    removeNode: (id) => {
        set({
            nodes: get().nodes.filter((node) => node.id !== id),
            edges: get().edges.filter(
                (edge) => edge.source !== id && edge.target !== id
            ),
        });
    },

    updateNodeData: (id, data) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === id
                    ? { ...node, data: { ...node.data, ...data } }
                    : node
            ),
        });
    },

    // ─────────────────────────────────────────────────────────────
    // UI Actions
    // ─────────────────────────────────────────────────────────────

    setActiveNode: (id) => set({ activeNodeId: id }),
    setSimulating: (status) => set({ isSimulating: status }),

    // ─────────────────────────────────────────────────────────────
    // Utility Actions
    // ─────────────────────────────────────────────────────────────

    clearCanvas: () => {
        set({ nodes: [], edges: [] });
    },

    resetToDefault: () => {
        nodeIdCounter = 2;
        set({ nodes: initialNodes, edges: initialEdges });
    },
}));
