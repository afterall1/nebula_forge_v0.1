/**
 * Custom Node Types for React Flow
 * 
 * Nebula Forge görsel editör düğümleri
 */

import SourceNode from './SourceNode';
import ProcessNode from './ProcessNode';
import ResultNode from './ResultNode';

// Node type registry for React Flow
export const nodeTypes = {
    sourceNode: SourceNode,
    processNode: ProcessNode,
    resultNode: ResultNode,
} as const;

export type CustomNodeType = keyof typeof nodeTypes;

// Re-export individual nodes
export { SourceNode, ProcessNode, ResultNode };
