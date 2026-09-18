import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
    icon: Icon = PackageOpen,
    title = 'No items found',
    description = 'No records found matching your current criteria.',
    actionLabel,
    actionTo,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
    className = ''
}) {
    return (
        <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-surface-900/40 backdrop-blur-sm ${className}`}>
            <div className="relative mb-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary-500/10 via-violet-500/10 to-amber-500/10 dark:from-primary-500/20 dark:to-violet-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-500/20 shadow-inner">
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse-slow" strokeWidth={1.75} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400/80 blur-xs" />
            </div>

            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white tracking-tight mb-2">
                {title}
            </h3>
            
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-md mb-6 leading-relaxed">
                {description}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
                {actionLabel && actionTo && (
                    <Link
                        to={actionTo}
                        className="btn-primary text-sm py-2.5 px-5 rounded-xl"
                    >
                        {actionLabel}
                    </Link>
                )}
                
                {actionLabel && onAction && !actionTo && (
                    <button
                        onClick={onAction}
                        className="btn-primary text-sm py-2.5 px-5 rounded-xl"
                    >
                        {actionLabel}
                    </button>
                )}

                {secondaryActionLabel && onSecondaryAction && (
                    <button
                        onClick={onSecondaryAction}
                        className="btn-secondary text-sm py-2.5 px-5 rounded-xl"
                    >
                        {secondaryActionLabel}
                    </button>
                )}
            </div>
        </div>
    );
}
