import React from 'react';

export function Skeleton({ className = '', variant = 'rect' }) {
    const baseClasses = "relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 animate-pulse";
    const roundedClasses = 
        variant === 'circle' ? 'rounded-full' :
        variant === 'pill' ? 'rounded-full' :
        'rounded-2xl';

    return <div className={`${baseClasses} ${roundedClasses} ${className}`} />;
}

export function ServiceCardSkeleton() {
    return (
        <div className="card p-0 overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800/80">
            {/* Thumbnail banner skeleton */}
            <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 animate-pulse relative">
                <div className="absolute top-3 left-3 w-20 h-6 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <div className="absolute bottom-3 right-3 w-16 h-7 bg-slate-300 dark:bg-slate-700 rounded-xl" />
            </div>
            
            {/* Body */}
            <div className="p-5 flex flex-col flex-1 gap-3">
                <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                
                <div className="flex items-center gap-2.5 my-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="w-12 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export function OrderRowSkeleton() {
    return (
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-900 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2">
                    <div className="w-36 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
            </div>
            <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
    );
}
