import React, { useState } from 'react';
import { api } from '../../services/api';
import { Order, PaymentTransaction } from '../../types';
import { QrCode, CreditCard, Landmark, ShieldCheck, CheckCircle2, AlertCircle, Loader2, X, Lock } from 'lucide-react';

interface PaymentModalProps {
  order: Order;
  gatewayOrderId: string;
  upiUri: string;
  onSuccess: (payment: PaymentTransaction, updatedOrder: Order) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ order, gatewayOrderId, upiUri, onSuccess, onClose }) => {
  const [method, setMethod] = useState<'UPI' | 'Credit_Card' | 'Debit_Card' | 'NetBanking'>('UPI');
  const [upiVpa, setUpiVpa] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Generate UPI QR Code URL via free reliable QR server
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;

  const handlePay = async () => {
    setError(null);

    // Validation
    if (method === 'UPI' && !upiVpa && false) {
      // UPI QR is pre-displayed, so UPI ID is optional if customer scans QR
    }

    if (method === 'Credit_Card' || method === 'Debit_Card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 15) {
        setError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry || !cardExpiry.includes('/')) {
        setError('Please enter expiry in MM/YY format.');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setError('Please enter a valid CVV.');
        return;
      }

      // Trigger 3D Secure OTP verification
      setShowOtpModal(true);
      return;
    }

    await executePaymentVerification(`${method} Gateway Payment`);
  };

  const executePaymentVerification = async (details: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const idempotencyKey = `idemp_${order.id}_${Date.now()}`;
      const res = await api.verifyPayment({
        orderId: order.id,
        gatewayOrderId,
        paymentMethod: method,
        methodDetails: details,
        idempotencyKey,
      });

      onSuccess(res.payment, res.order);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please retry.');
    } finally {
      setIsProcessing(false);
      setShowOtpModal(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setError('Please enter the 4 or 6-digit OTP code.');
      return;
    }
    const last4 = cardNumber.slice(-4);
    await executePaymentVerification(`${method}: **** **** **** ${last4}`);
  };

  const fillTestCard = () => {
    setCardNumber('4111 2222 3333 4242');
    setCardExpiry('12/28');
    setCardCvv('789');
    setCardName(order.customerName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Nexora Secure Checkout</h3>
              <p className="text-[11px] text-slate-400">256-Bit TLS Authoritative Payment Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Order Summary Strip */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-medium">{order.itemTitle}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                <span>Subtotal: ₹{order.subtotal}</span>
                <span>·</span>
                <span>GST (18%): ₹{order.taxAmount}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Total Payable</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">₹{order.totalAmount}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  method === 'UPI'
                    ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="font-medium">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('Debit_Card')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  method === 'Debit_Card' || method === 'Credit_Card'
                    ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('NetBanking')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  method === 'NetBanking'
                    ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Landmark className="w-5 h-5" />
                <span className="font-medium">Net Banking</span>
              </button>
            </div>
          </div>

          {/* Method Content: UPI */}
          {method === 'UPI' && (
            <div className="space-y-4 pt-1">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="bg-white p-2 rounded-lg shrink-0">
                  <img src={qrCodeUrl} alt="UPI QR Code" className="w-28 h-28" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">Scan QR with any UPI App</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Google Pay, PhonePe, Paytm, CRED, BHIM, or any banking UPI app.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={upiUri}
                      className="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-[11px]"
                    >
                      Open UPI App Directly
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Or enter UPI ID / VPA</label>
                <input
                  type="text"
                  placeholder="username@okaxis or mobile@upi"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Method Content: Cards */}
          {(method === 'Debit_Card' || method === 'Credit_Card') && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('Debit_Card')}
                    className={`px-2.5 py-1 rounded text-[11px] ${method === 'Debit_Card' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('Credit_Card')}
                    className={`px-2.5 py-1 rounded text-[11px] ${method === 'Credit_Card' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    Credit Card
                  </button>
                </div>
                <button
                  type="button"
                  onClick={fillTestCard}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Autofill Test Card
                </button>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="4111 2222 3333 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="789"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="Name on Card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Method Content: NetBanking */}
          {method === 'NetBanking' && (
            <div className="space-y-3 pt-1">
              <label className="block text-slate-400">Select Bank</label>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBank(b)}
                    className={`p-2.5 rounded-lg border text-left transition-colors text-xs ${
                      selectedBank === b
                        ? 'bg-blue-950/50 border-blue-500 text-blue-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted PCI-DSS compliant</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-2 shadow-sm shadow-emerald-600/30 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Pay ₹{order.totalAmount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3D Secure OTP Modal Simulation */}
      {showOtpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <form
            onSubmit={handleOtpSubmit}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm">Bank 3D-Secure Verification</span>
              <button type="button" onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              An OTP has been dispatched to your bank-registered mobile number ending in **42. Demo OTP: <strong>4488</strong>.
            </p>
            <div>
              <input
                type="text"
                autoFocus
                placeholder="Enter 4-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs"
            >
              {isProcessing ? 'Verifying with Bank...' : 'Authorize Transaction'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
