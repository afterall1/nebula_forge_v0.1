/**
 * ANALYST SERVICE
 * 
 * Mock AI report generator following AI_INTERPRETER_PROMPT.md format
 * Will be replaced with real LLM integration (OpenAI) in future
 * 
 * @ref .antigravity/memory/AI_INTERPRETER_PROMPT.md
 */

import type { BacktestResult } from '@/lib/types/backtest';
import type { UnifiedMarketData } from '@/lib/types/nexus';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type ScenarioType = 'NORMAL' | 'SHORT_SQUEEZE' | 'SPOT_PUMP' | 'ACCUMULATION' | 'DISTRIBUTION';
type SQNGrade = '🔴 Poor' | '🟠 Average' | '🟡 Good' | '🟢 Excellent' | '🟣 Superb' | '🚨 Holy Grail';
type VerdictType = 'DEPLOY' | 'REJECT';

interface AnalysisMetrics {
    openInterestChange: number;
    fundingRateAverage: number;
    spotFuturesSpread: number;
    netInflow: number;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Grade SQN using Van Tharp scale
 */
function gradeSQN(sqn: number): SQNGrade {
    if (sqn >= 7.0) return '🚨 Holy Grail';
    if (sqn >= 3.0) return '🟣 Superb';
    if (sqn >= 2.5) return '🟢 Excellent';
    if (sqn >= 2.0) return '🟡 Good';
    if (sqn >= 1.6) return '🟠 Average';
    return '🔴 Poor';
}

/**
 * Grade Sharpe Ratio
 */
function gradeSharpe(sharpe: number): string {
    if (sharpe >= 3.0) return '🟣 Excellent';
    if (sharpe >= 2.0) return '🟢 Very Good';
    if (sharpe >= 1.0) return '🟡 Good';
    return '🔴 Sub-optimal';
}

/**
 * Grade Max Drawdown
 */
function gradeDrawdown(dd: number): string {
    if (dd <= 5) return '🟢 Excellent';
    if (dd <= 15) return '🟡 Acceptable';
    if (dd <= 30) return '🟠 High';
    return '🔴 Unacceptable';
}

/**
 * Detect market scenario from data patterns
 */
function detectScenario(marketData: UnifiedMarketData[], metrics: AnalysisMetrics): ScenarioType {
    const { openInterestChange, fundingRateAverage, spotFuturesSpread, netInflow } = metrics;

    // Price direction from first to last candle
    const priceChange = marketData.length > 1
        ? ((marketData[marketData.length - 1].close - marketData[0].close) / marketData[0].close) * 100
        : 0;

    // SHORT_SQUEEZE: Price up + OI down + Negative funding
    if (priceChange > 2 && openInterestChange < -10 && fundingRateAverage < -0.01) {
        return 'SHORT_SQUEEZE';
    }

    // SPOT_PUMP: Positive inflow + Spot premium
    if (netInflow > 0 && spotFuturesSpread > 0.3) {
        return 'SPOT_PUMP';
    }

    // ACCUMULATION: Price flat + OI up
    if (Math.abs(priceChange) < 2 && openInterestChange > 10) {
        return 'ACCUMULATION';
    }

    // DISTRIBUTION: Price down/flat + OI down + Negative inflow
    if (priceChange < 0 && openInterestChange < -5 && netInflow < 0) {
        return 'DISTRIBUTION';
    }

    return 'NORMAL';
}

/**
 * Calculate analysis metrics from market data
 */
function calculateMarketMetrics(marketData: UnifiedMarketData[]): AnalysisMetrics {
    if (marketData.length < 2) {
        return {
            openInterestChange: 0,
            fundingRateAverage: 0,
            spotFuturesSpread: 0,
            netInflow: 0,
        };
    }

    // OI change
    const firstOI = marketData[0].metrics?.openInterest ?? 0;
    const lastOI = marketData[marketData.length - 1].metrics?.openInterest ?? 0;
    const openInterestChange = firstOI > 0 ? ((lastOI - firstOI) / firstOI) * 100 : 0;

    // Average funding rate
    const fundingRates = marketData
        .map(d => d.metrics?.fundingRate)
        .filter((f): f is number => f !== undefined);
    const fundingRateAverage = fundingRates.length > 0
        ? fundingRates.reduce((a, b) => a + b, 0) / fundingRates.length
        : 0;

    // Spot-Futures spread (last candle)
    const lastCandle = marketData[marketData.length - 1];
    const spotPrice = lastCandle.spotPrice?.close ?? lastCandle.close;
    const spotFuturesSpread = ((spotPrice - lastCandle.close) / lastCandle.close) * 100;

    // Net inflow
    const inflows = marketData
        .map(d => d.metrics?.netInflow)
        .filter((i): i is number => i !== undefined);
    const netInflow = inflows.reduce((a, b) => a + b, 0);

    return {
        openInterestChange,
        fundingRateAverage,
        spotFuturesSpread,
        netInflow,
    };
}

/**
 * Generate red flags based on metrics
 */
function generateRedFlags(
    result: BacktestResult,
    scenario: ScenarioType,
    metrics: AnalysisMetrics
): string[] {
    const flags: string[] = [];

    // Win rate too high
    if (result.metrics.winRate > 90) {
        flags.push('⚠️ Win Rate > 90% - Possible Look-Ahead Bias or Overfitting');
    }

    // Max drawdown too high
    if (result.metrics.maxDrawdown > 30) {
        flags.push('⚠️ Max Drawdown > 30% - Unacceptable risk level');
    }

    // Too few trades
    if (result.metrics.tradeCount < 30) {
        flags.push('⚠️ Trade Count < 30 - Statistically insignificant');
    }

    // Profit factor below 1
    if (result.metrics.profitFactor < 1) {
        flags.push('⚠️ Profit Factor < 1 - Losses exceed gains');
    }

    // SQN suspiciously high
    if (result.metrics.sqn > 5) {
        flags.push('🚨 SQN > 5.0 - Check for overfitting or data errors');
    }

    // Scenario-specific flags
    if (scenario === 'SHORT_SQUEEZE') {
        flags.push('📉 Negative funding during rally indicates forced liquidations');
    }

    if (metrics.fundingRateAverage < -0.05) {
        flags.push(`⚡ Funding consistently negative (${(metrics.fundingRateAverage * 100).toFixed(3)}% avg)`);
    }

    return flags;
}

/**
 * Determine final verdict
 */
function determineVerdict(result: BacktestResult, redFlags: string[]): { verdict: VerdictType; reason: string } {
    const criticalFlags = redFlags.filter(f => f.includes('🚨') || f.includes('Unacceptable'));

    if (criticalFlags.length > 0) {
        return {
            verdict: 'REJECT',
            reason: 'Critical red flags detected. Review and fix before deployment.',
        };
    }

    if (result.metrics.sqn < 1.6) {
        return {
            verdict: 'REJECT',
            reason: 'System quality below tradable threshold (SQN < 1.6).',
        };
    }

    if (result.metrics.profitFactor < 1) {
        return {
            verdict: 'REJECT',
            reason: 'Negative expectancy - system loses money.',
        };
    }

    if (redFlags.length >= 3) {
        return {
            verdict: 'REJECT',
            reason: 'Multiple warnings indicate unreliable backtest.',
        };
    }

    if (result.metrics.sqn >= 2.5 && result.metrics.maxDrawdown < 15) {
        return {
            verdict: 'DEPLOY',
            reason: 'Excellent risk-adjusted returns with acceptable drawdown.',
        };
    }

    return {
        verdict: 'DEPLOY',
        reason: 'System shows positive expectancy. Deploy with tight risk management.',
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate analysis report from backtest results
 * 
 * @param result - Backtest results with metrics
 * @param marketData - Market data used in the backtest
 * @returns Markdown-formatted analysis report
 */
export async function generateReport(
    result: BacktestResult,
    marketData: UnifiedMarketData[]
): Promise<string> {
    // Simulate LLM processing delay (800-1500ms)
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    // Calculate market metrics
    const metrics = calculateMarketMetrics(marketData);

    // Detect scenario
    const scenario = detectScenario(marketData, metrics);

    // Grade metrics
    const sqnGrade = gradeSQN(result.metrics.sqn);
    const sharpeGrade = gradeSharpe(result.metrics.sharpeRatio);
    const ddGrade = gradeDrawdown(result.metrics.maxDrawdown);

    // Generate red flags
    const redFlags = generateRedFlags(result, scenario, metrics);

    // Determine verdict
    const { verdict, reason } = determineVerdict(result, redFlags);

    // Determine manipulation risk
    const manipulationRisk = scenario === 'NORMAL' ? 'LOW'
        : scenario === 'SHORT_SQUEEZE' || scenario === 'DISTRIBUTION' ? 'HIGH'
            : 'MEDIUM';

    // Determine market structure
    const marketStructure = metrics.spotFuturesSpread > 0
        ? 'Spot Premium - Organic demand (Bullish bias)'
        : 'Futures Premium - Speculative demand (Caution advised)';

    // Build report
    const report = `
## 📊 EXECUTIVE SUMMARY

> Strategy completed with **${result.metrics.tradeCount} trades** and ${result.metrics.totalReturn >= 0 ? '📈' : '📉'} **${result.metrics.totalReturn.toFixed(2)}%** return.
> Scenario: **${scenario}** | Manipulation Risk: **${manipulationRisk}**

---

## 🔍 MECHANICS ANALYSIS

- **Scenario Detected:** ${scenario}
- **Market Structure:** ${marketStructure}
- **Manipulation Risk:** ${manipulationRisk}
- **OI Change:** ${metrics.openInterestChange.toFixed(1)}%
- **Avg Funding:** ${(metrics.fundingRateAverage * 100).toFixed(4)}%

---

## ⚖️ RISK PROFILE

| Metric | Value | Grade |
|--------|-------|-------|
| SQN | ${result.metrics.sqn.toFixed(2)} | ${sqnGrade} |
| Sharpe | ${result.metrics.sharpeRatio.toFixed(2)} | ${sharpeGrade} |
| Max DD | ${result.metrics.maxDrawdown.toFixed(1)}% | ${ddGrade} |
| Win Rate | ${result.metrics.winRate.toFixed(1)}% | ${result.metrics.winRate >= 50 ? '🟢 Positive' : '🔴 Negative'} |
| Profit Factor | ${result.metrics.profitFactor.toFixed(2)} | ${result.metrics.profitFactor >= 1.5 ? '🟢 Good' : result.metrics.profitFactor >= 1 ? '🟡 Marginal' : '🔴 Losing'} |

---

## ⚠️ RED FLAGS

${redFlags.length > 0 ? redFlags.map(f => `- ${f}`).join('\n') : '- ✅ No critical issues detected'}

---

## ${verdict === 'DEPLOY' ? '✅' : '❌'} VERDICT

**[${verdict}]** - ${reason}
`.trim();

    return report;
}
