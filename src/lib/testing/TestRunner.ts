/**
 * TEST RUNNER
 * 
 * Backtest motorunu arayüz olmadan test eder
 * Headless execution for unit testing
 */

import { runSimulation } from '@/lib/engine/BacktestEngine';
import { generateSineWaveData } from './MockDataGenerator';
import type { TestScenario, TestResult, TestSuiteResult, TestSuite } from './types';
import type { UnifiedMarketData } from '@/lib/types/nexus';

// ═══════════════════════════════════════════════════════════════
// SINGLE SCENARIO RUNNER
// ═══════════════════════════════════════════════════════════════

/**
 * Run a single test scenario
 * 
 * @param scenario - Test scenario configuration
 * @param mockData - Optional: provide custom mock data, otherwise generates sine wave
 */
export async function runScenario(
    scenario: TestScenario,
    mockData?: UnifiedMarketData[]
): Promise<TestResult> {
    const startTime = performance.now();

    try {
        // Generate mock data if not provided
        const data = mockData ?? generateSineWaveData(200, 20, 50000);

        // Run simulation
        const result = runSimulation(scenario.nodes, scenario.edges, data);

        const executionTimeMs = performance.now() - startTime;
        const actualSignals = result.signals.length;
        const actualWinRate = result.metrics.winRate;

        // Tolerance for win rate comparison (default 5%)
        const tolerance = scenario.tolerance ?? 5;

        // Assertions
        const errors: string[] = [];

        // Check signal count
        if (actualSignals !== scenario.expectedSignals) {
            errors.push(
                `Signal count mismatch: expected ${scenario.expectedSignals}, got ${actualSignals}`
            );
        }

        // Check win rate within tolerance
        const winRateDiff = Math.abs(actualWinRate - scenario.expectedWinRate);
        if (winRateDiff > tolerance) {
            errors.push(
                `Win rate out of tolerance: expected ${scenario.expectedWinRate}% ±${tolerance}%, got ${actualWinRate.toFixed(2)}%`
            );
        }

        // Build result
        const passed = errors.length === 0;
        const details = passed
            ? `✓ Passed: ${actualSignals} signals, ${actualWinRate.toFixed(2)}% win rate`
            : `✗ Failed:\n  - ${errors.join('\n  - ')}`;

        return {
            scenarioId: scenario.id,
            scenarioName: scenario.name,
            passed,
            details,
            actualSignals,
            actualWinRate,
            executionTimeMs,
        };

    } catch (error) {
        const executionTimeMs = performance.now() - startTime;

        return {
            scenarioId: scenario.id,
            scenarioName: scenario.name,
            passed: false,
            details: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            actualSignals: 0,
            actualWinRate: 0,
            executionTimeMs,
            error,
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// TEST SUITE RUNNER
// ═══════════════════════════════════════════════════════════════

/**
 * Run a complete test suite
 * 
 * @param suite - Test suite containing multiple scenarios
 */
export async function runTestSuite(suite: TestSuite): Promise<TestSuiteResult> {
    const startTime = performance.now();
    const results: TestResult[] = [];

    for (const scenario of suite.scenarios) {
        const result = await runScenario(scenario);
        results.push(result);
    }

    const totalExecutionTimeMs = performance.now() - startTime;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.filter(r => !r.passed).length;

    return {
        suiteName: suite.name,
        totalTests: suite.scenarios.length,
        passedTests,
        failedTests,
        results,
        totalExecutionTimeMs,
    };
}

// ═══════════════════════════════════════════════════════════════
// CONSOLE REPORTER
// ═══════════════════════════════════════════════════════════════

/**
 * Print test results to console
 */
export function printTestResults(suiteResult: TestSuiteResult): void {
    console.log('\n' + '═'.repeat(60));
    console.log(`TEST SUITE: ${suiteResult.suiteName}`);
    console.log('═'.repeat(60));

    for (const result of suiteResult.results) {
        const icon = result.passed ? '✓' : '✗';
        const color = result.passed ? '\x1b[32m' : '\x1b[31m';
        const reset = '\x1b[0m';

        console.log(`\n${color}${icon}${reset} ${result.scenarioName}`);
        console.log(`  ${result.details}`);
        console.log(`  Time: ${result.executionTimeMs.toFixed(2)}ms`);
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`SUMMARY: ${suiteResult.passedTests}/${suiteResult.totalTests} passed`);
    console.log(`Total time: ${suiteResult.totalExecutionTimeMs.toFixed(2)}ms`);
    console.log('═'.repeat(60) + '\n');
}

// ═══════════════════════════════════════════════════════════════
// QUICK TEST UTILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Quick test with minimal setup
 * Useful for debugging and development
 */
export async function quickTest(
    nodes: TestScenario['nodes'],
    edges: TestScenario['edges'],
    expectedSignals: number = 0
): Promise<TestResult> {
    const scenario: TestScenario = {
        id: 'quick-test',
        name: 'Quick Test',
        nodes,
        edges,
        expectedSignals,
        expectedWinRate: 0,
        tolerance: 100, // Don't fail on win rate
    };

    return runScenario(scenario);
}
