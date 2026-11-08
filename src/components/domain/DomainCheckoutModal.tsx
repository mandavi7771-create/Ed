import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  QrCode,
  Smartphone,
  Building,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';

interface DomainCheckoutModalProps {
  domainItem: {
    domainName: string;
    tld: string;
    isPromo1Rupee?: boolean;
    promotionalPrice?: number;
    firstYearPrice: number;
    secondYearPrice: number;
    thirdYearPrice: number;
    renewalPrice: number;
    transferPrice: number;
    minRegistrationPeriodYears?: number;
    termsNotice?: string;
    periods?: any;
  };
  onSuccess: (domain: any) => void;
  onClose: () => void;
}

export const DomainCheckoutModal: React.FC<DomainCheckoutModalProps> = ({
  domainItem,
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();

  const minYears = domainItem.isPromo1Rupee
    ? Math.max(1, domainItem.minRegistrationPeriodYears || 1)
    : 1;

  const [periodYears, setPeriodYears] = useState<number>(minYears);
  const [step, setStep] = useState<'details' | 'payment' | 'provisioning' | 'completed'>('details');

  // Registrant Details Form
  const [firstName, setFirstName] = useState(user?.fullName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.fullName?.split(' ')[1] || 'Customer');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '+91 9876543210');
  const [company, setCompany] = useState(user?.companyName || '');
  const [address, setAddress] = useState(user?.address || 'MG Road');
  const [city, setCity] = useState(user?.city || 'Bengaluru');
  const [state, setState] = useState(user?.state || 'Karnataka');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '560001');
  const [country, setCountry] = useState(user?.country || 'India');

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<'upi_qr' | 'upi_id' | 'card' | 'netbanking'>('upi_qr');
  const [upiIdInput, setUpiIdInput] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [bank, setBank] = useState('HDFC Bank');

  // Processing & Error State
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredDomain, setRegisteredDomain] = useState<any | null>(null);
  const [provisioningStatus, setProvisioningStatus] = useState<string>('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number; amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Calculations for Transparent Multi-Year Breakdown
  const isPromo = Boolean(domainItem.isPromo1Rupee);
  const year1 = isPromo ? (domainItem.promotionalPrice ?? 1) : domainItem.firstYearPrice;
  const year2 = domainItem.secondYearPrice || domainItem.renewalPrice;
  const year3 = domainItem.thirdYearPrice || domainItem.renewalPrice;

  let baseSubtotal = year1;
  if (periodYears >= 2) baseSubtotal += year2;
  if (periodYears >= 3) baseSubtotal += year3;

  const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
  const discountedSubtotal = Math.max(0, baseSubtotal - discountAmount);
  const gst = Math.round(discountedSubtotal * 0.18);
  const totalAmount = discountedSubtotal + gst;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.applyCoupon(couponCode.trim().toUpperCase(), baseSubtotal, isPromo);
      if (res.valid) {
        setAppliedDiscount({
          code: couponCode.trim().toUpperCase(),
          percent: res.discountPercent,
          amount: res.discountAmount,
        });
        setCouponError(null);
      } else {
        setCouponError(res.message || 'Invalid coupon code');
        setAppliedDiscount(null);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Coupon validation failed');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !mobile || !address || !city || !state || !postalCode) {
      setErrorMessage('Please fill in all required registrant contact fields.');
      return;
    }
    setErrorMessage(null);
    setStep('payment');
  };

  const handleExecutePaymentAndRegister = async () => {
    if (!user) {
      setErrorMessage('Please log in to register your domain.');
      return;
    }

    setProcessing(true);
    setErrorMessage(null);
    setStep('provisioning');

    try {
      setProvisioningStatus('Initiating secure payment transaction with gateway...');
      await new Promise((r) => setTimeout(r, 600));

      // 1. Create Order in Billing System
      const orderRes = await api.createOrder({
        customerId: user.id,
        type: 'domain',
        itemId: domainItem.domainName,
        itemTitle: `Domain Registration: ${domainItem.domainName} (${periodYears} Year${periodYears > 1 ? 's' : ''}${isPromo ? ' - ₹1 Promo' : ''})`,
        subtotal: baseSubtotal,
        couponCode: appliedDiscount?.code,
        isPromoOffer: isPromo,
      });

      setProvisioningStatus('Verifying payment and generating cryptographic auth token...');
      await new Promise((r) => setTimeout(r, 700));

      // 2. Simulate & Verify Gateway Payment
      const paymentRes = await api.verifyPayment({
        orderId: orderRes.order.id,
        gatewayOrderId: orderRes.gatewayOrderId,
        paymentMethod: paymentMethod === 'upi_qr' || paymentMethod === 'upi_id' ? 'UPI' : paymentMethod === 'card' ? 'Credit_Card' : 'NetBanking',
        methodDetails: paymentMethod === 'upi_qr' ? 'UPI QR Code Scan' : paymentMethod === 'upi_id' ? `UPI ID: ${upiIdInput}` : paymentMethod === 'card' ? `Card ending ${cardNumber.slice(-4)}` : `${bank} NetBanking`,
      });

      setProvisioningStatus('Connecting to Authoritative Domain Registrar & submitting ICANN contact record...');
      await new Promise((r) => setTimeout(r, 800));

      // 3. Register Domain authoritatively via Backend
      const purchaseRes = await api.purchaseDomain({
        customerId: user.id,
        domainName: domainItem.domainName,
        periodYears,
        registrationPrice: year1,
        renewalPrice: domainItem.renewalPrice,
        isPromo,
        paymentId: paymentRes.payment.id,
        registrantDetails: {
          firstName,
          lastName,
          company,
          email,
          mobile,
          address,
          city,
          state,
          postalCode,
          country,
        },
      });

      setProvisioningStatus('Allocating DNS Zone records & issuing whois privacy protection...');
      await new Promise((r) => setTimeout(r, 600));

      setRegisteredDomain(purchaseRes.domain);
      setStep('completed');
    } catch (err: any) {
      setStep('payment');
      setErrorMessage(err.message || 'Domain registration failed. Please review your parameters.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-base">{domainItem.domainName}</span>
                {isPromo ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> ₹1 Offer Active
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Standard Registry Rate
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Authoritative Domain Registration & ICANN Registrant Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Registration Term & Registrant Details */}
          {step === 'details' && (
            <form onSubmit={handleProceedToPayment} className="space-y-5">
              {/* Registration Period Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Registration Period
                </label>

                {minYears > 1 && isPromo && (
                  <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Special ₹1 Offer Commitment Requirement</p>
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        This promotional offer requires a minimum commitment of {minYears} years. 1st Year is ₹1; Year 2 & 3 are at standard renewal rate. Full transparent price is shown below.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((yrs) => {
                    const isDisabled = isPromo && yrs < minYears;
                    const isSelected = periodYears === yrs;

                    let yrSubtotal = year1;
                    if (yrs >= 2) yrSubtotal += year2;
                    if (yrs >= 3) yrSubtotal += year3;
                    const yrTotal = yrSubtotal + Math.round(yrSubtotal * 0.18);

                    return (
                      <button
                        type="button"
                        key={yrs}
                        disabled={isDisabled}
                        onClick={() => setPeriodYears(yrs)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isDisabled
                            ? 'opacity-40 bg-slate-950 border-slate-800 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">{yrs} Year{yrs > 1 ? 's' : ''}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div className="mt-1 font-mono font-bold text-sm text-emerald-400">
                          ₹{yrTotal}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {yrs === 1 ? 'Incl. 18% GST' : `Incl. ₹${year2}/yr renewal + GST`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Complete Transparent Pricing Breakdown (No Hidden Fees) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <span>Price Itemization & Terms</span>
                  <span>Amount (INR)</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>First Year Registration {isPromo ? '(Promotional ₹1 Offer)' : ''}:</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{year1}</span>
                </div>

                {periodYears >= 2 && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Second Year Price (Renewal Rate):</span>
                    <span className="font-mono text-slate-200">₹{year2}</span>
                  </div>
                )}

                {periodYears >= 3 && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Third Year Price (Renewal Rate):</span>
                    <span className="font-mono text-slate-200">₹{year3}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">₹{baseSubtotal}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex items-center justify-between text-emerald-400 font-semibold">
                    <span>Monthly Promo Discount ({appliedDiscount.percent}%):</span>
                    <span className="font-mono">-₹{appliedDiscount.amount}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-400">
                  <span>Applicable GST (18% itemized):</span>
                  <span className="font-mono text-slate-300">₹{gst}</span>
                </div>

                <div className="flex items-center justify-between font-bold text-white text-sm pt-2 border-t border-slate-800">
                  <span>Total Final Payable Amount:</span>
                  <span className="font-mono text-emerald-400 text-base">₹{totalAmount}</span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    <span className="text-slate-500 block">Subsequent Renewal:</span>
                    <span className="font-mono text-slate-300 font-semibold">₹{domainItem.renewalPrice}/yr</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Transfer Out / In:</span>
                    <span className="font-mono text-slate-300 font-semibold">₹{domainItem.transferPrice}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 italic mt-1">
                  * No hidden fees or unauthorized add-ons. Full DNS Management, WHOIS Privacy Protection, and Let's Encrypt SSL are included at ₹0.
                </p>
              </div>

              {/* Registrant Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Registrant Contact Information (ICANN Required)
                  </label>
                  <span className="text-[10px] text-slate-500">Auto-filled from profile</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Company / Organization (Optional)</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">PIN / Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  Proceed to Payment (₹{totalAmount})
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment Gateway Selection */}
          {step === 'payment' && (
            <div className="space-y-5">
              {/* Price Breakdown Card with Coupon Support */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Total Final Amount to Pay:</span>
                    <span className="font-mono text-2xl font-black text-emerald-400">₹{totalAmount}</span>
                    <span className="text-[11px] text-slate-500 block">Includes 18% GST (₹{gst})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-slate-300 font-semibold block">{domainItem.domainName}</span>
                    <span className="text-[11px] text-blue-400 font-medium">{periodYears} Year Registration</span>
                  </div>
                </div>

                {/* Subtotal & Discount Row */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                  <span>Base Rate: <strong className="text-slate-300 font-mono">₹{baseSubtotal}</strong></span>
                  {appliedDiscount && (
                    <span className="text-emerald-400 font-semibold">
                      Discount ({appliedDiscount.percent}% OFF): <strong className="font-mono">-₹{appliedDiscount.amount}</strong>
                    </span>
                  )}
                  <span>Itemized GST (18%): <strong className="text-slate-300 font-mono">₹{gst}</strong></span>
                </div>

                {/* Monthly Coupon Code Form */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Monthly Coupon (e.g. DOMAIN20NOV, DOMAIN30NOV)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500 uppercase placeholder:normal-case placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      {applyingCoupon ? 'Checking...' : 'Apply Coupon'}
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{couponError}</span>
                    </p>
                  )}

                  {appliedDiscount && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded-lg">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Coupon <strong>{appliedDiscount.code}</strong> applied ({appliedDiscount.percent}% OFF)!</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedDiscount(null);
                          setCouponCode('');
                        }}
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Payment Method
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi_qr')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-colors ${
                      paymentMethod === 'upi_qr'
                        ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>UPI QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi_id')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-colors ${
                      paymentMethod === 'upi_id'
                        ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span>UPI ID / VPA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-colors ${
                      paymentMethod === 'card'
                        ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Debit / Credit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-colors ${
                      paymentMethod === 'netbanking'
                        ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Building className="w-5 h-5" />
                    <span>Net Banking</span>
                  </button>
                </div>

                {/* Payment Detail Form */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  {paymentMethod === 'upi_qr' && (
                    <div className="flex flex-col items-center text-center py-2 space-y-2">
                      <div className="p-3 bg-white rounded-xl shadow-md">
                        <div className="w-36 h-36 bg-slate-100 flex items-center justify-center border border-slate-300 rounded-lg">
                          <QrCode className="w-28 h-28 text-slate-900" />
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-200">Scan with GPay, PhonePe, Paytm, or BHIM</p>
                      <p className="text-[11px] text-slate-500">UPI ID: nexoracloud@icici &bull; Amount: ₹{totalAmount}</p>
                    </div>
                  )}

                  {paymentMethod === 'upi_id' && (
                    <div className="space-y-2 text-xs">
                      <label className="text-slate-300 block font-semibold">Enter your UPI ID / VPA</label>
                      <input
                        type="text"
                        value={upiIdInput}
                        onChange={(e) => setUpiIdInput(e.target.value)}
                        placeholder="yourname@okaxis or mobile@paytm"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-[11px] text-slate-500">Payment collect request will be sent to your mobile app.</p>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-300 block font-semibold mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-300 block font-semibold mb-1">Expiry</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 block font-semibold mb-1">CVV</label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <div className="space-y-2 text-xs">
                      <label className="text-slate-300 block font-semibold">Select Your Bank</label>
                      <select
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="State Bank of India">State Bank of India (SBI)</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  &larr; Back to Details
                </button>

                <button
                  type="button"
                  onClick={handleExecutePaymentAndRegister}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <Lock className="w-4 h-4" />
                  Pay ₹{totalAmount} & Register Domain
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Real Registrar Provisioning Screen */}
          {step === 'provisioning' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-emerald-500/20" />
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Registering Domain With Authoritative Registrar</h3>
                <p className="text-xs text-slate-400 mt-1">{provisioningStatus}</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-500 font-mono">
                Domain: {domainItem.domainName} &bull; Registry: ICANN Authoritative
              </div>
            </div>
          )}

          {/* STEP 4: Success & Confirmation */}
          {step === 'completed' && registeredDomain && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Domain Registered Successfully!</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Your domain <strong className="text-white font-mono">{registeredDomain.domainName}</strong> is now authoritatively confirmed and active in your Nexora account.
                </p>
              </div>

              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-left space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Registrar Transaction ID:</span>
                  <span className="font-mono text-white font-bold">{registeredDomain.registrarTxId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Authoritative Registrar:</span>
                  <span className="text-slate-200">{registeredDomain.registrar}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Registration Period:</span>
                  <span className="text-slate-200">{registeredDomain.registrationPeriodYears} Year(s)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Expiry Date:</span>
                  <span className="font-mono text-emerald-400">
                    {new Date(registeredDomain.expiryDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Nameservers:</span>
                  <span className="font-mono text-slate-300">
                    {registeredDomain.nameservers.join(', ')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSuccess(registeredDomain);
                  onClose();
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                Go to My Domains Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
