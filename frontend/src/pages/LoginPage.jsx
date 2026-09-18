import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Users, Star } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Logo from '../components/Logo';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await login(data);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Login failed. Check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ── Left Panel ── */}
            <div className="hidden lg:flex lg:w-1/2 mesh-bg relative overflow-hidden flex-col justify-between p-12">
                <div className="absolute inset-0 bg-black/10" />
                {/* Decorative circles */}
                <div className="absolute top-1/4 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute bottom-1/4 -left-20 w-64 h-64 rounded-full bg-violet-400/20 blur-3xl float-animation" />

                <div className="relative">
                    <Logo variant="light" size="lg" />
                </div>

                <div className="relative">
                    <h2 className="text-3xl font-black text-white mb-4 leading-tight">
                        Your campus marketplace<br />
                        <span className="text-accent-300">for skills & services</span>
                    </h2>
                    <p className="text-white/70 text-base leading-relaxed mb-8">
                        Connect with talented peers, offer your skills, and earn — all within @ceconline.edu.
                    </p>

                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { icon: Users,  label: '500+ Students', color: 'text-accent-300' },
                            { icon: Shield, label: 'Verified Accounts', color: 'text-emerald-300' },
                            { icon: Star,   label: '4.9 Avg Rating', color: 'text-yellow-300' },
                        ].map(({ icon: Icon, label, color }, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                <Icon size={22} className={color} />
                                <p className="text-white text-xs font-semibold mt-2 leading-tight">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-white/70 text-xs font-medium">&copy; {new Date().getFullYear()} SkillSphere</p>
            </div>

            {/* ── Right Panel ── */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50 dark:bg-surface-950">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="dark:hidden">
                            <Logo variant="dark" size="md" />
                        </div>
                        <div className="hidden dark:block">
                            <Logo variant="light" size="md" />
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Welcome back</h1>
                        <p className="text-gray-500 dark:text-gray-400">Sign in to your SkillSphere account</p>
                    </div>

                    <div className="card shadow-card-lg dark:bg-surface-900 dark:border-slate-800 dark:border">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">College Email</label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                        <Mail size={16} className="text-primary-500 dark:text-primary-400" />
                                    </div>
                                    <input
                                        type="email"
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@ceconline\.edu$/i,
                                                message: 'Must be a valid @ceconline.edu email'
                                            }
                                        })}
                                        className="input-field pl-14 dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500"
                                        placeholder="your.name@ceconline.edu"
                                    />
                                </div>
                                {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email.message}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                        <Lock size={16} className="text-primary-500 dark:text-primary-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password', { required: 'Password is required' })}
                                        className="input-field pl-14 pr-12 dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password.message}</p>}
                            </div>

                            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base">
                                {isLoading ? (
                                    <><span className="spinner w-5 h-5" /> Signing in...</>
                                ) : (
                                    <>Sign In <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-surface-800 text-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-primary-600 dark:text-primary-400 font-bold hover:text-primary-700 dark:hover:text-primary-300">Create one →</Link>
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
                        Only <span className="font-semibold text-gray-500 dark:text-gray-400">@ceconline.edu</span> accounts are allowed
                    </p>
                </div>
            </div>
        </div>
    );
}
