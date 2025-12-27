/**
 * TESTING TYPES
 * 
 * Unit test ve senaryo test tipleri
 */

import type { Edge } from '@xyflow/react';

// ═══════════════════════════════════════════════════════════════
// NODE DEFINITION FOR TESTS
// ═══════════════════════════════════════════════════════════════

export interface TestNode {
    id: string;
    type: string;
    data: Record<string, unknown>;
    position: { x: number; y: number };
}

// ═══════════════════════════════════════════════════════════════
// TEST SCENARIO
// ═══════════════════════════════════════════════════════════════

export interface TestScenario {
    id: string;
    name: string;
    description?: string;
    nodes: TestNode[];
    edges: Edge[];
    expectedSignals: number;
    expectedWinRate: number;
    tolerance?: number; // Acceptable deviation percentage
}

// ═══════════════════════════════════════════════════════════════
// TEST RESULT
// ═══════════════════════════════════════════════════════════════

export interface TestResult {
    scenarioId: string;
    scenarioName: string;
    passed: boolean;
    details: string;
    actualSignals: number;
    actualWinRate: number;
    executionTimeMs: number;
    error?: unknown;
}

// ═══════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════

export interface TestSuite {
    name: string;
    scenarios: TestScenario[];
    createdAt: number;
}

export interface TestSuiteResult {
    suiteName: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: TestResult[];
    totalExecutionTimeMs: number;
}
