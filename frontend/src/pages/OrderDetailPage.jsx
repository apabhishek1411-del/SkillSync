import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, CheckCircle, XCircle, Clock, Package, Star,
    User, IndianRupee, RotateCcw, AlertTriangle, Receipt, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersAPI, reviewsAPI, paymentAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import PaymentReceiptModal from '../components/PaymentReceiptModal';

const STATUS_CONFIG = {
    pending:     { label: 'Pending',     color: 'badge-warning',  bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800',  icon: Clock        },
    accepted:    { label: 'Accepted',    color: 'badge-info',     bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-200 dark:border-blue-800',   icon: CheckCircle  },
    in_progress: { label: 'In Progress', color: 'badge-info',     bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-200 dark:border-blue-800',   icon: Package      },
    delivered:   { label: 'Delivered',   color: 'badge-purple',   bg: 'bg-violet-50 dark:bg-violet-900/20',  border: 'border-violet-200 dark:border-violet-800', icon: Package      },
    revision:    { label: 'Revision',    color: 'badge-warning',  bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800',  icon: RotateCcw    },
    completed:   { label: 'Completed',   color: 'badge-success',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800',icon: CheckCircle  },
    cancelled:   { label: 'Cancelled',   color: 'badge-danger',   bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-800',    icon: XCircle      },
    rejected:    { label: 'Rejected',    color: 'badge-danger',   bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-800',    icon: XCircle      },
    disputed:    { label: 'Disputed',    color: 'badge-danger',   bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-800',    icon: AlertTriangle},
};

const PAYMENT_STATUS_CONFIG = {
    pending:  { label: 'Payment Pending', color: 'badge-warning', dot: 'bg-amber-400'  },
    paid:     { label: 'Paid',            color: 'badge-success', dot: 'bg-emerald-400'},
    refunded: { label: 'Refunded',        color: 'badge-gray',    dot: 'bg-gray-400'   },
};

function StarRating({ value, onChange }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => onChange(star)}
                    className={`transition-transform hover:scale-110 ${
                        star <= value ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
                    }`}>
                    <Star size={28} fill={star <= value ? 'currentColor' : 'none'} />
                </button>
            ))}
        </div>
    );
}

const TIMELINE_STEPS = [
    { status: 'pending',     label: 'Order Placed',    key: 'created_at'        },
    { status: 'accepted',    label: 'Accepted',        key: 'accepted_at'       },
    { status: 'in_progress', label: 'Work Started',    key: 'accepted_at'       },
    { status: 'delivered',   label: 'Delivered',       key: 'actual_delivery'   },
    { status: 'completed',   label: 'Completed & Paid',key: 'completed_at'      },
];
const CANCELLED_STEPS = [
    { status: 'pending',  label: 'Order Placed', key: 'created_at' },
    { status: 'cancelled',label: 'Cancelled',    key: 'updated_at' },
];
const REJECTED_STEPS = [
    { status: 'pending',  label: 'Order Placed', key: 'created_at' },
    { status: 'rejected', label: 'Rejected',     key: 'updated_at' },
];

const STATUS_ORDER = ['pending','accepted','in_progress','delivered','revision','completed'];

function OrderTimeline({ order }) {
    const isCancelled = order.status === 'cancelled';
    const isRejected  = order.status === 'rejected';
    const steps = isCancelled ? CANCELLED_STEPS : isRejected ? REJECTED_STEPS : TIMELINE_STEPS;

    const currentIdx = STATUS_ORDER.indexOf(order.status);

    return (
        <div className="card dark:bg-surface-850 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Order Progress</h2>
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />
                <div className="space-y-5">
                    {steps.map((step, idx) => {
                        const isLast = idx === steps.length - 1;
                        const stepIdx = STATUS_ORDER.indexOf(step.status);
                        const isDone  = isCancelled || isRejected
                            ? idx < steps.length - 1
                            : stepIdx <= currentIdx;
                        const isCurrent = step.status === order.status;
                        const ts = order[step.key];

                        return (
                            <div key={step.status} className="flex items-start gap-4 relative">
                                {/* Dot */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                    isCurrent && (isCancelled || isRejected)
                                        ? 'bg-red-500 shadow-lg shadow-red-200 dark:shadow-red-900/20'
                                        : isCurrent
                                            ? 'bg-primary-600 shadow-lg shadow-primary-200 dark:shadow-primary-900/20'
                                            : isDone
                                                ? 'bg-emerald-500'
                                                : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                                }`}>
                                    {isDone || isCurrent
                                        ? <CheckCircle size={16} className="text-white" />
                                        : <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                                    }
                                </div>
                                {/* Content */}
                                <div className={`flex-1 pb-1 ${!isLast ? 'pb-4' : ''}`}>
                                    <p className={`text-sm font-semibold ${
                                        isCurrent ? 'text-primary-700 dark:text-primary-400' : isDone ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                                    }`}>{step.label}</p>
                                    {ts && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                            {new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    )}
                                    {isCurrent && !ts && (
                                        <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5 animate-pulse">In progress...</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function OrderDetailPage() {
    const { id } = useParams();
    const { user } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Payment state
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentTransaction, setPaymentTransaction] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    // Review state
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewTitle, setReviewTitle] = useState('');
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [review, setReview] = useState(null);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    // Rejection / cancellation reason
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showCancelInput, setShowCancelInput] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');

    useEffect(() => { loadOrder(); }, [id]);

    const loadOrder = async () => {
        try {
            const res = await ordersAPI.getOrder(id);
            setOrder(res.data);
            // Fetch payment transaction if order is paid/completed
            if (res.data.payment_status === 'paid' || res.data.payment_status === 'refunded') {
                try {
                    const txnRes = await paymentAPI.getStatus(id);
                    setPaymentTransaction(txnRes.data);
                } catch (_) {}
            }
            try {
                const rv = await reviewsAPI.getOrderReview(id);
                setReview(rv.data || null);
            } catch (_) { setReview(null); }
        } catch { toast.error('Failed to load order'); }
        finally { setLoading(false); }
    };

    const startEditReview = () => {
        setReviewRating(review?.rating || 5);
        setReviewTitle(review?.title || '');
        setReviewComment(review?.comment || '');
        setShowReviewForm(true);
    };

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        setSubmittingReply(true);
        try {
            await reviewsAPI.addResponse(review.id, { provider_response: replyText.trim() });
            toast.success('Reply posted!');
            setShowReplyForm(false);
            await loadOrder();
        } catch (err) {
            toast.error(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || 'Failed to post reply');
        } finally { setSubmittingReply(false); }
    };

    const updateStatus = async (status, extra = {}) => {
        setUpdating(true);
        try {
            await ordersAPI.updateOrderStatus(id, { status, ...extra });
            toast.success(`Order ${status.replace('_', ' ')}!`);
            await loadOrder();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Action failed');
        } finally { setUpdating(false); }
    };

    // ── Razorpay Payment Flow ────────────────────────────────────────────────
    // ── Razorpay Payment Flow ────────────────────────────────────────────────
    const handlePayNow = async () => {
        if (processingPayment) return;
        setProcessingPayment(true);
        try {
            // 1. Create Razorpay order on backend
            const { data } = await paymentAPI.createOrder({ order_id: order.id });

            // 2. Open Razorpay Checkout popup
            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: data.currency,
                name: 'SkillSphere',
                description: order.service_title || 'Campus Service Payment',
                image: 'https://via.placeholder.com/60x60/4f46e5/ffffff?text=S',
                order_id: data.razorpay_order_id,
                handler: async (response) => {
                    // 3. Verify signature on backend → auto-completes order
                    try {
                        await paymentAPI.verifyPayment({
                            order_id: order.id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        toast.success('🎉 Payment successful! Order completed.');
                        await loadOrder();
                        setShowReceipt(true);
                    } catch (err) {
                        toast.error(err.response?.data?.detail || 'Payment verification failed. Contact support.');
                    }
                },
                prefill: {
                    name: user?.full_name || '',
                    email: user?.email || '',
                },
                notes: {
                    order_number: data.order_number,
                },
                theme: { color: '#4f46e5' },
                modal: {
                    ondismiss: () => {
                        setProcessingPayment(false);
                        toast('Payment cancelled.', { icon: 'ℹ️' });
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (resp) => {
                toast.error(`Payment failed: ${resp.error.description}`);
                setProcessingPayment(false);
            });
            rzp.open();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Could not initiate payment. Please try again.');
            setProcessingPayment(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewRating) return toast.error('Please select a rating');
        setSubmittingReview(true);
        try {
            if (review) {
                await reviewsAPI.updateReview(review.id, { rating: reviewRating, title: reviewTitle, comment: reviewComment });
                toast.success('Review updated!');
            } else {
                await reviewsAPI.createReview({
                    order_id: order.id,
                    rating: reviewRating,
                    title: reviewTitle,
                    comment: reviewComment,
                });
                toast.success('Review submitted!');
            }
            setShowReviewForm(false);
            await loadOrder();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit review');
        } finally { setSubmittingReview(false); }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-32">
            <div className="spinner w-12 h-12" />
        </div>
    );
    if (!order) return (
        <div className="text-center py-24">
            <p className="text-gray-500 dark:text-gray-400">Order not found.</p>
            <Link to="/orders" className="btn-primary mt-4">Back to Orders</Link>
        </div>
    );

    const isClient   = order.client_id === user?.id;
    const isProvider = order.provider_id === user?.id;
    const statusCfg  = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const paymentCfg = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending;
    const StatusIcon = statusCfg.icon;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Back button */}
            <Link to="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium text-sm transition-colors">
                <ArrowLeft size={18} /> Back to Orders
            </Link>

            {/* Order Header */}
            <div className="card dark:bg-surface-850 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Order</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">#{order.order_number}</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {order.service_title || order.service?.title}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`${statusCfg.color} badge`}>
                            <StatusIcon size={12} />
                            {statusCfg.label}
                        </span>
                        <span className={`${paymentCfg.color} badge`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${paymentCfg.dot}`} />
                            {paymentCfg.label}
                        </span>
                    </div>
                </div>

                {/* Stats strip */}
                <div className={`mt-5 grid grid-cols-3 gap-4 p-4 rounded-2xl ${statusCfg.bg} border ${statusCfg.border}`}>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
                        <p className="text-lg font-black text-gray-900 dark:text-white">₹{order.agreed_price}</p>
                    </div>
                    <div className="text-center border-x border-current/10 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delivery</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {order.expected_delivery
                                ? new Date(order.expected_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                : '—'}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Revisions</p>
                        <p className="text-lg font-black text-gray-900 dark:text-white">{order.revision_count}/{order.max_revisions}</p>
                    </div>
                </div>

                {/* Parties */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    {[{ label: 'Client', person: order.client }, { label: 'Provider', person: order.provider }].map(({ label, person }) => (
                        <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {person?.full_name?.charAt(0) || '?'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{person?.full_name}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Requirements */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Requirements</p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{order.requirements}</p>
                </div>
            </div>

            {/* Order Timeline */}
            <OrderTimeline order={order} />

            {/* Payment Info strip — shown when paid */}
            {order.payment_status === 'paid' && paymentTransaction && (
                <div className="card dark:bg-surface-850 dark:border-gray-800 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                                <ShieldCheck size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Payment Verified</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                                    {paymentTransaction.razorpay_payment_id} · {paymentTransaction.payment_method}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowReceipt(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            <Receipt size={16} /> Receipt
                        </button>
                    </div>
                </div>
            )}

            {/* Action Card */}
            <div className="card dark:bg-surface-850 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Actions</h2>

                {/* PROVIDER ACTIONS */}
                {isProvider && (
                    <div className="space-y-3">
                        {order.status === 'pending' && (
                            <div className="space-y-3">
                                <button onClick={() => updateStatus('accepted')} disabled={updating}
                                    className="btn-primary w-full py-3"><CheckCircle size={18}/> Accept Order
                                </button>
                                {!showRejectInput ? (
                                    <button onClick={() => setShowRejectInput(true)}
                                        className="btn-danger w-full py-3"><XCircle size={18}/> Reject Order
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                            className="input-field resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" rows={3} placeholder="Reason for rejection..." />
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowRejectInput(false)} className="btn-secondary flex-1">Cancel</button>
                                            <button onClick={() => updateStatus('rejected', { rejection_reason: rejectionReason })} disabled={!rejectionReason || updating}
                                                className="btn-danger flex-1">Confirm Reject</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {order.status === 'accepted' && (
                            <button onClick={() => updateStatus('in_progress')} disabled={updating}
                                className="btn-primary w-full py-3"><Package size={18}/> Start Work
                            </button>
                        )}
                        {(order.status === 'in_progress' || order.status === 'revision') && (
                            <button onClick={() => updateStatus('delivered')} disabled={updating}
                                className="btn-primary w-full py-3"><CheckCircle size={18}/> Mark as Delivered
                            </button>
                        )}
                    </div>
                )}

                {/* CLIENT ACTIONS */}
                {isClient && (
                    <div className="space-y-3">
                        {order.status === 'delivered' && order.payment_status === 'pending' && (
                            <div className="space-y-3">
                                {/* Razorpay Pay Button */}
                                <button
                                    onClick={handlePayNow}
                                    disabled={processingPayment}
                                    className="btn-primary w-full py-4 text-base"
                                >
                                    {processingPayment ? (
                                        <><span className="spinner w-5 h-5" /> Initiating Payment...</>
                                    ) : (
                                        <><IndianRupee size={20} /> Pay ₹{order.agreed_price} to Complete</>
                                    )}
                                </button>
                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 justify-center">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    Secured by Razorpay · UPI, Cards & Net Banking accepted
                                </div>
                                <button onClick={() => updateStatus('revision')} disabled={updating || order.revision_count >= order.max_revisions}
                                    className="btn-secondary w-full py-3">
                                    <RotateCcw size={18}/>
                                    {order.revision_count >= order.max_revisions
                                        ? 'Max revisions reached'
                                        : 'Request Revision'}
                                </button>
                            </div>
                        )}
                        {(order.status === 'pending' || order.status === 'accepted') && (
                            !showCancelInput ? (
                                <button onClick={() => setShowCancelInput(true)}
                                    className="btn-danger w-full py-3"><XCircle size={18}/> Cancel Order
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <textarea value={cancellationReason} onChange={e => setCancellationReason(e.target.value)}
                                        className="input-field resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" rows={3} placeholder="Reason for cancellation..." />
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowCancelInput(false)} className="btn-secondary flex-1">Back</button>
                                        <button onClick={() => updateStatus('cancelled', { cancellation_reason: cancellationReason })} disabled={!cancellationReason || updating}
                                            className="btn-danger flex-1">Confirm Cancel</button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Completed notice */}
                {order.status === 'completed' && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                        <CheckCircle size={22} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-emerald-800 dark:text-emerald-400">Order Completed!</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-500">Completed on {new Date(order.completed_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                        </div>
                    </div>
                )}

                {/* Rejection notice */}
                {order.status === 'rejected' && order.rejection_reason && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                        <p className="font-bold text-red-800 dark:text-red-400">Order Rejected</p>
                        <p className="text-sm text-red-600 dark:text-red-500 mt-1">{order.rejection_reason}</p>
                    </div>
                )}

                {/* Cancellation notice */}
                {order.status === 'cancelled' && order.cancellation_reason && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl">
                        <p className="font-bold text-gray-800 dark:text-gray-200">Order Cancelled</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{order.cancellation_reason}</p>
                    </div>
                )}
            </div>

            {/* Review Card — client writes/edits, provider replies */}
            {(isClient || isProvider) && order.status === 'completed' && (isProvider ? !!review : true) && (
                <div className="card dark:bg-surface-850 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        {isClient ? (review ? 'Your Review' : 'Leave a Review') : 'Client Review'}
                    </h2>

                    {showReviewForm ? (
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Rating *</label>
                                <StarRating value={reviewRating} onChange={setReviewRating} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title</label>
                                <input type="text" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)}
                                    className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Brief summary of your experience" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Comment</label>
                                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                                    className="input-field resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" rows={4} placeholder="Tell others about this service..." />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowReviewForm(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={submittingReview} className="btn-primary flex-1">
                                    {submittingReview ? 'Saving...' : (review ? 'Save Changes' : 'Submit Review')}
                                </button>
                            </div>
                        </form>
                    ) : review ? (
                        <div className="space-y-3">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                                <div className="flex gap-0.5 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} className={i < review.rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}
                                            fill={i < review.rating ? 'currentColor' : 'none'} />
                                    ))}
                                </div>
                                {review.title && <p className="font-semibold text-gray-900 dark:text-white text-sm">{review.title}</p>}
                                {review.comment && <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{review.comment}</p>}
                                {isProvider && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">by {review.reviewer?.full_name}</p>}
                                {isClient && (
                                    <button onClick={startEditReview} className="mt-3 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                                        ✏️ Edit review
                                    </button>
                                )}
                            </div>

                            {/* Provider reply */}
                            {showReplyForm ? (
                                <form onSubmit={handleSubmitReply} className="space-y-2">
                                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                                        className="input-field resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        placeholder="Write your reply to this review (min 10 characters)..." />
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setShowReplyForm(false)} className="btn-secondary flex-1">Cancel</button>
                                        <button type="submit" disabled={submittingReply || replyText.trim().length < 10} className="btn-primary flex-1">
                                            {submittingReply ? 'Posting...' : 'Post Reply'}
                                        </button>
                                    </div>
                                </form>
                            ) : review.provider_response ? (
                                <div className="p-4 ml-4 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 rounded-xl">
                                    <p className="text-xs font-bold text-primary-700 dark:text-primary-400 mb-1">Provider's reply</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{review.provider_response}</p>
                                    {isProvider && (
                                        <button onClick={() => { setReplyText(review.provider_response); setShowReplyForm(true); }}
                                            className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">✏️ Edit reply</button>
                                    )}
                                </div>
                            ) : isProvider ? (
                                <button onClick={() => { setReplyText(''); setShowReplyForm(true); }} className="btn-outline w-full py-3">
                                    💬 Reply to this review
                                </button>
                            ) : null}
                        </div>
                    ) : (
                        <button onClick={startEditReview} className="btn-outline w-full py-3">
                            <Star size={18} /> Write a Review
                        </button>
                    )}
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && (
                <PaymentReceiptModal
                    order={order}
                    transaction={paymentTransaction}
                    onClose={() => setShowReceipt(false)}
                />
            )}
        </div>
    );
}
