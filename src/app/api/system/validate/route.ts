/**
 * SYSTEM VALIDATION API
 * 
 * GET /api/system/validate
 * 
 * Runs all test scenarios and returns AI-optimized diagnostic report
 */

import { NextResponse } from 'next/server';
import { runScenario } from '@/lib/testing/TestRunner';
import { allScenarios } from '@/lib/testing/scenarios/sanityCheck';
import type { TestResult } from '@/lib/testing/types';

// ═══════════════════════════════════════════════════════════════
// AI-OPTIMIZED RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

interface FailureReport {
    scenario: string;
    error: string;
    suggestion: string;
}

interface ValidationResponse {
    status: 'PASSED' | 'FAILED';
    message: string;
    timestamp: string;
    executionTimeMs: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    failures?: FailureReport[];
}

// ═══════════════════════════════════════════════════════════════
// SUGGESTION GENERATOR
// ═══════════════════════════════════════════════════════════════

function generateSuggestion(result: TestResult): string {
    const { scenarioId, details } = result;

    if (details.includes('Signal count mismatch')) {
        if (details.includes('got 0')) {
            return 'Check lib/engine/NodeRegistry.ts - evaluateNode function may not be returning signals. Verify node type matching.';
        }
        return 'Check lib/engine/BacktestEngine.ts - signal generation logic may have issues.';
    }

    if (details.includes('Win rate')) {
        return 'Check lib/engine/BacktestEngine.ts - position management or PnL calculation may be incorrect.';
    }

    if (details.includes('Error')) {
        if (scenarioId.includes('rsi')) {
            return 'Check RSI calculation in lib/engine/NodeRegistry.ts - calculateSimpleRSI function.';
        }
        return 'Check console for stack trace. Possible runtime error in engine.';
    }

    return 'Review lib/engine/ files for logic errors.';
}

// ═══════════════════════════════════════════════════════════════
// API HANDLER
// ═══════════════════════════════════════════════════════════════

export async function GET() {
    const startTime = performance.now();
    const results: TestResult[] = [];

    try {
        // Run all scenarios
        for (const scenario of allScenarios) {
            const result = await runScenario(scenario);
            results.push(result);
        }

        const executionTimeMs = performance.now() - startTime;
        const passedTests = results.filter(r => r.passed).length;
        const failedTests = results.filter(r => !r.passed).length;
        const allPassed = failedTests === 0;

        // Build response
        const response: ValidationResponse = {
            status: allPassed ? 'PASSED' : 'FAILED',
            message: allPassed
                ? '✓ All Systems Nominal - Engine is functioning correctly'
                : `✗ ${failedTests} test(s) failed - See failures for details`,
            timestamp: new Date().toISOString(),
            executionTimeMs: Math.round(executionTimeMs),
            totalTests: results.length,
            passedTests,
            failedTests,
        };

        // Add failure details if any
        if (!allPassed) {
            response.failures = results
                .filter(r => !r.passed)
                .map(r => ({
                    scenario: r.scenarioName,
                    error: r.details.replace('✗ Failed:\n', '').replace(/\s+/g, ' ').trim(),
                    suggestion: generateSuggestion(r),
                }));
        }

        return NextResponse.json(response, {
            status: allPassed ? 200 : 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Test-Status': allPassed ? 'PASSED' : 'FAILED',
            },
        });

    } catch (error) {
        const executionTimeMs = performance.now() - startTime;

        return NextResponse.json({
            status: 'FAILED',
            message: '✗ Critical Error - Test runner crashed',
            timestamp: new Date().toISOString(),
            executionTimeMs: Math.round(executionTimeMs),
            totalTests: allScenarios.length,
            passedTests: 0,
            failedTests: allScenarios.length,
            failures: [{
                scenario: 'Test Runner',
                error: error instanceof Error ? error.message : 'Unknown error',
                suggestion: 'Check lib/testing/TestRunner.ts for errors. Verify all imports are correct.',
            }],
        } as ValidationResponse, {
            status: 500,
        });
    }
}
