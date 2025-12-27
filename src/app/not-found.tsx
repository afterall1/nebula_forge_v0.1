import { Hexagon } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-sky-500/20 flex items-center justify-center">
                    <Hexagon className="w-8 h-8 text-sky-500" />
                </div>
                <h1 className="text-6xl font-bold text-slate-200 mb-2">404</h1>
                <h2 className="text-xl text-slate-400 mb-6">
                    Page Not Found
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                    The page you&apos;re looking for doesn&apos;t exist in this dimension.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 
                               text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Return to Forge
                </Link>
            </div>
        </div>
    );
}
