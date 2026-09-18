// 👤 USER PROFILE PAGE
// Shows details about a user when you click on their name

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Mail, Phone, BookOpen, Calendar, Hash, Users, MessageCircle, Briefcase, ExternalLink, X } from 'lucide-react';
import { userAPI, servicesAPI, reviewsAPI, portfolioAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default function UserProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const [user, setUser] = useState(null);
    const [services, setServices] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPhotoZoom, setShowPhotoZoom] = useState(false);

    useEffect(() => {
        loadUserData();
    }, [id]);

    const loadUserData = () => {
        Promise.all([
            userAPI.getUserById(id),
            servicesAPI.listServices({ provider_id: id, page: 1, page_size: 10 }),
            reviewsAPI.getUserReviews(id, { page: 1, page_size: 5 }),
            portfolioAPI.getUserPortfolio(id)
        ])
            .then(([userRes, servicesRes, reviewsRes, portfolioRes]) => {
                setUser(userRes.data);
                setServices(servicesRes.data.items || []);
                setReviews(reviewsRes.data.items || []);
                setPortfolio(portfolioRes.data.items || []);
            })
            .catch((error) => {
                console.error('Error loading user:', error);
                toast.error('Failed to load user profile');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User not found</h2>
                <Link to="/services" className="text-primary-600 mt-4 inline-block hover:text-primary-700 dark:hover:text-primary-500">
                    ← Back to Services
                </Link>
            </div>
        );
    }

    const profileImageSrc = user.profile_image ? `${API_BASE}${user.profile_image}` : null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left sidebar - User card */}
                <div className="lg:col-span-1">
                    <div className="card text-center dark:bg-surface-900 dark:border-gray-800">
                        {/* Avatar - click to zoom */}
                        <div
                            className="relative mx-auto w-24 h-24 rounded-full cursor-pointer group mb-4"
                            onClick={() => setShowPhotoZoom(true)}
                        >
                            {profileImageSrc ? (
                                <img
                                    src={profileImageSrc}
                                    alt={user.full_name}
                                    className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-100 dark:ring-primary-900 group-hover:ring-primary-300 dark:group-hover:ring-primary-700 transition-all"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center ring-4 ring-primary-100 dark:ring-primary-900 group-hover:ring-primary-300 dark:group-hover:ring-primary-700 transition-all">
                                    <span className="text-4xl font-bold text-white">
                                        {user.full_name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            )}
                            {/* Zoom indicator overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-20 dark:bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-medium">View</span>
                            </div>
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.full_name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        {user.bio && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.bio}</p>}
                        {!user.bio && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 italic">No bio yet</p>}

                        <div className="flex justify-center gap-6 mt-4 py-3 border-t border-gray-100 dark:border-gray-800">
                            <div className="text-center">
                                <p className="text-lg font-bold text-green-600 dark:text-green-500">{user.average_rating?.toFixed(1) || '0.0'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{user.total_reviews || 0}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Reviews</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{services.length}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Services</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="mt-4 space-y-2 text-left border-t border-gray-100 dark:border-gray-800 pt-4">
                            {user.department && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <BookOpen size={14} className="text-gray-400 dark:text-gray-500" /> <span>{user.department}</span>
                                </div>
                            )}
                            {user.year_of_study && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Calendar size={14} className="text-gray-400 dark:text-gray-500" /> <span>Passout {user.year_of_study}</span>
                                </div>
                            )}
                            {user.semester && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Hash size={14} className="text-gray-400 dark:text-gray-500" /> <span>Semester {user.semester}</span>
                                </div>
                            )}
                            {user.batch && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Users size={14} className="text-gray-400 dark:text-gray-500" /> <span>Batch {user.batch}</span>
                                </div>
                            )}
                            {user.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Phone size={14} className="text-gray-400 dark:text-gray-500" /> <span>{user.phone}</span>
                                </div>
                            )}
                        </div>

                        {/* Message Button */}
                        {currentUser && currentUser.id !== user.id && (
                            <button
                                onClick={() => navigate(`/messages?user=${user.id}`)}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all dark:from-primary-600 dark:to-primary-800"
                            >
                                <MessageCircle size={18} />
                                Message
                            </button>
                        )}
                    </div>
                </div>

                {/* Right column - Portfolio, Services, Reviews */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Portfolio Section */}
                    <div className="card dark:bg-surface-900 dark:border-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="text-yellow-500">🎨</span>
                            Portfolio ({portfolio.length})
                        </h2>

                        {portfolio.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No portfolio items yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {portfolio.map(project => (
                                    <div key={project.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-sm dark:hover:shadow-black/30 transition-shadow">
                                        <div className="flex gap-4">
                                            {/* Screenshot thumbnail */}
                                            {project.image_url && (
                                                <img
                                                    src={`${API_BASE}${project.image_url}`}
                                                    alt={project.title}
                                                    className="w-24 h-20 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={16} className="text-primary-600 dark:text-primary-500" />
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{project.title}</h4>
                                                </div>
                                                {project.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{project.description}</p>
                                                )}
                                                {project.tags && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {project.tags.split(',').map((tag, i) => (
                                                            <span key={i} className="inline-block bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs px-2 py-0.5 rounded-full">
                                                                {tag.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {project.project_url && (
                                                    <a href={project.project_url} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-500 hover:underline mt-2">
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

                    {/* User's Services */}
                    <div className="card dark:bg-surface-900 dark:border-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            My Services ({services.length})
                        </h2>

                        {services.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No services yet</p>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {services.map((service) => (
                                    <Link
                                        key={service.id}
                                        to={`/services/${service.id}`}
                                        className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-md dark:hover:shadow-black/30 transition-shadow block"
                                    >
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{service.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{service.short_description || service.description}</p>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-primary-600 dark:text-primary-500 font-bold">₹{service.price}</span>
                                            <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                                <Star size={14} fill="currentColor" />
                                                <span>{service.average_rating?.toFixed(1) || '0.0'}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reviews */}
                    <div className="card dark:bg-surface-900 dark:border-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Reviews ({reviews.length})
                        </h2>

                        {reviews.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No reviews yet</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-800 pb-4 last:border-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <Link to={`/users/${review.reviewer?.id}`} className="font-semibold text-primary-600 dark:text-primary-500 hover:underline">{review.reviewer?.full_name || 'Anonymous'}</Link>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />
                                                ))}
                                            </div>
                                        </div>
                                        {review.title && (
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">{review.title}</h4>
                                        )}
                                        <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Photo Zoom Lightbox */}
            {showPhotoZoom && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 dark:bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPhotoZoom(false)}
                >
                    <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowPhotoZoom(false)}
                            className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 z-10 transition-colors"
                        >
                            <X size={18} />
                        </button>
                        {profileImageSrc ? (
                            <img
                                src={profileImageSrc}
                                alt={user.full_name}
                                className="max-w-xs md:max-w-md rounded-2xl shadow-2xl object-cover ring-4 ring-white dark:ring-gray-800"
                            />
                        ) : (
                            <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-gray-800">
                                <span className="text-8xl font-bold text-white">
                                    {user.full_name?.charAt(0) || 'U'}
                                </span>
                            </div>
                        )}
                        <p className="text-white text-center mt-3 font-medium">{user.full_name}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
