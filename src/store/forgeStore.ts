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

// Market data imports
import { fetchMarketData } from '@/lib/api/nexusClient';
import { generateMarketScenario } from '@/lib/testing/MockDataGenerator';
import type { UnifiedMarketData } from '@/lib/types/nexus';

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

// Clean canvas - no default mock nodes
const initialNodes: ForgeNode[] = [];
const initialEdges: ForgeEdge[] = [];

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
    analysisReport: string | null;

    // ─────────────────────────────────────────────────────────────
    // MARKET DATA STATE (Live Data Integration)
    // ─────────────────────────────────────────────────────────────
    marketData: UnifiedMarketData[];
    isLoadingMarket: boolean;
    marketError: string | null;
    dataSource: 'live' | 'mock' | null;

    // ─────────────────────────────────────────────────────────────
    // LIVE STREAMING STATE
    // ─────────────────────────────────────────────────────────────
    isLiveMode: boolean;
    activeSymbol: string;

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
    setAnalysisReport: (report: string | null) => void;

    // ─────────────────────────────────────────────────────────────
    // MARKET DATA ACTIONS
    // ─────────────────────────────────────────────────────────────
    loadMarketData: (symbol: string, interval: string, limit: number) => Promise<void>;

    // ─────────────────────────────────────────────────────────────
    // LIVE STREAMING ACTIONS
    // ─────────────────────────────────────────────────────────────
    setLiveMode: (isLive: boolean) => void;
    updateLatestCandle: (price: number) => void;

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
    analysisReport: null,

    // Market Data Initial State
    marketData: [],
    isLoadingMarket: false,
    marketError: null,
    dataSource: null,

    // Live Streaming Initial State
    isLiveMode: false,
    activeSymbol: 'BTCUSDT',

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
    setAnalysisReport: (report) => set({ analysisReport: report }),

    // ─────────────────────────────────────────────────────────────
    // MARKET DATA ACTIONS
    // ─────────────────────────────────────────────────────────────

    loadMarketData: async (symbol: string, interval: string = '1h', limit: number = 500) => {
        set({ isLoadingMarket: true, marketError: null });

        try {
            // 1. Try Live Data First
            console.log(`[ForgeStore] Fetching live data: ${symbol} ${interval}`);
            const liveData = await fetchMarketData(symbol, interval, limit);

            if (liveData && liveData.length > 0) {
                console.log(`[ForgeStore] ✅ Live data received: ${liveData.length} candles`);
                set({
                    marketData: liveData,
                    isLoadingMarket: false,
                    dataSource: 'live',
                    marketError: null,
                });
                return;
            }

            // 2. Empty response - fall back to mock
            throw new Error('Empty response from live API');

        } catch (error) {
            // 3. Fallback to Mock Data
            console.warn('[ForgeStore] ⚠️ Live data failed, reverting to mock:', error);

            try {
                const mockData = generateMarketScenario('NORMAL', limit);
                console.log(`[ForgeStore] 📦 Mock data generated: ${mockData.length} candles`);

                set({
                    marketData: mockData,
                    isLoadingMarket: false,
                    dataSource: 'mock',
                    marketError: `Live data unavailable. Using mock data. (${error instanceof Error ? error.message : 'Unknown error'})`,
                });

            } catch (mockError) {
                // 4. Total failure
                console.error('[ForgeStore] ❌ Both live and mock data failed:', mockError);
                set({
                    marketData: [],
                    isLoadingMarket: false,
                    dataSource: null,
                    marketError: 'Failed to load any market data',
                });
            }
        }
    },

    // ─────────────────────────────────────────────────────────────
    // LIVE STREAMING ACTIONS
    // ─────────────────────────────────────────────────────────────

    setLiveMode: (isLive) => set({ isLiveMode: isLive }),

    updateLatestCandle: (price) => set((state) => {
        // POC: Log live tick to console
        // Future: Update latest candle in marketData array
        console.log(`[LIVE TICK] ${state.activeSymbol}: $${price.toFixed(2)}`);
        return {};
    }),

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

