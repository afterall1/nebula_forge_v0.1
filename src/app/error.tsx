'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Nebula Forge] Error:', error);
    }, [error]);

    return (
        <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-200 mb-2">
                    Something went wrong!
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                    {error.message || 'An unexpected error occurred'}
                </p>
                <button
                    onClick={() => reset()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 
                               text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        </div>
    );
}
