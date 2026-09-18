import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
    Search, 
    ArrowUpDown, 
    Plus, 
    SlidersHorizontal, 
    X, 
    Sparkles, 
    ChevronDown, 
    RefreshCw,
    Filter
} from 'lucide-react';
import { servicesAPI, skillsAPI } from '../lib/api';
import toast from 'react-hot-toast';
import ServiceCard from '../components/ServiceCard';
import { ServiceCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const SORT_OPTIONS = [
    { label: 'Newest First',        sort_by: 'created_at',     sort_order: 'desc' },
    { label: 'Oldest First',        sort_by: 'created_at',     sort_order: 'asc'  },
    { label: 'Price: Low to High',  sort_by: 'price',          sort_order: 'asc'  },
    { label: 'Price: High to Low',  sort_by: 'price',          sort_order: 'desc' },
    { label: 'Rating: High to Low', sort_by: 'average_rating', sort_order: 'desc' },
    { label: 'Most Popular',        sort_by: 'order_count',    sort_order: 'desc' },
];

const DELIVERY_OPTIONS = [
    { label: 'Any Delivery Time', value: null },
    { label: 'Express (1 day)', value: 1 },
    { label: 'Up to 3 days', value: 3 },
    { label: 'Up to 7 days', value: 7 },
    { label: 'Up to 14 days', value: 14 },
];

const RATING_OPTIONS = [
    { label: 'Any Rating', value: null },
    { label: '4.0 ★ & above', value: 4 },
    { label: '4.5 ★ & above', value: 4.5 },
];

export default function ServicesPage() {
    const [services, setServices]           = useState([]);
    const [categories, setCategories]       = useState([]);
    const [loading, setLoading]             = useState(true);
    const [search, setSearch]               = useState('');
    const [searchInput, setSearchInput]     = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [page, setPage]                   = useState(1);
    const [totalPages, setTotalPages]       = useState(1);
    const [total, setTotal]                 = useState(0);
    const [showSort, setShowSort]           = useState(false);
    const [showFilters, setShowFilters]     = useState(false);
    const [sortBy, setSortBy]               = useState('created_at');
    const [sortOrder, setSortOrder]         = useState('desc');

    // Filter state
    const [minPrice, setMinPrice]           = useState('');
    const [maxPrice, setMaxPrice]           = useState('');
    const [maxDelivery, setMaxDelivery]     = useState(null);
    const [minRating, setMinRating]         = useState(null);

    const sortRef = useRef(null);

    const activeFilterCount = [minPrice, maxPrice, maxDelivery, minRating].filter(v => v !== null && v !== '').length;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        skillsAPI.getCategories().then(r => setCategories(r.data.items || [])).catch(() => {});
    }, []);

    useEffect(() => {
        loadServices();
    }, [page, selectedCategory, search, sortBy, sortOrder, minPrice, maxPrice, maxDelivery, minRating]);

    const loadServices = async () => {
        setLoading(true);
        try {
            const params = { page, page_size: 12, sort_by: sortBy, sort_order: sortOrder };
            if (search) params.search = search;
            if (selectedCategory) params.category_id = selectedCategory;
            if (minPrice !== '') params.min_price = parseFloat(minPrice);
            if (maxPrice !== '') params.max_price = parseFloat(maxPrice);
            if (maxDelivery !== null) params.max_delivery_days = maxDelivery;
            if (minRating !== null) params.min_rating = minRating;
            const res = await servicesAPI.listServices(params);
            setServices(res.data.items || []);
            setTotalPages(res.data.pages || 1);
            setTotal(res.data.total || 0);
        } catch {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    };

    const clearSearch = () => {
        setSearchInput('');
        setSearch('');
        setPage(1);
    };

    const clearAllFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setMaxDelivery(null);
        setMinRating(null);
        setSearch('');
        setSearchInput('');
        setSelectedCategory('');
        setPage(1);
    };

    const currentSortLabel = SORT_OPTIONS.find(o => o.sort_by === sortBy && o.sort_order === sortOrder)?.label || 'Sort';
    const hasActiveFilters = search || selectedCategory || minPrice || maxPrice || maxDelivery || minRating;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                            Campus Gigs & Skills
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    </div>
                    <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight mt-0.5">
                        Browse Services
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {total > 0 ? `${total} verified services offered by peers` : 'Discover student services across departments'}
                    </p>
                </div>

                <Link
                    to="/services/create"
                    className="btn-primary py-3 px-5 rounded-2xl text-sm font-bold shadow-md shadow-primary-500/20 whitespace-nowrap"
                >
                    <Plus size={18} /> Offer a Service
                </Link>
            </div>

            {/* ── Search & Filter Control Bar ── */}
            <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200/70 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Try 'resume design', 'python help', or 'lab report'..."
                            className="w-full pl-11 pr-10 py-2.5 sm:py-3 bg-slate-50 dark:bg-surface-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>
                    <button type="submit" className="btn-primary px-5 py-2.5 rounded-2xl text-sm font-bold shadow-xs">
                        Search
                    </button>
                </form>

                {/* Filter and Sort Toggles */}
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${
                            activeFilterCount > 0 || showFilters
                                ? 'border-primary-500 text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-950/60 shadow-xs'
                                : 'border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-surface-850 hover:border-slate-300'
                        }`}
                    >
                        <SlidersHorizontal size={15} />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[11px] font-black flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Sort Dropdown */}
                    <div className="relative" ref={sortRef}>
                        <button
                            type="button"
                            onClick={() => setShowSort(!showSort)}
                            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-surface-850 hover:border-slate-300 text-sm font-semibold transition-all"
                        >
                            <ArrowUpDown size={15} />
                            <span className="hidden sm:inline">{currentSortLabel}</span>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>

                        {showSort && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-1.5 z-50 animate-fade-in">
                                <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Sort Results
                                </p>
                                {SORT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => {
                                            setSortBy(opt.sort_by);
                                            setSortOrder(opt.sort_order);
                                            setPage(1);
                                            setShowSort(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                                            sortBy === opt.sort_by && sortOrder === opt.sort_order
                                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-400 font-bold'
                                                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-surface-800'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Slide Filter Panel ── */}
            {showFilters && (
                <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200/80 dark:border-slate-800 shadow-xs animate-fade-in">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                            <SlidersHorizontal size={16} className="text-primary-600 dark:text-primary-400" />
                            Filter Criteria
                        </h3>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                            >
                                <X size={13} /> Reset Filters
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Price Range */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                Price Range (₹)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                                    min="0"
                                />
                                <span className="text-slate-400 text-xs">—</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Delivery Time */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                Turnaround Time
                            </label>
                            <div className="space-y-1.5">
                                {DELIVERY_OPTIONS.map(opt => (
                                    <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                                        <input
                                            type="radio"
                                            name="delivery"
                                            className="accent-primary-600"
                                            checked={maxDelivery === opt.value}
                                            onChange={() => { setMaxDelivery(opt.value); setPage(1); }}
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Min Rating */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                Minimum Peer Rating
                            </label>
                            <div className="space-y-1.5">
                                {RATING_OPTIONS.map(opt => (
                                    <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                                        <input
                                            type="radio"
                                            name="rating"
                                            className="accent-primary-600"
                                            checked={minRating === opt.value}
                                            onChange={() => { setMinRating(opt.value); setPage(1); }}
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                Budget Presets
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Under ₹500',   min: '',     max: '500' },
                                    { label: '₹500–₹1000',  min: '500',  max: '1000' },
                                    { label: '₹1000–₹2500', min: '1000', max: '2500' },
                                    { label: '₹2500+',      min: '2500', max: '' },
                                ].map(preset => (
                                    <button
                                        key={preset.label}
                                        onClick={() => { setMinPrice(preset.min); setMaxPrice(preset.max); setPage(1); }}
                                        className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                                            minPrice === preset.min && maxPrice === preset.max
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-400'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Category Pill Navigation Carousel ── */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                    onClick={() => { setSelectedCategory(''); setPage(1); }}
                    className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                        !selectedCategory
                            ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                            : 'bg-white dark:bg-surface-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary-400'
                    }`}
                >
                    All Categories
                </button>

                {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                                isSelected
                                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                                    : 'bg-white dark:bg-surface-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary-400'
                            }`}
                        >
                            <span 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: isSelected ? '#FFFFFF' : (cat.color || '#6366F1') }} 
                            />
                            {cat.name}
                        </button>
                    );
                })}
            </div>

            {/* ── Active Filter Badges ── */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Active Filters:</span>
                    {search && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/50">
                            Search: "{search}"
                            <button onClick={clearSearch}><X size={12} /></button>
                        </span>
                    )}
                    {minPrice && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/50">
                            Min ₹{minPrice}
                            <button onClick={() => setMinPrice('')}><X size={12} /></button>
                        </span>
                    )}
                    {maxPrice && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/50">
                            Max ₹{maxPrice}
                            <button onClick={() => setMaxPrice('')}><X size={12} /></button>
                        </span>
                    )}
                    {maxDelivery && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/50">
                            ≤ {maxDelivery}d delivery
                            <button onClick={() => setMaxDelivery(null)}><X size={12} /></button>
                        </span>
                    )}
                    {minRating && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/50">
                            ≥ {minRating}★
                            <button onClick={() => setMinRating(null)}><X size={12} /></button>
                        </span>
                    )}
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-bold text-red-500 hover:underline ml-1"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* ── Services Grid / Loading / Empty State ── */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <ServiceCardSkeleton key={i} />
                    ))}
                </div>
            ) : services.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No matching services found"
                    description="No services found matching your current search criteria or filters."
                    actionLabel="Reset All Filters"
                    onAction={clearAllFilters}
                    className="py-16"
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {services.map(svc => (
                            <ServiceCard key={svc.id} service={svc} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 pt-6">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="btn-secondary py-2 px-4 rounded-xl text-xs font-semibold disabled:opacity-40"
                            >
                                ← Previous
                            </button>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="btn-secondary py-2 px-4 rounded-xl text-xs font-semibold disabled:opacity-40"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
