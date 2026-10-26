import { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Star, Package, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function BarChart({ data }) {
    const max = Math.max(...data.map(d => d.amount), 1);
    return (
        <div className="flex items-end gap-2 h-44 mt-2">
            {data.map((d, i) => (
                <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group">
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.amount > 0 ? `₹${d.amount}` : ''}
                    </span>
                    <div
                        className="w-full bg-gradient-to-t from-primary-600 to-violet-500 rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max((d.amount / max) * 100, d.amount > 0 ? 8 : 2)}%` }}
                    />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{d.month}</span>
                </div>
            ))}
        </div>
    );
}

export default function EarningsPage() {
    const { user }  = useAuthStore();
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ordersAPI.listOrders({ role: 'provider', page: 1, page_size: 100 })
            .then(res => setOrders(res.data.items))
            .catch(() => toast.error('Failed to load earnings data'))
            .finally(() => setLoading(false));
    }, []);

    const completedOrders = orders.filter(o => o.status === 'completed' && o.payment_status === 'paid');
    const activeOrders    = orders.filter(o => ['accepted','in_progress','delivered'].includes(o.status));
    const pendingEarnings = activeOrders.reduce((s, o) => s + parseFloat(o.agreed_price || 0), 0);
    const totalEarned     = completedOrders.reduce((s, o) => s + parseFloat(o.agreed_price || 0), 0);
    const avgOrderValue   = completedOrders.length > 0 ? totalEarned / completedOrders.length : 0;

    // Last 6 months bar chart data
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const amount = completedOrders
            .filter(o => {
                const c = new Date(o.completed_at || o.updated_at);
                return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
            })
            .reduce((s, o) => s + parseFloat(o.agreed_price || 0), 0);
        return { month: MONTHS[d.getMonth()], amount };
    });

    // Top services by earnings
    const serviceMap = {};
    completedOrders.forEach(o => {
        const title = o.service_title || o.service?.title || 'Unknown';
        if (!serviceMap[title]) serviceMap[title] = { title, count: 0, total: 0 };
        serviceMap[title].count++;
        serviceMap[title].total += parseFloat(o.agreed_price || 0);
    });
    const topServices = Object.values(serviceMap).sort((a, b) => b.total - a.total).slice(0, 5);

    if (loading) return (
        <div className="flex justify-center items-center py-32">
            <div className="spinner w-12 h-12" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Earnings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Your provider revenue dashboard</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: IndianRupee, label: 'Total Earned',     value: `₹${totalEarned.toFixed(0)}`,    bg: 'from-emerald-500 to-teal-600',   desc: 'All time'         },
                    { icon: Clock,       label: 'Pending Earnings', value: `₹${pendingEarnings.toFixed(0)}`, bg: 'from-amber-500 to-orange-500',   desc: 'Active orders'    },
                    { icon: Package,     label: 'Jobs Completed',   value: completedOrders.length,           bg: 'from-primary-500 to-violet-600', desc: 'Paid orders'      },
                    { icon: Star,        label: 'Avg Job Value',    value: `₹${avgOrderValue.toFixed(0)}`,   bg: 'from-rose-500 to-pink-600',      desc: 'Per completed job'},
                ].map(card => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="card text-center p-5 bg-white dark:bg-surface-850 border border-gray-100 dark:border-gray-800">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.bg} flex items-center justify-center mx-auto mb-3`}>
                                <Icon size={20} className="text-white" />
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{card.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">{card.label}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.desc}</p>
                        </div>
                    );
                })}
            </div>

            {/* Chart + top services */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="card bg-white dark:bg-surface-850 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="font-bold text-gray-900 dark:text-white">Monthly Earnings</h2>
                        <span className="text-xs text-gray-400 dark:text-gray-500">Last 6 months</span>
                    </div>
                    {monthlyData.every(d => d.amount === 0) ? (
                        <div className="h-36 flex items-center justify-center">
                            <p className="text-sm text-gray-300 dark:text-gray-600">No completed orders yet</p>
                        </div>
                    ) : (
                        <BarChart data={monthlyData} />
                    )}
                </div>

                <div className="card bg-white dark:bg-surface-850 border border-gray-100 dark:border-gray-800">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-4">Top Earning Services</h2>
                    {topServices.length === 0 ? (
                        <div className="h-36 flex items-center justify-center">
                            <p className="text-sm text-gray-300 dark:text-gray-600">No earnings yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topServices.map((svc, i) => (
                                <div key={svc.title} className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{svc.title}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{svc.count} order{svc.count > 1 ? 's' : ''}</p>
                                    </div>
                                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 flex-shrink-0">₹{svc.total.toFixed(0)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent payments */}
            <div className="card bg-white dark:bg-surface-850 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 dark:text-white">Recent Payments Received</h2>
                    <Link to="/orders" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold flex items-center gap-1">
                        View all <ArrowUpRight size={14} />
                    </Link>
                </div>
                {completedOrders.length === 0 ? (
                    <div className="text-center py-10">
                        <TrendingUp size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-400 dark:text-gray-500 text-sm">No earnings yet. Complete orders to see them here.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {completedOrders.slice(0, 8).map(order => (
                            <Link key={order.id} to={`/orders/${order.id}`}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {order.service_title || order.service?.title}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {order.client?.full_name} · {new Date(order.completed_at || order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-base font-black text-emerald-700 dark:text-emerald-400 flex-shrink-0 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                                    ₹{order.agreed_price}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
