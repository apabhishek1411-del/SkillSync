import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Info, ShoppingBag, CreditCard, Star, MessageCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationsAPI } from '../lib/api';

const TYPE_ICONS = {
    order_placed:    { icon: ShoppingBag,    bg: 'bg-blue-100 dark:bg-blue-900/30',    color: 'text-blue-600 dark:text-blue-400'    },
    order_accepted:  { icon: CheckCheck,     bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
    order_rejected:  { icon: X,              bg: 'bg-red-100 dark:bg-red-900/30',     color: 'text-red-600 dark:text-red-400'     },
    order_delivered: { icon: ShoppingBag,    bg: 'bg-violet-100 dark:bg-violet-900/30',  color: 'text-violet-600 dark:text-violet-400'  },
    payment_received:{ icon: CreditCard,     bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
    review_received: { icon: Star,           bg: 'bg-amber-100 dark:bg-amber-900/30',   color: 'text-amber-600 dark:text-amber-400'   },
    new_message:     { icon: MessageCircle,  bg: 'bg-blue-100 dark:bg-blue-900/30',    color: 'text-blue-600 dark:text-blue-400'    },
    default:         { icon: Info,           bg: 'bg-gray-100 dark:bg-gray-800',    color: 'text-gray-600 dark:text-gray-400'    },
};

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const [open, setOpen]                   = useState(false);
    const panelRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await notificationsAPI.getAll();
            setNotifications(res.data.items);
            setUnreadCount(res.data.unread_count);
        } catch (_) {}
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 20000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => setOpen(o => !o);

    const markAllRead = async () => {
        await notificationsAPI.markAllRead();
        setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const markOneRead = async (id) => {
        await notificationsAPI.markOneRead(id);
        setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={handleOpen}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-surface-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-surface-800 transition-all border border-slate-200/60 dark:border-slate-800/80"
                title="Notifications"
                aria-label="View notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-surface-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 z-50 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-50/80 to-violet-50/80 dark:from-surface-800 dark:to-surface-800 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">Notifications</p>
                            {unreadCount > 0 && <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">{unreadCount} unread</p>}
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead}
                                className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-semibold px-2 py-1 rounded-lg hover:bg-primary-100/60 dark:hover:bg-surface-700 transition-colors">
                                <CheckCheck size={13} /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center">
                                <Bell size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                const cfg = TYPE_ICONS[notif.type] || TYPE_ICONS.default;
                                const Icon = cfg.icon;
                                const content = (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.is_read && markOneRead(notif.id)}
                                        className={`flex gap-3 p-4 border-b border-slate-100 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-surface-800/60 transition-colors cursor-pointer ${
                                            !notif.is_read ? 'bg-primary-50/60 dark:bg-surface-800/50' : ''
                                        }`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                                            <Icon size={17} className={cfg.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm text-slate-900 dark:text-white leading-snug ${!notif.is_read ? 'font-bold' : 'font-medium'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(notif.created_at)}</p>
                                        </div>
                                        {!notif.is_read && (
                                            <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400 flex-shrink-0 mt-1.5 ring-2 ring-primary-200 dark:ring-primary-900" />
                                        )}
                                    </div>
                                );
                                return notif.link
                                    ? <Link to={notif.link} onClick={() => { setOpen(false); if (!notif.is_read) markOneRead(notif.id); }} key={notif.id}>{content}</Link>
                                    : <div key={notif.id}>{content}</div>;
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
