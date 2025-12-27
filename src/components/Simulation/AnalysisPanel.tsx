'use client';

import { useEffect, useState } from 'react';
import { X, Terminal, Brain, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useForgeStore } from '@/store';

/**
 * ANALYSIS PANEL
 * 
 * Bloomberg Terminal-style AI analysis report viewer
 * Design: Black background, monospaced font, green/red highlights
 */

export default function AnalysisPanel() {
    const { analysisReport, setAnalysisReport } = useForgeStore();
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Handle visibility animation
    useEffect(() => {
        if (analysisReport) {
            setIsLoading(false);
            setIsVisible(true);
        }
    }, [analysisReport]);

    // Handle loading state from store (set elsewhere)
    useEffect(() => {
        const unsubscribe = useForgeStore.subscribe((state, prevState) => {
            // Detect when simulation starts
            if (state.isSimulating && !prevState.isSimulating) {
                setIsLoading(true);
                setIsVisible(true);
            }
        });
        return unsubscribe;
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setAnalysisReport(null);
            setIsLoading(false);
        }, 300);
    };

    if (!isVisible && !isLoading) {
        return null;
    }

    return (
        <div
            className={`
                w-80 h-full flex flex-col bg-black border-l border-emerald-900/50
                transition-all duration-300 ease-out
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
        >
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-emerald-900/50 bg-emerald-950/30">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-mono font-bold text-emerald-400 tracking-wider">
                        CORTEX ANALYSIS
                    </span>
                </div>
                <button
                    onClick={handleClose}
                    className="p-1 hover:bg-emerald-900/30 rounded transition-colors"
                >
                    <X className="w-4 h-4 text-emerald-600 hover:text-emerald-400" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                {isLoading ? (
                    <LoadingState />
                ) : analysisReport ? (
                    <ReportRenderer content={analysisReport} />
                ) : null}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-4 py-2 border-t border-emerald-900/50 bg-emerald-950/20">
                <div className="flex items-center gap-2 text-[10px] text-emerald-700 font-mono">
                    <Brain className="w-3 h-3" />
                    <span>NEBULA CORTEX v1.0</span>
                    <span className="ml-auto">
                        {new Date().toLocaleTimeString('en-US', { hour12: false })}
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * Loading animation with terminal cursor
 */
function LoadingState() {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 400);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col items-center justify-center text-emerald-500">
            <div className="relative">
                <Brain className="w-12 h-12 animate-pulse" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            </div>
            <p className="mt-4 text-sm">Processing Market Data{dots}</p>
            <p className="mt-1 text-[10px] text-emerald-700">
                Analyzing patterns and metrics...
            </p>
            <div className="mt-4 w-48 h-1 bg-emerald-900/50 rounded overflow-hidden">
                <div className="h-full bg-emerald-500 animate-[loading_1.5s_ease-in-out_infinite]"
                    style={{ width: '60%' }} />
            </div>
        </div>
    );
}

/**
 * Markdown-like report renderer with Bloomberg styling
 */
function ReportRenderer({ content }: { content: string }) {
    const lines = content.split('\n');

    return (
        <div className="space-y-2">
            {lines.map((line, index) => (
                <RenderLine key={index} line={line} />
            ))}
        </div>
    );
}

function RenderLine({ line }: { line: string }) {
    // Empty line
    if (!line.trim()) {
        return <div className="h-2" />;
    }

    // Horizontal rule
    if (line.trim() === '---') {
        return <hr className="border-emerald-900/50 my-3" />;
    }

    // H2 Header
    if (line.startsWith('## ')) {
        const text = line.slice(3);
        return (
            <h2 className="text-emerald-400 font-bold text-sm mt-4 mb-2 flex items-center gap-2">
                {text}
            </h2>
        );
    }

    // Blockquote (summary)
    if (line.startsWith('> ')) {
        const text = line.slice(2);
        return (
            <blockquote className="border-l-2 border-emerald-500 pl-3 py-1 text-slate-300 bg-emerald-950/20 rounded-r">
                <HighlightedText text={text} />
            </blockquote>
        );
    }

    // Table header
    if (line.startsWith('| Metric')) {
        return null; // Skip, we'll render as part of table body
    }

    // Table separator
    if (line.startsWith('|---')) {
        return null; // Skip
    }

    // Table row
    if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').filter(c => c.trim());
        if (cells.length >= 3) {
            const [metric, value, grade] = cells.map(c => c.trim());
            return (
                <div className="flex items-center justify-between py-1 border-b border-emerald-900/30">
                    <span className="text-slate-400">{metric}</span>
                    <span className="text-slate-200 font-medium">{value}</span>
                    <span className="text-xs">
                        <GradeRenderer grade={grade} />
                    </span>
                </div>
            );
        }
    }

    // List item
    if (line.startsWith('- ')) {
        const text = line.slice(2);
        const isWarning = text.includes('⚠️') || text.includes('🚨');
        const isSuccess = text.includes('✅');

        return (
            <div className={`flex items-start gap-2 py-1 ${isWarning ? 'text-amber-400' : isSuccess ? 'text-emerald-400' : 'text-slate-300'}`}>
                {isWarning && <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                {isSuccess && <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                {!isWarning && !isSuccess && <span className="text-emerald-600">•</span>}
                <span><HighlightedText text={text.replace(/[⚠️🚨✅]/g, '').trim()} /></span>
            </div>
        );
    }

    // VERDICT line
    if (line.includes('[DEPLOY]')) {
        return (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-600/50 rounded mt-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-emerald-400 font-bold">DEPLOY</span>
                <span className="text-slate-300 text-[11px]">
                    {line.replace(/\*\*\[DEPLOY\]\*\*\s*-?\s*/, '')}
                </span>
            </div>
        );
    }

    if (line.includes('[REJECT]')) {
        return (
            <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-600/50 rounded mt-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-400 font-bold">REJECT</span>
                <span className="text-slate-300 text-[11px]">
                    {line.replace(/\*\*\[REJECT\]\*\*\s*-?\s*/, '')}
                </span>
            </div>
        );
    }

    // Default text
    return (
        <p className="text-slate-400">
            <HighlightedText text={line} />
        </p>
    );
}

/**
 * Highlight bold text and values
 */
function HighlightedText({ text }: { text: string }) {
    // Replace **text** with styled spans
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    const inner = part.slice(2, -2);
                    // Color based on content
                    const isPositive = /📈|DEPLOY|Excellent|Good|Positive|\+\d/.test(inner);
                    const isNegative = /📉|REJECT|Poor|Negative|HIGH|Unacceptable|-\d/.test(inner);

                    return (
                        <span
                            key={i}
                            className={`font-bold ${isPositive ? 'text-emerald-400' :
                                    isNegative ? 'text-red-400' :
                                        'text-white'
                                }`}
                        >
                            {inner}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

/**
 * Render grade with appropriate emoji color
 */
function GradeRenderer({ grade }: { grade: string }) {
    if (grade.includes('🟢') || grade.includes('Excellent') || grade.includes('Good')) {
        return <span className="text-emerald-400">{grade}</span>;
    }
    if (grade.includes('🟡') || grade.includes('Average') || grade.includes('Acceptable')) {
        return <span className="text-amber-400">{grade}</span>;
    }
    if (grade.includes('🔴') || grade.includes('Poor') || grade.includes('Losing')) {
        return <span className="text-red-400">{grade}</span>;
    }
    if (grade.includes('🟣') || grade.includes('Superb')) {
        return <span className="text-purple-400">{grade}</span>;
    }
    if (grade.includes('🚨')) {
        return <span className="text-red-500 animate-pulse">{grade}</span>;
    }
    return <span className="text-slate-400">{grade}</span>;
}
