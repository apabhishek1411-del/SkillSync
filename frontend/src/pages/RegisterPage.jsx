import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone, GraduationCap, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Logo from '../components/Logo';

const COURSE_YEARS = { CSE: 4, ECE: 4, EEE: 4, 'AI&ML': 4, MCA: 2 };
const currentYear = new Date().getFullYear();
const PASSOUT_YEARS = Array.from({ length: 9 }, (_, i) => currentYear + i);

function StepIndicator({ current, total }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: total }, (_, i) => {
                const step = i + 1;
                const done = step < current;
                const active = step === current;
                return (
                    <div key={i} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                            done   ? 'bg-emerald-500 text-white' :
                            active ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/30' :
                                     'bg-gray-200 text-gray-400 dark:bg-surface-800 dark:text-gray-500'
                        }`}>
                            {done ? <CheckCircle size={16} /> : step}
                        </div>
                        {i < total - 1 && (
                            <div className={`h-0.5 w-10 mx-1 transition-all duration-300 ${done ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-surface-800'}`} />
                        )}
                    </div>
                );
            })}
            <div className="ml-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Step {current} of {total}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{current === 1 ? 'Account Info' : 'College Details'}</p>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register: registerUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm();

    const password = watch('password');
    const selectedBranch = watch('department');
    const selectedPassoutYear = watch('year_of_study');
    const currentSemester = watch('semester');
    const maxSemesters = selectedBranch === 'MCA' ? 4 : 8;

    useEffect(() => {
        if (currentSemester && parseInt(currentSemester) > maxSemesters) setValue('semester', '');
    }, [selectedBranch, maxSemesters, currentSemester, setValue]);

    const computedCourseDuration = (() => {
        if (!selectedBranch || !selectedPassoutYear) return '';
        const years = COURSE_YEARS[selectedBranch];
        if (!years) return '';
        const passout = parseInt(selectedPassoutYear);
        return `${passout - years}-${String(passout).slice(-2)}`;
    })();

    const goToStep2 = async () => {
        const valid = await trigger(['full_name', 'email', 'password', 'confirm_password']);
        if (valid) setStep(2);
    };

    const onSubmit = (data) => {
        setIsLoading(true);
        const cleanedData = {
            ...data,
            student_id: data.student_id?.trim() || null,
            department: data.department?.trim() || null,
            phone: data.phone?.trim() || null,
            year_of_study: data.year_of_study ? parseInt(data.year_of_study, 10) : null,
            semester: data.semester ? parseInt(data.semester, 10) : null,
            batch: data.batch?.trim() || null,
            course_duration: computedCourseDuration || null,
        };
        delete cleanedData.confirm_password;

        registerUser(cleanedData)
            .then(() => { toast.success('Account created! Please sign in.'); navigate('/login'); })
            .catch((err) => toast.error(err.response?.data?.detail || 'Registration failed'))
            .finally(() => setIsLoading(false));
    };

    return (
        <div className="min-h-screen flex dark:bg-surface-950">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-5/12 mesh-bg relative overflow-hidden flex-col justify-between p-12">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-1/3 -right-16 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
                <div className="relative"><Logo variant="light" size="lg" /></div>
                <div className="relative">
                    <h2 className="text-2xl font-black text-white mb-4">Join your campus marketplace</h2>
                    {['Free to join', 'Verified campus accounts only', 'Earn by sharing your skills', 'Trusted by 500+ students'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 mb-3">
                            <CheckCircle size={18} className="text-accent-300 flex-shrink-0" />
                            <span className="text-white/80 text-sm">{item}</span>
                        </div>
                    ))}
                </div>
                <p className="relative text-white/70 text-xs font-medium">&copy; {new Date().getFullYear()} SkillSphere</p>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-slate-50 dark:bg-surface-950 overflow-y-auto">
                <div className="w-full max-w-lg">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="dark:hidden">
                            <Logo variant="dark" size="md" />
                        </div>
                        <div className="hidden dark:block">
                            <Logo variant="light" size="md" />
                        </div>
                    </div>

                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Create your account</h1>
                        <p className="text-gray-500 dark:text-gray-400">Already have one? <Link to="/login" className="text-primary-600 dark:text-primary-500 font-bold hover:text-primary-700 dark:hover:text-primary-400">Sign in</Link></p>
                    </div>

                    <StepIndicator current={step} total={2} />

                    <div className="card shadow-card-lg dark:bg-surface-900 dark:border-slate-800 dark:border">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* STEP 1 */}
                            {step === 1 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="grid grid-cols-1 gap-5">
                                        {/* Full Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                                            <div className="relative">
                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                                    <User size={16} className="text-primary-500 dark:text-primary-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    {...register('full_name', {
                                                        required: 'Full name is required',
                                                        minLength: { value: 2, message: 'At least 2 characters' }
                                                    })}
                                                    onInput={e => { e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); }}
                                                    className="input-field pl-14 dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            {errors.full_name && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.full_name.message}</p>}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">College Email *</label>
                                            <div className="relative">
                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                                    <Mail size={16} className="text-primary-500 dark:text-primary-400" />
                                                </div>
                                                <input
                                                    type="email"
                                                    {...register('email', {
                                                        required: 'Email is required',
                                                        pattern: { value: /^[A-Z0-9._%+-]+@ceconline\.edu$/i, message: 'Must be a @ceconline.edu email' }
                                                    })}
                                                    className="input-field pl-14 dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500"
                                                    placeholder="your.name@ceconline.edu"
                                                />
                                            </div>
                                            {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email.message}</p>}
                                        </div>

                                        {/* Password */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password *</label>
                                                <div className="relative">
                                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                                        <Lock size={16} className="text-primary-500 dark:text-primary-400" />
                                                    </div>
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        {...register('password', {
                                                            required: 'Required',
                                                            minLength: { value: 8, message: 'Min 8 characters' },
                                                            pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Need upper, lower & number' }
                                                        })}
                                                        className="input-field pl-14 pr-11 dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500"
                                                        placeholder="••••••••"
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                                    </button>
                                                </div>
                                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password *</label>
                                                <div className="relative">
                                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                                        <Lock size={16} className="text-primary-500 dark:text-primary-400" />
                                                    </div>
                                                    <input
                                                        type={showConfirm ? 'text' : 'password'}
                                                        {...register('confirm_password', {
                                                            required: 'Required',
                                                            validate: v => v === password || 'Passwords do not match'
                                                        })}
                                                        className="input-field pl-14 pr-11 dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500"
                                                        placeholder="••••••••"
                                                    />
                                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                                                    </button>
                                                </div>
                                                {errors.confirm_password && <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <button type="button" onClick={goToStep2} className="btn-primary w-full py-3 text-base">
                                        Continue <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}

                            {/* STEP 2 */}
                            {step === 2 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Student ID</label>
                                            <input type="text" {...register('student_id')}
                                                onInput={e => { e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, ''); }}
                                                className="input-field dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500" placeholder="CHN23CS001" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                                            <div className="relative">
                                                <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                                <select {...register('department')} className="input-field pl-10 dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500">
                                                    <option value="">Select Branch</option>
                                                    <option value="CSE">CSE</option>
                                                    <option value="ECE">ECE</option>
                                                    <option value="EEE">EEE</option>
                                                    <option value="AI&ML">AI&ML</option>
                                                    <option value="MCA">MCA</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Semester</label>
                                            <select {...register('semester')} className="input-field dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500">
                                                <option value="">Select</option>
                                                {Array.from({ length: maxSemesters }, (_, i) => (
                                                    <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Batch</label>
                                            <select {...register('batch')} className="input-field dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500">
                                                <option value="">Select Batch</option>
                                                {['A','B','C','D','E','F','G'].map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Year of Passout</label>
                                            <select {...register('year_of_study')} className="input-field dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500">
                                                <option value="">Select Year</option>
                                                {PASSOUT_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                                <input type="tel" {...register('phone')}
                                                    onInput={e => { e.target.value = e.target.value.replace(/[^0-9+\s]/g, ''); }}
                                                    className="input-field pl-10 dark:bg-surface-950/70 dark:border-slate-700 dark:text-white dark:focus:border-primary-500" placeholder="+91 9876543210" />
                                            </div>
                                        </div>
                                    </div>

                                    {computedCourseDuration && (
                                        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800/50 rounded-xl px-4 py-3 text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Course Duration: </span>
                                            <span className="font-bold text-primary-700 dark:text-primary-400">{computedCourseDuration}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setStep(1)} className="btn-secondary dark:bg-surface-800 dark:text-white dark:border-gray-700 dark:hover:bg-surface-700 flex-1 py-3">
                                            <ArrowLeft size={18} /> Back
                                        </button>
                                        <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-3 text-base">
                                            {isLoading ? 'Creating...' : <>Create Account <ArrowRight size={18} /></>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
