import { createPortal } from 'react-dom';
import { X, CheckCircle, Printer, ShieldCheck } from 'lucide-react';

const METHOD_LABELS = {
    card: 'Card',
    upi: 'UPI',
    netbanking: 'Net Banking',
    wallet: 'Wallet',
    emi: 'EMI',
};

const fmtINR = (n) =>
    Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
    new Date(d).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

function Row({ label, children, mono }) {
    return (
        <div className="flex justify-between items-start gap-4 py-2.5 border-b border-dashed border-gray-200 dark:border-gray-700 last:border-0">
            <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">{label}</span>
            <span className={`text-sm text-right font-semibold text-gray-900 dark:text-gray-100 break-all ${mono ? 'font-mono text-xs' : ''}`}>
                {children}
            </span>
        </div>
    );
}

export default function PaymentReceiptModal({ order, transaction, onClose }) {
    if (!transaction) return null;

    const total = transaction.amount_paise / 100;
    const methodKey = transaction.payment_method || order?.payment_method;
    const methodLabel = METHOD_LABELS[methodKey] || methodKey || 'Online';
    const paidAt = fmtDate(transaction.updated_at);
    const receiptNo = `RCP-${order?.order_number || transaction.id}`;
    const serviceTitle = order?.service_title || order?.service?.title || 'Campus Service';

    return createPortal(
        <div className="receipt-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
            <style>{`
                @media print {
                    body > *:not(.receipt-overlay) { display: none !important; }
                    .receipt-overlay { position: static !important; display: block !important; background: #fff !important; backdrop-filter: none !important; padding: 0 !important; opacity: 1 !important; animation: none !important; }
                    .receipt-sheet { box-shadow: none !important; border: 1px solid #ddd !important; margin: 0 auto !important; max-width: 560px !important; background: #fff !important; }
                    .receipt-sheet .text-gray-100, .receipt-sheet .text-gray-900 { color: #111827 !important; }
                    .receipt-sheet .text-gray-500, .receipt-sheet .text-gray-400 { color: #6b7280 !important; }
                    .receipt-sheet .text-emerald-600, .receipt-sheet .text-emerald-700, .receipt-sheet .text-emerald-400 { color: #047857 !important; }
                    .receipt-sheet .bg-gray-50, .receipt-sheet [class*="dark:bg-gray-800"] { background: #f9fafb !important; }
                    .receipt-sheet .bg-emerald-50 { background: #ecfdf5 !important; }
                    .receipt-sheet .bg-gradient-to-r * { color: #fff !important; }
                    .no-print { display: none !important; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>

            <div className="receipt-sheet bg-white dark:bg-surface-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white relative">
                    <button onClick={onClose} className="no-print absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <X size={22} />
                    </button>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <div className="text-lg font-black tracking-tight">SkillSphere</div>
                            <div className="text-[11px] text-white/80">Campus Skill Marketplace · CEC</div>
                        </div>
                        <div className="text-right pr-8 print:pr-0">
                            <div className="text-[10px] uppercase tracking-widest text-white/70">Payment Receipt</div>
                            <div className="text-xs font-mono font-semibold">{receiptNo}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <CheckCircle size={28} />
                        </div>
                        <div>
                            <div className="text-xs text-white/80">Payment Successful</div>
                            <div className="text-3xl font-black leading-tight">₹{fmtINR(total)}</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Parties */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-3">
                            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Billed To</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order?.client?.full_name || '—'}</div>
                            <div className="text-xs text-gray-500 break-all">{order?.client?.email}</div>
                        </div>
                        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-3">
                            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Service Provider</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order?.provider?.full_name || '—'}</div>
                            <div className="text-xs text-gray-500 break-all">{order?.provider?.email}</div>
                        </div>
                    </div>

                    {/* Line item */}
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="flex justify-between bg-gray-50 dark:bg-gray-800/50 px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-gray-500">
                            <span>Description</span>
                            <span>Amount</span>
                        </div>
                        <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{serviceTitle}</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">₹{fmtINR(total)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-sm font-black text-emerald-700 dark:text-emerald-400">
                            <span>Total Paid</span>
                            <span>₹{fmtINR(total)}</span>
                        </div>
                    </div>

                    {/* Details */}
                    <div>
                        <Row label="Order No.">#{order?.order_number}</Row>
                        <Row label="Transaction ID" mono>{transaction.razorpay_payment_id || '—'}</Row>
                        <Row label="Gateway Ref." mono>{transaction.razorpay_order_id || '—'}</Row>
                        <Row label="Payment Method">{methodLabel}</Row>
                        <Row label="Paid On">{paidAt}</Row>
                        <Row label="Status">
                            <span className="text-emerald-600 dark:text-emerald-400">Paid ✓</span>
                        </Row>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 text-center">
                        <ShieldCheck size={14} />
                        Computer-generated receipt — no signature required. Thank you for using SkillSphere!
                    </div>
                </div>

                {/* Actions */}
                <div className="no-print px-6 pb-6 flex gap-3">
                    <button onClick={() => window.print()} className="btn-secondary flex-1 text-sm gap-2">
                        <Printer size={16} /> Print / Save PDF
                    </button>
                    <button onClick={onClose} className="btn-primary flex-1 text-sm">Done</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
