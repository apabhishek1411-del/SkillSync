import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Plus, 
    TrendingUp, 
    IndianRupee, 
    Star, 
    Package, 
    Briefcase, 
    ShoppingBag, 
    MessageCircle, 
    ArrowRight,
    Sparkles,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { servicesAPI, ordersAPI } from '../lib/api';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import { Skeleton, OrderRowSkeleton } from '../components/Skeleton';

const STATUS_CONFIG = {
    pending:     { label: 'Pending',     bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/50' },
    accepted:    { label: 'Accepted',    bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/50' },
    in_progress: { label: 'In Progress', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50' },
    delivered:   { label: 'Delivered',   bg: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800/50' },
    completed:   { label: 'Completed',   bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' },
    cancelled:   { label: 'Cancelled',   bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/50' },
    rejected:    { label: 'Rejected',    bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/50' },
    approved:    { label: 'Live Service', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' },
};

function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status?.toLowerCase()] || {
        label: status?.replace('_', ' ') || 'Unknown',
        bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {config.label}
        </span>
    );
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [recentServices, setRecentServices] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [svc, ord] = await Promise.all([
                servicesAPI.getMyServices({ page: 1, page_size: 4 }),
                ordersAPI.listOrders({ role: 'all', page: 1, page_size: 5 })
            ]);
            setRecentServices(svc.data.items || []);
            setRecentOrders(ord.data.items || []);
            setStats({
                totalServices: svc.data.total || 0,
                totalOrders: ord.data.total || 0,
                earnings: user?.total_earnings || 0,
                rating: user?.average_rating || 0,
            });
        } catch (err) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const firstName = user?.full_name?.split(' ')[0] || 'there';

    const STAT_CARDS = [
        { 
            icon: Package, 
            label: 'My Listings', 
            value: stats?.totalServices ?? '—', 
            badge: 'Active gigs', 
            color: 'from-primary-500 to-indigo-600', 
            iconColor: 'text-primary-600 dark:text-primary-400' 
        },
        { 
            icon: TrendingUp, 
            label: 'Total Orders', 
            value: stats?.totalOrders ?? '—', 
            badge: 'Jobs placed/received', 
            color: 'from-emerald-500 to-teal-600', 
            iconColor: 'text-emerald-600 dark:text-emerald-400' 
        },
        { 
            icon: IndianRupee, 
            label: 'Total Earnings', 
            value: stats ? `₹${Number(stats.earnings).toLocaleString('en-IN')}` : '—', 
            badge: 'Credited payouts', 
            color: 'from-amber-500 to-orange-500', 
            iconColor: 'text-amber-600 dark:text-amber-400' 
        },
        { 
            icon: Star, 
            label: 'Peer Rating', 
            value: stats?.rating > 0 ? `${stats.rating.toFixed(1)} ★` : '5.0 ★', 
            badge: user?.total_reviews ? `${user.total_reviews} reviews` : 'Top Rated', 
            color: 'from-rose-500 to-pink-600', 
            iconColor: 'text-rose-600 dark:text-rose-400' 
        },
    ];

    const QUICK_ACTIONS = [
        { label: 'Browse Marketplace', desc: 'Find campus peers', icon: Briefcase, to: '/services', color: 'text-primary-600 dark:text-primary-400', border: 'hover:border-primary-500/50' },
        { label: 'My Orders & Jobs', desc: 'Track deliverables', icon: ShoppingBag, to: '/orders', color: 'text-emerald-600 dark:text-emerald-400', border: 'hover:border-emerald-500/50' },
        { label: 'Publish New Skill', desc: 'Offer a micro-service', icon: Plus, to: '/services/create', color: 'text-amber-600 dark:text-amber-400', border: 'hover:border-amber-500/50' },
        { label: 'Chat & Inbox', desc: 'Coordinate orders', icon: MessageCircle, to: '/messages', color: 'text-violet-600 dark:text-violet-400', border: 'hover:border-violet-500/50' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Welcome Header Card ── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-700 dark:from-surface-900 dark:via-primary-950 dark:to-surface-900 p-6 sm:p-8 text-white shadow-card-lg border border-white/10">
                {/* Decorative background blurs */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-violet-400/20 rounded-full blur-2xl translate-y-1/2 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-900 font-display font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                            {initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/80 text-sm font-semibold">Campus Command Center</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            </div>
                            <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-0.5">
                                Welcome back, {firstName}!
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {user?.department && (
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/15 backdrop-blur-md text-white border border-white/20">
                                        {user.department} {user.semester ? `· Sem ${user.semester}` : ''}
                                    </span>
                                )}
                                {user?.student_id && (
                                    <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/15">
                                        ID: {user.student_id}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <Link
                        to="/services/create"
                        className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-surface-800 text-primary-700 dark:text-primary-300 rounded-2xl font-bold text-sm shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                        <Plus size={18} /> Offer New Skill
                    </Link>
                </div>
            </div>

            {/* ── Metric Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map(({ icon: Icon, label, value, badge, iconColor }, i) => (
                    <div 
                        key={i} 
                        className="card p-5 border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-surface-900 rounded-3xl hover:-translate-y-1 transition-transform shadow-xs"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {label}
                            </span>
                            <div className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-surface-800 flex items-center justify-center ${iconColor}`}>
                                <Icon size={18} />
                            </div>
                        </div>
                        <div className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white mb-1">
                            {loading ? <Skeleton className="w-20 h-7" /> : value}
                        </div>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            {badge}
                        </span>
                    </div>
                ))}
            </div>

            {/* ── Quick Navigation Shortcuts ── */}
            <div>
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">
                    Quick Shortcuts
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    {QUICK_ACTIONS.map(({ label, desc, icon: Icon, to, color, border }, i) => (
                        <Link 
                            key={i} 
                            to={to} 
                            className={`p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200/70 dark:border-slate-800/80 ${border} hover:shadow-md transition-all group flex items-start gap-3`}
                        >
                            <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-surface-800 flex items-center justify-center ${color} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                <Icon size={20} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                    {label}
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                    {desc}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── 2-Column Split: Active Orders & Published Services ── */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent / Active Orders */}
                <div className="card p-6 border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-surface-900 rounded-3xl">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                                Active Orders & Jobs
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Your ongoing deliverables & requests
                            </p>
                        </div>
                        <Link 
                            to="/orders" 
                            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                        >
                            View All <ArrowRight size={13} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            <OrderRowSkeleton />
                            <OrderRowSkeleton />
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <EmptyState
                            icon={ShoppingBag}
                            title="No orders yet"
                            description="No active orders or job requests at this time."
                            actionLabel="Browse Marketplace"
                            actionTo="/services"
                            className="py-8"
                        />
                    ) : (
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <Link 
                                    key={order.id} 
                                    to={`/orders/${order.id}`}
                                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-primary-500/40 dark:hover:border-primary-500/40 bg-slate-50/50 dark:bg-surface-950/40 hover:bg-white dark:hover:bg-surface-850 transition-all group"
                                >
                                    <div className="min-w-0 pr-3">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                            {order.service?.title || order.service_title || 'Campus Micro-Job'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            <span>
                                                {order.client_id === user?.id ? 'You hired' : 'Client hired you'}
                                            </span>
                                            <span>·</span>
                                            <span className="font-bold text-slate-900 dark:text-slate-200">
                                                ₹{Number(order.agreed_price).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* My Listed Services */}
                <div className="card p-6 border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-surface-900 rounded-3xl">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                                My Skill Listings
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Services you are offering to the campus
                            </p>
                        </div>
                        <Link 
                            to="/services" 
                            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                        >
                            Explore All <ArrowRight size={13} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            <OrderRowSkeleton />
                            <OrderRowSkeleton />
                        </div>
                    ) : recentServices.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="No services published"
                            description="Create your first service listing to start offering your skills to the campus community."
                            actionLabel="Create Service"
                            actionTo="/services/create"
                            className="py-8"
                        />
                    ) : (
                        <div className="space-y-3">
                            {recentServices.map((svc) => (
                                <Link 
                                    key={svc.id} 
                                    to={`/services/${svc.id}`}
                                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-primary-500/40 dark:hover:border-primary-500/40 bg-slate-50/50 dark:bg-surface-950/40 hover:bg-white dark:hover:bg-surface-850 transition-all group"
                                >
                                    <div className="min-w-0 pr-3">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                            {svc.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-bold text-slate-900 dark:text-slate-200">
                                                ₹{Number(svc.price).toLocaleString('en-IN')}
                                            </span>
                                            <span>·</span>
                                            <span>{svc.order_count || 0} orders</span>
                                            <span>·</span>
                                            <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                                                <Star size={11} fill="currentColor" /> {svc.average_rating ? Number(svc.average_rating).toFixed(1) : 'New'}
                                            </span>
                                        </div>
                                    </div>
                                    <StatusBadge status={svc.status} />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
