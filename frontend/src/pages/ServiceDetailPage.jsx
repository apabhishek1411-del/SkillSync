import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Clock, RefreshCw, User, ShoppingCart, Trash2, Edit, MessageCircle } from 'lucide-react';
import { servicesAPI, reviewsAPI, ordersAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default function ServiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showHireModal, setShowHireModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadServiceDetails();
    }, [id]);

    const loadServiceDetails = async () => {
        try {
            const [serviceRes, reviewsRes] = await Promise.all([
                servicesAPI.getService(id),
                reviewsAPI.getServiceReviews(id, { page: 1, page_size: 10 })
            ]);
            setService(serviceRes.data);
            setReviews(reviewsRes.data.items);
        } catch (error) {
            toast.error('Failed to load service');
            navigate('/services');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-500"></div></div>;
    }

    const isOwnService = service.provider_id === user.id;

    // 🗑️ DELETE SERVICE
    // Only the owner or admin can delete a service
    const handleDelete = () => {
        if (!window.confirm('Are you sure you want to delete this service? This cannot be undone!')) {
            return;
        }

        setDeleting(true);
        servicesAPI.deleteService(id)
            .then(() => {
                toast.success('Service deleted successfully!');
                navigate('/services');
            })
            .catch((error) => {
                toast.error(error.response?.data?.detail || 'Failed to delete service');
            })
            .finally(() => {
                setDeleting(false);
            });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Back Button */}
            <Link to="/services" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                ← Back to Services
            </Link>

            {/* Service Header */}
            <div className="card dark:bg-surface-800 dark:border-gray-700">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{service.title}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{service.description}</p>

                        <div className="flex items-center gap-4 mb-6">
                            {service.provider?.profile_image ? (
                                <img
                                    src={`${API_BASE}${service.provider.profile_image}`}
                                    alt={service.provider?.full_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                                    {service.provider?.full_name?.charAt(0) || '?'}
                                </div>
                            )}
                            <div>
                                <Link
                                    to={`/users/${service.provider_id}`}
                                    className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                                >
                                    {service.provider?.full_name}
                                </Link>
                                <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                    <Star size={16} fill="currentColor" />
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {service.provider?.average_rating.toFixed(1)}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">({service.provider?.total_reviews} reviews)</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Clock size={20} />
                                <div>
                                    <p className="text-sm">Delivery</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{service.delivery_time_days} days</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <RefreshCw size={20} />
                                <div>
                                    <p className="text-sm">Revisions</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{service.revision_count}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <ShoppingCart size={20} />
                                <div>
                                    <p className="text-sm">Hires</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{service.order_count}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hire Card */}
                    <div className="card bg-gray-50 dark:bg-surface-900 border dark:border-gray-800">
                        <div className="text-center mb-4">
                            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">₹{service.price}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{service.pricing_type}</p>
                        </div>

                        {/* Owner buttons: Edit + Delete */}
                        {isOwnService && (
                            <div className="space-y-2">
                                <Link to={`/services/${service.id}/edit`} className="btn-primary w-full flex items-center justify-center gap-2">
                                    <Edit size={18} /> Edit Service
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                    <Trash2 size={18} /> {deleting ? 'Deleting...' : 'Delete Service'}
                                </button>
                            </div>
                        )}

                        {/* Admin buttons: Edit + Delete on any service */}
                        {isAdmin && !isOwnService && (
                            <div className="space-y-2">

                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                    <Trash2 size={18} /> {deleting ? 'Deleting...' : 'Delete Service (Admin)'}
                                </button>
                                <button
                                    onClick={() => setShowHireModal(true)}
                                    className="btn-secondary w-full"
                                >
                                    Hire Now <ShoppingCart className="inline ml-2" size={18} />
                                </button>
                            </div>
                        )}

                        {/* Regular user: just Hire button */}
                        {!isOwnService && !isAdmin && (
                            <button
                                onClick={() => setShowHireModal(true)}
                                className="btn-primary w-full"
                            >
                                Hire Now <ShoppingCart className="inline ml-2" size={18} />
                            </button>
                        )}

                        {/* Message Provider button */}
                        {!isOwnService && (
                            <button
                                onClick={() => navigate(`/messages?user=${service.provider_id}&service=${service.id}`)}
                                className="btn-secondary w-full flex items-center justify-center gap-2 mt-2"
                            >
                                <MessageCircle size={18} /> Message Provider
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Reviews Section with AI Sentiment Analysis */}
            <div className="card dark:bg-surface-800 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Peer Reviews ({reviews.length})
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Verified student feedback with AI sentiment evaluation
                        </p>
                    </div>

                    {reviews.length > 0 && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-200/60 text-primary-700 dark:text-primary-300 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>NLP Sentiment Analysis Active</span>
                        </div>
                    )}
                </div>

                {reviews.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">No reviews yet.</p>
                ) : (
                    <div className="space-y-5">
                        {reviews.map((review) => {
                            const sentiment = review.sentiment || (review.rating >= 4 ? 'positive' : (review.rating === 3 ? 'neutral' : 'negative'));
                            const sentimentBadge = 
                                sentiment === 'positive' ? { label: 'Positive', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200', dot: 'bg-emerald-500' } :
                                sentiment === 'negative' ? { label: 'Critical', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200', dot: 'bg-rose-500' } :
                                { label: 'Neutral', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200', dot: 'bg-amber-500' };

                            return (
                                <div key={review.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-850/50 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                                                {review.reviewer?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-white text-sm block">
                                                    {review.reviewer?.full_name || 'Anonymous Student'}
                                                </span>
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Sentiment Badge + Star Rating */}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 items-end">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sentimentBadge.bg}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${sentimentBadge.dot}`} />
                                                NLP: {sentimentBadge.label}
                                                {review.sentiment_score !== null && review.sentiment_score !== undefined && (
                                                    <span className="opacity-75 font-mono">({Number(review.sentiment_score) > 0 ? `+${review.sentiment_score}` : review.sentiment_score})</span>
                                                )}
                                            </span>

                                            <div className="flex items-center gap-0.5 text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        fill={i < review.rating ? 'currentColor' : 'none'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {review.title && (
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{review.title}</h4>
                                    )}
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{review.comment}</p>

                                    {review.provider_response && (
                                        <div className="mt-2 pl-3 border-l-2 border-primary-500 bg-primary-50/40 dark:bg-primary-950/20 py-2 pr-3 rounded-r-xl text-xs text-slate-600 dark:text-slate-300">
                                            <span className="font-bold text-primary-600 dark:text-primary-400 block mb-0.5">Provider Response:</span>
                                            {review.provider_response}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Hire Modal */}
            {showHireModal && (
                <HireModal
                    service={service}
                    onClose={() => setShowHireModal(false)}
                    onSuccess={() => {
                        setShowHireModal(false);
                        navigate('/orders');
                    }}
                />
            )}
        </div>
    );
}

function HireModal({ service, onClose, onSuccess }) {
    const [requirements, setRequirements] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!requirements.trim() || requirements.length < 10) {
            toast.error('Please provide detailed requirements (at least 10 characters)');
            return;
        }

        setLoading(true);
        try {
            await ordersAPI.createOrder({
                service_id: service.id,
                requirements,
                agreed_price: service.price
            });
            toast.success('Hire placed successfully!');
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 max-w-2xl w-full mx-4 border dark:border-gray-700 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Place Hire</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Describe Your Requirements *
                        </label>
                        <textarea
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            className="input-field h-32 dark:bg-surface-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                            placeholder="Provide detailed requirements for your order..."
                            required
                        />
                    </div>

                    <div className="bg-gray-50 dark:bg-surface-700/50 p-4 rounded-lg border dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Service Price</span>
                            <span className="font-semibold text-gray-900 dark:text-white">₹{service.price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Delivery Time</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{service.delivery_time_days} days</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? 'Placing Hire...' : 'Confirm Hire'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
