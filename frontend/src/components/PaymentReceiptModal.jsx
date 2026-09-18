import { X, CheckCircle, IndianRupee, Hash, CreditCard, Clock, Download } from 'lucide-react';

const METHOD_LABELS = {
    card: '💳 Card',
    upi: '📱 UPI',
    netbanking: '🏦 Net Banking',
    wallet: '👜 Wallet',
    emi: '📅 EMI',
};

export default function PaymentReceiptModal({ order, transaction, onClose }) {
    if (!transaction) return null;

    const amountINR = (transaction.amount_paise / 100).toFixed(2);
    const paidAt = new Date(transaction.updated_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
    const methodLabel = METHOD_LABELS[transaction.payment_method] || transaction.payment_method || 'Card';

    const handlePrint = () => window.print();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X size={22} />
                    </button>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={36} className="text-white" />
                    </div>
                    <h2 className="text-xl font-black text-white mb-1">Payment Successful!</h2>
                    <p className="text-white/80 text-sm">Your payment has been confirmed</p>
                    <div className="mt-4 text-4xl font-black text-white">
                        ₹{amountINR}
                    </div>
                </div>

                {/* Receipt Details */}
                <div className="p-6 space-y-4">
                    {/* Service */}
                    <div className="flex justify-between items-start py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Service</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right max-w-[60%]">
                            {order?.service_title || order?.service?.title || 'Campus Service'}
                        </div>
                    </div>

                    {/* Order Number */}
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            <Hash size={14} /> Order No.
                        </div>
                        <div className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                            #{order?.order_number}
                        </div>
                    </div>

                    {/* Transaction ID */}
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            <IndianRupee size={14} /> Transaction ID
                        </div>
                        <div className="text-xs font-mono font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-lg">
                            {transaction.razorpay_payment_id || '—'}
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            <CreditCard size={14} /> Method
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{methodLabel}</div>
                    </div>

                    {/* Date */}
                    <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            <Clock size={14} /> Paid On
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{paidAt}</div>
                    </div>

                    {/* Status chip */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 text-center">
                        <p className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                            ✅ Payment captured & order completed
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-1">
                            Verified by Razorpay — Transaction reference: {transaction.razorpay_order_id}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={handlePrint} className="btn-secondary flex-1 text-sm gap-2">
                        <Download size={16} /> Save Receipt
                    </button>
                    <button onClick={onClose} className="btn-primary flex-1 text-sm">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
