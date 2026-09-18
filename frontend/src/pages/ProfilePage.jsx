import { userAPI, portfolioAPI, uploadAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, ExternalLink, Briefcase, Camera, X, Upload, Image, Star, IndianRupee, ShoppingBag } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const COURSE_YEARS = { CSE: 4, ECE: 4, EEE: 4, 'AI&ML': 4, MCA: 2 };
const currentYear = new Date().getFullYear();
const PASSOUT_YEARS = Array.from({ length: 9 }, (_, i) => currentYear + i);

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: user
    });

    // Portfolio state
    const [portfolio, setPortfolio] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', description: '', project_url: '', tags: '', image_url: '' });
    const [loadingPortfolio, setLoadingPortfolio] = useState(true);
    const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

    // Profile photo state
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef(null);
    const screenshotInputRef = useRef(null);

    const selectedBranch = watch('department');
    const selectedPassoutYear = watch('year_of_study');
    const maxSemesters = selectedBranch === 'MCA' ? 4 : 8;

    const currentSemester = watch('semester');
    useEffect(() => {
        if (currentSemester && parseInt(currentSemester) > maxSemesters) {
            setValue('semester', '');
        }
    }, [selectedBranch, maxSemesters, currentSemester, setValue]);

    const computedCourseDuration = (() => {
        if (!selectedBranch || !selectedPassoutYear) return user?.course_duration || '';
        const years = COURSE_YEARS[selectedBranch];
        if (!years) return '';
        const passout = parseInt(selectedPassoutYear);
        const startYear = passout - years;
        return `${startYear}-${String(passout).slice(-2)}`;
    })();

    // Load portfolio
    useEffect(() => {
        if (user?.id) {
            portfolioAPI.getUserPortfolio(user.id)
                .then(res => setPortfolio(res.data.items || []))
                .catch(() => { })
                .finally(() => setLoadingPortfolio(false));
        }
    }, [user?.id]);

    const onSubmit = async (data) => {
        try {
            const submitData = {
                ...data,
                course_duration: computedCourseDuration || null,
                year_of_study: data.year_of_study ? parseInt(data.year_of_study, 10) : null,
                semester: data.semester ? parseInt(data.semester, 10) : null,
            };
            const response = await userAPI.updateProfile(submitData);
            updateUser(response.data);
            toast.success('Profile updated successfully');
            setEditing(false);
        } catch (error) {
            toast.error('Failed to update profile');
        }
    };

    // ---- Profile Photo ----
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const uploadRes = await uploadAPI.uploadFile(file);
            const imageUrl = uploadRes.data.url;
            const profileRes = await userAPI.updateProfile({ profile_image: imageUrl });
            updateUser(profileRes.data);
            toast.success('Profile photo updated!');
            setShowPhotoModal(false);
        } catch (error) {
            toast.error('Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handlePhotoRemove = async () => {
        setUploadingPhoto(true);
        try {
            const profileRes = await userAPI.updateProfile({ profile_image: null });
            updateUser(profileRes.data);
            toast.success('Profile photo removed');
            setShowPhotoModal(false);
        } catch (error) {
            toast.error('Failed to remove photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    // ---- Portfolio Screenshot Upload ----
    const handleScreenshotUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingScreenshot(true);
        try {
            const uploadRes = await uploadAPI.uploadFile(file);
            setNewProject(prev => ({ ...prev, image_url: uploadRes.data.url }));
            toast.success('Screenshot uploaded!');
        } catch (error) {
            toast.error('Failed to upload screenshot');
        } finally {
            setUploadingScreenshot(false);
        }
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!newProject.title.trim()) {
            toast.error('Project title is required');
            return;
        }
        try {
            const res = await portfolioAPI.addProject(newProject);
            setPortfolio([res.data, ...portfolio]);
            setNewProject({ title: '', description: '', project_url: '', tags: '', image_url: '' });
            setShowAddForm(false);
            toast.success('Project added to portfolio!');
        } catch (error) {
            toast.error('Failed to add project');
        }
    };

    const handleDeleteProject = async (projectId) => {
        try {
            await portfolioAPI.deleteProject(projectId);
            setPortfolio(portfolio.filter(p => p.id !== projectId));
            toast.success('Project removed from portfolio');
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    const profileImageSrc = user.profile_image ? `${API_BASE}${user.profile_image}` : null;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Profile Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-700 shadow-btn-lg dark:shadow-none dark:border dark:border-primary-800">
                <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative px-8 pt-10 pb-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 pb-6">
                        {/* Avatar */}
                        <div className="relative group cursor-pointer flex-shrink-0" onClick={() => { setShowPhotoModal(false); photoInputRef.current?.click(); }}>
                            {user?.profile_image ? (
                                <img src={`${API_BASE}${user.profile_image}`} alt={user.full_name}
                                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30 shadow-xl dark:border-white/10" />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-black text-3xl border-4 border-white/30 shadow-xl dark:border-white/10">
                                    {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera size={20} className="text-white" />
                            </div>
                            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </div>

                        {/* Name & Info */}
                        <div className="flex-1 pb-1">
                            <h1 className="text-2xl font-black text-white mb-1">{user?.full_name}</h1>
                            <p className="text-white/70 text-sm mb-3 dark:text-white/60">{user?.email}</p>
                            <div className="flex flex-wrap gap-2">
                                {user?.department && (
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/25 dark:bg-white/15 dark:border-white/20">{user.department}</span>
                                )}
                                {user?.semester && (
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/25 dark:bg-white/15 dark:border-white/20">Semester {user.semester}</span>
                                )}
                                {user?.batch && (
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/25 dark:bg-white/15 dark:border-white/20">Batch {user.batch}</span>
                                )}
                            </div>
                        </div>

                        {/* Edit button */}
                        <button onClick={() => setEditing(!editing)}
                            className="flex-shrink-0 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all duration-200 dark:bg-surface-800 dark:text-primary-400 dark:border dark:border-primary-500/30">
                            {editing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 border-t border-white/15 dark:border-white/10">
                        {[
                            { icon: IndianRupee, label: 'Earned', value: `\u20B9${(user?.total_earnings || 0).toFixed(0)}`, color: 'text-emerald-300' },
                            { icon: ShoppingBag, label: 'Orders',  value: user?.total_reviews ?? 0, color: 'text-sky-300' },
                            { icon: Star,        label: 'Rating',  value: user?.average_rating > 0 ? `${user.average_rating.toFixed(1)}\u2605` : 'N/A', color: 'text-amber-300' },
                        ].map(({ icon: Icon, label, value, color }, i) => (
                            <div key={i} className="flex flex-col items-center py-4 gap-1">
                                <Icon size={16} className={color} />
                                <p className="text-lg font-black text-white">{value}</p>
                                <p className="text-white/80 text-xs dark:text-white/75 font-medium">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Portfolio Section */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-yellow-500">🎨</span>
                        Portfolio ({portfolio.length})
                    </h3>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                    >
                        <Plus size={16} />
                        Add Project
                    </button>
                </div>

                {/* Add Project Form */}
                {showAddForm && (
                    <form onSubmit={handleAddProject} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 space-y-3 dark:border-gray-800 dark:bg-surface-850">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Project Title *</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. E-Commerce Website"
                                value={newProject.title}
                                onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Description</label>
                            <textarea
                                className="input-field h-20"
                                placeholder="Describe your project..."
                                value={newProject.description}
                                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Project URL</label>
                            <input
                                type="url"
                                className="input-field"
                                placeholder="https://github.com/..."
                                value={newProject.project_url}
                                onChange={e => setNewProject({ ...newProject, project_url: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Tags (comma separated)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="React, Node.js, MongoDB"
                                value={newProject.tags}
                                onChange={e => setNewProject({ ...newProject, tags: e.target.value })}
                            />
                        </div>
                        {/* Screenshot upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Screenshot</label>
                            <input
                                ref={screenshotInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleScreenshotUpload}
                            />
                            {newProject.image_url ? (
                                <div className="relative inline-block">
                                    <img
                                        src={`${API_BASE}${newProject.image_url}`}
                                        alt="Screenshot"
                                        className="h-24 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setNewProject({ ...newProject, image_url: '' })}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => screenshotInputRef.current?.click()}
                                    disabled={uploadingScreenshot}
                                    className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-surface-800"
                                >
                                    {uploadingScreenshot ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 dark:border-primary-400"></div>
                                    ) : (
                                        <Image size={16} />
                                    )}
                                    {uploadingScreenshot ? 'Uploading...' : 'Upload Screenshot'}
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="btn-primary text-sm">Save Project</button>
                            <button type="button" onClick={() => { setShowAddForm(false); setNewProject({ title: '', description: '', project_url: '', tags: '', image_url: '' }); }} className="btn-secondary text-sm">Cancel</button>
                        </div>
                    </form>
                )}

                {/* Portfolio Items */}
                {loadingPortfolio ? (
                    <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
                    </div>
                ) : portfolio.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 dark:text-gray-400">Showcase your work — add portfolio items!</p>
                ) : (
                    <div className="space-y-3">
                        {portfolio.map(project => (
                            <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow dark:border-gray-800 dark:bg-surface-900">
                                <div className="flex gap-4">
                                    {/* Screenshot thumbnail */}
                                    {project.image_url && (
                                        <img
                                            src={`${API_BASE}${project.image_url}`}
                                            alt={project.title}
                                            className="w-24 h-20 rounded-lg object-cover border border-gray-200 flex-shrink-0 dark:border-gray-700"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={16} className="text-primary-600 dark:text-primary-400" />
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{project.title}</h4>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteProject(project.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors ml-2 dark:text-gray-500 dark:hover:text-red-400"
                                                title="Delete project"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        {project.description && (
                                            <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">{project.description}</p>
                                        )}
                                        {project.tags && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {project.tags.split(',').map((tag, i) => (
                                                    <span key={i} className="inline-block bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-full dark:bg-primary-900/30 dark:text-primary-400">
                                                        {tag.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {project.project_url && (
                                            <a href={project.project_url} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-2 dark:text-primary-400">
                                                <ExternalLink size={12} /> View Project
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Profile Form */}
            <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4 dark:text-white">Profile Details</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Full Name</label>
                            <input type="text" {...register('full_name')} onInput={(e) => { e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); }} className="input-field" disabled={!editing} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Student ID</label>
                            <input type="text" {...register('student_id')} onInput={(e) => { e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, ''); }} className="input-field" disabled={!editing} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Branch</label>
                            {editing ? (
                                <select {...register('department')} className="input-field">
                                    <option value="">Select Branch</option>
                                    <option value="CSE">CSE</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option>
                                    <option value="AI&ML">AI&ML</option>
                                    <option value="MCA">MCA</option>
                                </select>
                            ) : (
                                <input type="text" value={user.department || ''} className="input-field" disabled />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Semester</label>
                            {editing ? (
                                <select {...register('semester')} className="input-field">
                                    <option value="">Select Semester</option>
                                    {Array.from({ length: maxSemesters }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                                    ))}
                                </select>
                            ) : (
                                <input type="text" value={user.semester ? `Semester ${user.semester}` : ''} className="input-field" disabled />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Batch</label>
                            {editing ? (
                                <select {...register('batch')} className="input-field">
                                    <option value="">Select Batch</option>
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            ) : (
                                <input type="text" value={user.batch ? `Batch ${user.batch}` : ''} className="input-field" disabled />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Year of Passout</label>
                            {editing ? (
                                <select {...register('year_of_study')} className="input-field">
                                    <option value="">Select Year</option>
                                    {PASSOUT_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            ) : (
                                <input type="text" value={user.year_of_study || ''} className="input-field" disabled />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Course Duration</label>
                            <input type="text" value={editing ? computedCourseDuration : (user.course_duration || '')} className="input-field bg-gray-50 dark:bg-surface-850" disabled />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Phone</label>
                            <input type="tel" {...register('phone')} onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9+\s]/g, ''); }} className="input-field" disabled={!editing} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Bio</label>
                        <textarea {...register('bio')} className="input-field h-24" disabled={!editing} placeholder="Tell us about yourself and your skills..." />
                    </div>
                    {editing && (
                        <button type="submit" className="btn-primary">Save Changes</button>
                    )}
                </form>
            </div>

            {/* Profile Photo Modal */}
            {showPhotoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 dark:bg-opacity-70" onClick={() => setShowPhotoModal(false)}>
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl dark:bg-surface-900 dark:border dark:border-gray-800" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Profile Photo</h3>
                            <button onClick={() => setShowPhotoModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Current photo preview */}
                        <div className="flex justify-center mb-6">
                            {profileImageSrc ? (
                                <img src={profileImageSrc} alt={user.full_name} className="w-32 h-32 rounded-full object-cover ring-4 ring-primary-100 dark:ring-primary-900/50" />
                            ) : (
                                <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center ring-4 ring-primary-100 dark:ring-primary-900/50">
                                    <span className="text-5xl font-bold text-white">{user.full_name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

                        <div className="space-y-2">
                            <button
                                onClick={() => photoInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 dark:bg-primary-700 dark:hover:bg-primary-600"
                            >
                                {uploadingPhoto ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Upload size={18} />
                                )}
                                {uploadingPhoto ? 'Uploading...' : 'Upload New Photo'}
                            </button>
                            {user.profile_image && (
                                <button
                                    onClick={handlePhotoRemove}
                                    disabled={uploadingPhoto}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 size={18} />
                                    Remove Photo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
