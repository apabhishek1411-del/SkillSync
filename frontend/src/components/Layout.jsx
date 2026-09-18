import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, ShoppingBag, User, LogOut, Shield, MessageCircle, ChevronDown, IndianRupee, Sun, Moon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../lib/api';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

export default function Layout() {
    const { user, logout } = useAuthStore();
    const { theme, toggle: toggleTheme, init: initTheme } = useThemeStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => { initTheme(); }, []);

    useEffect(() => {
        const fetchUnread = () => {
            chatAPI.getUnreadCount().then(res => setUnreadCount(res.data.unread_count)).catch(() => {});
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', icon: Home,          label: 'Dashboard' },
        { path: '/services',  icon: Briefcase,      label: 'Services'  },
        { path: '/orders',    icon: ShoppingBag,    label: 'Jobs'      },
        { path: '/earnings',  icon: IndianRupee,    label: 'Earnings'  },
        { path: '/messages',  icon: MessageCircle,  label: 'Messages'  },
    ];
    if (user?.role === 'admin') navItems.push({ path: '/admin', icon: Shield, label: 'Admin' });

    const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300 relative">
            {/* Ambient Background Glow Mesh */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-5%] left-[10%] w-[500px] h-[500px] rounded-full bg-primary-500/10 dark:bg-primary-600/10 blur-[130px] mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute top-[30%] right-[-5%] w-[450px] h-[450px] rounded-full bg-violet-500/10 dark:bg-violet-600/10 blur-[130px] mix-blend-multiply dark:mix-blend-screen" />
            </div>

            {/* ── Top Header ── */}
            <header className={`sticky top-0 z-40 transition-all duration-200 border-b ${
                scrolled
                    ? 'bg-white/90 dark:bg-surface-950/90 backdrop-blur-xl border-slate-200/80 dark:border-slate-800/80 shadow-xs'
                    : 'bg-white/70 dark:bg-surface-950/70 backdrop-blur-md border-slate-200/50 dark:border-slate-800/50'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/dashboard" className="flex-shrink-0 flex items-center gap-2 group">
                            <div className="block dark:hidden">
                                <Logo variant="dark" size="md" />
                            </div>
                            <div className="hidden dark:block">
                                <Logo variant="light" size="md" />
                            </div>
                            <span className="hidden lg:inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-primary-100/70 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                                CEC Campus
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-surface-900/80 border border-slate-200/60 dark:border-slate-800/80">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                                            isActive
                                                ? 'bg-white dark:bg-surface-800 text-primary-600 dark:text-primary-400 shadow-xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-surface-800/50'
                                        }`}
                                    >
                                        <Icon size={16} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'opacity-75'} />
                                        <span>{item.label}</span>
                                        {item.path === '/messages' && unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.2 min-w-4 h-4 flex items-center justify-center shadow-xs">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 sm:gap-2.5">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-surface-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-surface-800 transition-all border border-slate-200/60 dark:border-slate-800/80"
                                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
                            </button>

                            {/* Notifications */}
                            <NotificationBell />

                            {/* User Profile dropdown */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-2xl bg-slate-100/90 dark:bg-surface-900/90 hover:bg-slate-200/80 dark:hover:bg-surface-800 border border-slate-200/70 dark:border-slate-800/80 transition-all duration-150"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                                        {initials}
                                    </div>
                                    <span className="hidden sm:block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[110px] truncate">
                                        {user?.full_name?.split(' ')[0]}
                                    </span>
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-50 animate-fade-in">
                                        <div className="px-4 py-3 bg-slate-50/80 dark:bg-surface-850/80 border-b border-slate-100 dark:border-slate-800">
                                            <p className="font-display font-bold text-slate-900 dark:text-white text-sm truncate">{user?.full_name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                                            {user?.department && (
                                                <div className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-md border border-primary-200/50 dark:border-primary-900/40">
                                                    {user.department} {user.semester ? `· Sem ${user.semester}` : ''}
                                                </div>
                                            )}
                                        </div>
                                        <div className="py-1.5">
                                            <Link
                                                to="/profile"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                            >
                                                <User size={16} /> My Profile
                                            </Link>
                                            <Link
                                                to="/earnings"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                            >
                                                <IndianRupee size={16} /> Earnings
                                            </Link>
                                            <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                                            >
                                                <LogOut size={16} /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main Page Content ── */}
            <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
                <Outlet />
            </main>

            {/* ── Mobile Floating Bottom Dock ── */}
            <div className="md:hidden fixed bottom-3 inset-x-4 z-40">
                <nav className="flex items-center justify-around bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/90 rounded-2xl shadow-xl px-2 py-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                                    isActive
                                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50/70 dark:bg-primary-950/60 font-bold'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Icon size={18} />
                                <span className="text-[10px] leading-none">{item.label}</span>
                                {item.path === '/messages' && unreadCount > 0 && (
                                    <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* ── Desktop Footer ── */}
            <footer className="hidden md:block relative z-10 border-t border-slate-200/60 dark:border-slate-800/80 mt-auto py-5 text-center text-xs text-slate-400 dark:text-slate-500">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <span>© {new Date().getFullYear()} SkillSphere · Campus Micro-Gig Exchange</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">Exclusively for @ceconline.edu</span>
                </div>
            </footer>
        </div>
    );
}
