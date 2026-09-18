import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Clock, CheckCircle, XCircle, Package, RotateCcw, AlertTriangle,
    ShoppingBag, IndianRupee, ChevronRight, Calendar, Search
} from 'lucide-react';
import { ordersAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import { OrderRowSkeleton } from '../components/Skeleton';

const STATUS_CONFIG = {
    pending:     { label: 'Pending',     badge: 'badge-warning', dot: 'bg-amber-400',   icon: Clock         },
    accepted:    { label: 'Accepted',    badge: 'badge-info',    dot: 'bg-blue-400',    icon: CheckCircle   },
    in_progress: { label: 'In Progress', badge: 'badge-info',    dot: 'bg-blue-400',    icon: Package       },
    delivered:   { label: 'Delivered',   badge: 'badge-purple',  dot: 'bg-violet-400',  icon: Package       },
    revision:    { label: 'Revision',    badge: 'badge-warning', dot: 'bg-amber-400',   icon: RotateCcw     },
    completed:   { label: 'Completed',   badge: 'badge-success', dot: 'bg-emerald-400', icon: CheckCircle   },
    cancelled:   { label: 'Cancelled',   badge: 'badge-danger',  dot: 'bg-red-400',     icon: XCircle       },
    rejected:    { label: 'Rejected',    badge: 'badge-danger',  dot: 'bg-red-400',     icon: XCircle       },
    disputed:    { label: 'Disputed',    badge: 'badge-danger',  dot: 'bg-red-400',     icon: AlertTriangle },
};

const PAY_CONFIG = {
    pending:  { label: 'Unpaid',   badge: 'badge-warning' },
    paid:     { label: 'Paid',     badge: 'badge-success' },
    refunded: { label: 'Refunded', badge: 'badge-gray'    },
};

const ROLE_FILTERS = [
    { key: 'all',      label: 'All Jobs'    },
    { key: 'client',   label: 'As Client'   },
    { key: 'provider', label: 'As Provider' },
];

const STATUS_FILTERS = [
    { key: '',            label: 'All'         },
    { key: 'pending',     label: 'Pending'     },
    { key: 'accepted',    label: 'Accepted'    },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'delivered',   label: 'Delivered'   },
    { key: 'completed',   label: 'Completed'   },
    { key: 'cancelled',   label: 'Cancelled'   },
];

function OrderCard({ order, currentUserId }) {
    const isClient = order.client_id === currentUserId;
    const cfg      = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const payCfg   = PAY_CONFIG[order.payment_status] || PAY_CONFIG.pending;
    const Icon     = cfg.icon;
    const other    = isClient ? order.provider : order.client;

    const createdAt  = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const deliveryAt = order.expected_delivery
        ? new Date(order.expected_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : null;

    return (
        <Link
            to={`/orders/${order.id}`}
            className="card hover:shadow-card-lg hover:-translate-y-0.5 transition-all duration-200 p-0 overflow-hidden block dark:bg-surface-850 dark:border-gray-800"
        >
            {/* Coloured accent bar */}
            <div className={`h-1 w-full ${cfg.dot}`} />

            <div className="p-5">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight line-clamp-1">
                            {order.service?.title || order.service_title || 'Service'}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">#{order.order_number}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`badge ${cfg.badge} gap-1`}>
                            <Icon size={11} />
                            {cfg.label}
                        </span>
                        {order.payment_status === 'paid' && (
                            <span className={`badge ${payCfg.badge} text-[10px]`}>{payCfg.label}</span>
                        )}
                    </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                        {/* Counterparty avatar + name */}
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                                {other?.full_name?.charAt(0) || '?'}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[110px] truncate">
                                {isClient ? 'By ' : 'For '}<span className="font-semibold text-gray-900 dark:text-white">{other?.full_name}</span>
                            </span>
                        </div>

                        {/* Created date */}
                        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                            <Calendar size={12} />
                            {createdAt}
                        </div>

                        {/* Expected delivery */}
                        {deliveryAt && (
                            <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                <Clock size={12} />
                                Due {deliveryAt}
                            </div>
                        )}
                    </div>

                    {/* Price + chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-base font-black text-primary-700 dark:text-primary-400">₹{order.agreed_price}</p>
                        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                    </div>
                </div>

                {/* Action hint banners */}
                {order.status === 'delivered' && isClient && order.payment_status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-900/30">
                        <p className="text-xs text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-1">
                            <IndianRupee size={12} /> Payment required to complete this order
                        </p>
                    </div>
                )}
                {order.status === 'pending' && !isClient && (
                    <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/30">
                        <p className="text-xs text-blue-600 dark:text-blue-500 font-semibold">⏳ Waiting for your response</p>
                    </div>
                )}
            </div>
        </Link>
    );
}

export default function OrdersPage() {
    const { user }  = useAuthStore();
    const [orders, setOrders]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [roleFilter, setRoleFilter]   = useState('all');
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch]           = useState('');

    useEffect(() => { loadOrders(); }, [roleFilter, statusFilter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const params = { role: roleFilter, page: 1, page_size: 50 };
            if (statusFilter) params.order_status = statusFilter;
            const res = await ordersAPI.listOrders(params);
            setOrders(res.data.items);
        } catch {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    // Client-side keyword search
    const filtered = orders.filter(o => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            (o.service_title || o.service?.title || '').toLowerCase().includes(q) ||
            (o.order_number || '').toLowerCase().includes(q) ||
            (o.provider?.full_name || '').toLowerCase().includes(q) ||
            (o.client?.full_name || '').toLowerCase().includes(q)
        );
    });

    // Quick stats
    const total     = orders.length;
    const active    = orders.filter(o => ['pending','accepted','in_progress','delivered'].includes(o.status)).length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const needsAction = orders.filter(o =>
        (o.status === 'pending'   && o.provider_id === user.id) ||
        (o.status === 'delivered' && o.client_id === user.id && o.payment_status === 'pending')
    ).length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">My Jobs</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your orders and deliveries</p>
                </div>
                <Link to="/services" className="btn-outline text-sm whitespace-nowrap">
                    <ShoppingBag size={16} /> Browse Services
                </Link>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total',     value: total,     color: 'text-gray-900 dark:text-white',    bg: 'bg-gray-50 dark:bg-surface-850',    border: 'border-gray-200 dark:border-gray-800'    },
                    { label: 'Active',    value: active,    color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-200 dark:border-blue-900/30'    },
                    { label: 'Completed', value: completed, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-900/30' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Needs attention banner */}
            {needsAction > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                        {needsAction} order{needsAction > 1 ? 's' : ''} need{needsAction === 1 ? 's' : ''} your attention
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="space-y-3">
                {/* Role tabs */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit">
                    {ROLE_FILTERS.map(f => (
                        <button key={f.key} onClick={() => setRoleFilter(f.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                roleFilter === f.key
                                    ? 'bg-white dark:bg-surface-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >{f.label}</button>
                    ))}
                </div>

                {/* Status pills + search */}
                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.map(f => (
                            <button key={f.key} onClick={() => setStatusFilter(f.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                    statusFilter === f.key
                                        ? 'bg-primary-600 text-white border-primary-600 dark:border-primary-600'
                                        : 'bg-white dark:bg-surface-850 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-700'
                                }`}
                            >{f.label}</button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search orders..."
                            className="input-field pl-8 py-2 text-sm w-52 dark:bg-surface-850 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    <OrderRowSkeleton />
                    <OrderRowSkeleton />
                    <OrderRowSkeleton />
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={ShoppingBag}
                    title={orders.length === 0 ? "No campus jobs yet" : "No orders match your filter"}
                    description={orders.length === 0 ? "Explore the marketplace and commission your first service." : "No orders match your current filters. Please adjust your criteria."}
                    actionLabel={orders.length === 0 ? "Browse Services" : "Reset Filters"}
                    actionTo={orders.length === 0 ? "/services" : undefined}
                    onAction={orders.length === 0 ? undefined : () => { setRoleFilter('all'); setStatusFilter(''); setSearch(''); }}
                    className="py-16"
                />
            ) : (
                <div className="space-y-3">
                    {filtered.map(order => (
                        <OrderCard key={order.id} order={order} currentUserId={user.id} />
                    ))}
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
                        Showing {filtered.length} of {orders.length} orders
                    </p>
                </div>
            )}
        </div>
    );
}
