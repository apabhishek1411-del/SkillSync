import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, ShieldCheck, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default function ServiceCard({ service }) {
    if (!service) return null;

    const hasThumbnail = !!service.thumbnail;
    const providerName = service.provider?.full_name || 'Campus Peer';
    const initials = providerName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const categoryName = service.skill?.category_name || service.skill?.name || 'Skill';

    return (
        <Link
            to={`/services/${service.id}`}
            className="group relative card p-0 overflow-hidden flex flex-col border border-slate-200/70 dark:border-slate-800/90 hover:border-primary-500/40 dark:hover:border-primary-500/40 hover:shadow-card-lg dark:hover:shadow-glow/10 transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-surface-900 rounded-3xl"
        >
            {/* Top Media / Thumbnail */}
            <div className="relative w-full h-44 bg-gradient-to-br from-indigo-900/10 via-primary-500/10 to-violet-500/20 dark:from-surface-850 dark:to-surface-800 flex-shrink-0 overflow-hidden">
                {hasThumbnail ? (
                    <img
                        src={`${API_BASE}${service.thumbnail}`}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-violet-600 flex items-center justify-center text-white font-display font-bold text-2xl shadow-lg shadow-primary-500/25 group-hover:scale-110 transition-transform duration-300">
                            {service.title?.charAt(0) || 'S'}
                        </div>
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-3 py-1 rounded-full border border-primary-200/50 dark:border-primary-800/40">
                            {categoryName}
                        </span>
                    </div>
                )}

                {/* Category Chip (when image exists) */}
                {hasThumbnail && (
                    <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/15">
                        {categoryName}
                    </div>
                )}

                {/* Price Badge */}
                <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-surface-900/95 backdrop-blur-md text-slate-900 dark:text-white font-display font-bold text-sm px-3 py-1.5 rounded-xl shadow-md border border-slate-100 dark:border-slate-800 flex items-center gap-1 group-hover:scale-105 transition-transform">
                    <span className="text-xs text-primary-600 dark:text-primary-400">₹</span>
                    <span>{service.price ? Number(service.price).toLocaleString('en-IN') : 'Free'}</span>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex flex-col flex-1">
                {/* Title */}
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-2 line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {service.title}
                </h3>

                {/* Short Description or Excerpt */}
                {service.short_description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {service.short_description}
                    </p>
                )}

                {/* Provider Pill */}
                <div className="flex items-center gap-2.5 my-2 pt-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                        {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                            <span className="truncate">{providerName}</span>
                            <ShieldCheck size={13} className="text-emerald-500 flex-shrink-0" />
                        </div>
                    </div>
                </div>

                {/* Footer Meta: Rating & Delivery */}
                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="font-bold text-slate-900 dark:text-white">
                            {service.average_rating ? Number(service.average_rating).toFixed(1) : 'New'}
                        </span>
                        {service.total_reviews > 0 && (
                            <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                                ({service.total_reviews})
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1 font-medium">
                        <Clock size={13} className="text-slate-400" />
                        <span>{service.delivery_time_days || 1}d delivery</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
