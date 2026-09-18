import { useForm } from 'react-hook-form';
import { useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { uploadAPI } from '../lib/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

function ThumbnailUploader({ value, onChange }) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);
    const preview = value ? (value.startsWith('http') || value.startsWith('/') ? `${value.startsWith('/') ? API_BASE : ''}${value}` : value) : null;

    const handleFile = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('Please upload an image file');
        if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
        setUploading(true);
        try {
            const res = await uploadAPI.uploadFile(file);
            onChange(res.data.url);
            toast.success('Thumbnail uploaded!');
        } catch {
            toast.error('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Thumbnail</label>
            <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden transition-colors hover:border-primary-300 dark:hover:border-primary-500 bg-gray-50 dark:bg-surface-900"
                style={{ minHeight: '140px' }}
            >
                {preview ? (
                    <div className="relative w-full h-40">
                        <img src={preview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                        >
                            <X size={14} />
                        </button>
                        <div className="absolute bottom-2 left-2">
                            <span className="text-xs bg-black/50 text-white px-2 py-1 rounded-lg backdrop-blur-sm">Thumbnail set ✓</span>
                        </div>
                    </div>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center gap-3 p-8 cursor-pointer"
                        onClick={() => inputRef.current?.click()}
                    >
                        {uploading ? (
                            <div className="spinner w-8 h-8" />
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <ImageIcon size={24} className="text-primary-500 dark:text-primary-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Drop an image here or <span className="text-primary-600 dark:text-primary-400">click to upload</span></p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB · Recommended: 1280×720</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFile(e.target.files?.[0])} />
            {!preview && !uploading && (
                <button type="button" onClick={() => inputRef.current?.click()}
                    className="mt-2 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300">
                    <Upload size={15} /> Upload thumbnail
                </button>
            )}
        </div>
    );
}

export default function ServiceForm({
    onSubmit,
    loading,
    categories,
    skills,
    selectedCategory,
    onCategoryChange,
    defaultValues,
    submitLabel = 'Create Service',
    onCancel,
}) {
    const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });
    const [thumbnail, setThumbnail] = useState(defaultValues?.thumbnail || '');

    const handleFormSubmit = (data) => {
        onSubmit({ ...data, thumbnail: thumbnail || null });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="card space-y-6 dark:bg-surface-800 dark:border-gray-800">
            {/* Thumbnail Upload */}
            <ThumbnailUploader value={thumbnail} onChange={setThumbnail} />

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Title *</label>
                <input type="text"
                    {...register('title', {
                        required: 'Title is required',
                        minLength: { value: 5, message: 'Title must be at least 5 characters' }
                    })}
                    className="input-field"
                    placeholder="I will design a professional poster for your event" />
                {errors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>}
            </div>

            {/* Short Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Short Description</label>
                <input type="text"
                    {...register('short_description', { maxLength: { value: 300, message: 'Max 300 characters' } })}
                    className="input-field"
                    placeholder="Brief tagline for your service" />
                {errors.short_description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.short_description.message}</p>}
            </div>

            {/* Full Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Description *</label>
                <textarea
                    {...register('description', {
                        required: 'Description is required',
                        minLength: { value: 20, message: 'Description must be at least 20 characters' }
                    })}
                    className="input-field h-32"
                    placeholder="Provide detailed information about your service..." />
                {errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>}
            </div>

            {/* Category & Skill */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category {onCategoryChange ? '*' : ''}</label>
                    <select value={selectedCategory}
                        onChange={onCategoryChange ? (e) => onCategoryChange(e.target.value) : undefined}
                        className="input-field" disabled={!onCategoryChange} required={!!onCategoryChange}>
                        <option value="">Select Category</option>
                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        {onCategoryChange && <option value="custom">✨ Custom (Enter your own)</option>}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skill</label>
                    <select {...register('skill_id')} className="input-field"
                        disabled={!selectedCategory || selectedCategory === 'custom' || !onCategoryChange}>
                        <option value="">{onCategoryChange ? 'Select Skill (or enter custom below)' : 'No skill selected'}</option>
                        {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Custom Skill */}
            {onCategoryChange && (
                <div className={selectedCategory === 'custom' ? 'p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-lg' : ''}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {selectedCategory === 'custom' ? 'Custom Skill/Category Name *' : 'Or Enter Custom Skill Name'}
                    </label>
                    <input type="text"
                        {...register('custom_skill_name', { required: selectedCategory === 'custom' ? 'Custom skill name is required' : false })}
                        className="input-field"
                        placeholder="e.g., 3D Modeling, Game Development, Circuit Design" />
                    {errors.custom_skill_name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.custom_skill_name.message}</p>}
                </div>
            )}

            {/* Pricing */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pricing Type *</label>
                    <select {...register('pricing_type')} className="input-field">
                        <option value="fixed">Fixed Price</option>
                        <option value="hourly">Hourly Rate</option>
                        <option value="negotiable">Negotiable</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (₹)</label>
                    <input type="number" step="0.01"
                        {...register('price', { min: { value: 0, message: 'Price must be positive' } })}
                        className="input-field" placeholder="500" />
                    {errors.price && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price.message}</p>}
                </div>
            </div>

            {/* Delivery & Revisions */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Time (days) *</label>
                    <input type="number"
                        {...register('delivery_time_days', {
                            required: 'Delivery time is required',
                            min: { value: 1, message: 'At least 1 day' },
                            max: { value: 30, message: 'Max 30 days' }
                        })}
                        className="input-field" placeholder="3" />
                    {errors.delivery_time_days && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.delivery_time_days.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Revisions Included *</label>
                    <input type="number"
                        {...register('revision_count', {
                            required: 'Revision count is required',
                            min: { value: 0, message: 'Cannot be negative' },
                            max: { value: 10, message: 'Max 10 revisions' }
                        })}
                        className="input-field" placeholder="2" />
                    {errors.revision_count && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.revision_count.message}</p>}
                </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
                <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? 'Saving...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
