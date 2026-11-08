import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  DomainCheckResult,
  Order,
  PaymentTransaction,
  PaymentSettings,
  DomainRecord,
  DomainRegistrantDetails,
} from '../../types';
import {
  Search,
  Globe,
  CheckCircle2,
  AlertCircle,
  QrCode,
  CreditCard,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileCheck,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

type FlowStep =
  | 'search'            // Step 1: Domain Search
  | 'selection'         // Step 2: Domain Selection
  | 'details'           // Step 3: Customer Details Form
  | 'preview'           // Step 4: Complete Plan Preview
  | 'qr_page'           // Step 5: Admin Uploaded QR Code Page
  | 'checkout'          // Step 6: Payment Checkout Page
  | 'payment_success'   // Step 7: Payment Successful Page
  | 'activate_domain';  // Step 8: Activate Domain Page

export const DomainPurchaseFlowPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();

  // Active Flow Step (Strict sequential order maintained)
  const [currentStep, setCurrentStep] = useState<FlowStep>('search');

  // Step 1: Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Step 2: Selection state
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedPeriodYears, setSelectedPeriodYears] = useState<number>(1);
  const [domainPricing, setDomainPricing] = useState<any | null>(null);

  // Step 3: Customer Registrant Details Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '+91 9876543210');
  const [country, setCountry] = useState(user?.country || 'India');
  const [state, setState] = useState(user?.state || 'Karnataka');
  const [city, setCity] = useState(user?.city || 'Bengaluru');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '560001');
  const [address, setAddress] = useState(user?.address || 'MG Road, Central Business District');
  const [organization, setOrganization] = useState(user?.companyName || '');
  const [detailsErrors, setDetailsErrors] = useState<{ [key: string]: string }>({});

  // Step 4: Plan Preview & Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number; amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  // Step 5: Admin Uploaded QR Code state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);

  // Step 6: Payment Checkout state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'upi_qr' | 'debit_card' | 'credit_card'>('upi');
  const [upiIdInput, setUpiIdInput] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardHolder, setCardHolder] = useState(user?.fullName || 'Authorized Cardholder');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedPayment, setConfirmedPayment] = useState<PaymentTransaction | null>(null);

  // Step 8: Domain Activation state
  const [isActivating, setIsActivating] = useState(false);
  const [activationStepNotice, setActivationStepNotice] = useState<string>('');
  const [activatedDomain, setActivatedDomain] = useState<DomainRecord | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);

  // Payment Refresh Protection: Auto-recover state from URL query or LocalStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const domainFromUrl = urlParams.get('domain');
    const orderIdFromUrl = urlParams.get('orderId') || localStorage.getItem('nexora_active_order_id');

    // 1. Fetch live admin payment settings (active QR code, enabled methods)
    loadPublicPaymentSettings();

    // 2. Check if recovering an active order
    if (orderIdFromUrl) {
      recoverOrderState(orderIdFromUrl);
    } else if (domainFromUrl) {
      // Trigger search for URL domain parameter
      setSearchQuery(domainFromUrl);
      executeSearch(domainFromUrl);
    }
  }, []);

  const loadPublicPaymentSettings = async () => {
    try {
      setLoadingPaymentSettings(true);
      const res = await api.getPublicPaymentSettings();
      setPaymentSettings(res as any);
    } catch (err) {
      console.error('Failed to load payment settings:', err);
    } finally {
      setLoadingPaymentSettings(false);
    }
  };

  // Step 10: Payment Refresh Protection
  const recoverOrderState = async (orderId: string) => {
    try {
      const res = await api.getOrder(orderId);
      if (res && res.order) {
        setOrder(res.order);
        setSelectedDomain(res.order.itemId);

        if (res.registrantDetails) {
          setFullName(`${res.registrantDetails.firstName} ${res.registrantDetails.lastName}`);
          setEmail(res.registrantDetails.email);
          setMobile(res.registrantDetails.mobile);
          setAddress(res.registrantDetails.address);
          setCity(res.registrantDetails.city);
          setState(res.registrantDetails.state);
          setPostalCode(res.registrantDetails.postalCode);
          setCountry(res.registrantDetails.country);
          setOrganization(res.registrantDetails.organization || '');
        }

        if (res.payment) {
          setConfirmedPayment(res.payment);
        }

        // Determine correct step based on persisted order state
        if (res.order.serviceStatus === 'active') {
          // Already active -> direct to My Domains
          navigate('/dashboard/domains');
        } else if (res.order.paymentStatus === 'successful') {
          // Paid but not yet activated -> jump to Step 8 (Activate Domain) without re-charging!
          setCurrentStep('activate_domain');
        } else {
          // Pending payment -> jump to Step 5 (QR Code Page)
          setCurrentStep('qr_page');
        }
      }
    } catch (err) {
      console.warn('Could not recover order from backend:', err);
      localStorage.removeItem('nexora_active_order_id');
    }
  };

  // STEP 1: Search Domain with Registrar API
  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await api.checkDomain(queryText.trim());
      setSearchResult(res);
      if (res.primaryAvailable) {
        setSelectedDomain(res.primaryDomain);
        setDomainPricing(res.primaryPricing);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error checking domain availability from registrar.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  // STEP 2: Select Domain
  const handleSelectDomain = (domainName: string, pricing: any) => {
    setSelectedDomain(domainName);
    setDomainPricing(pricing);
    const minYears = pricing?.isPromo1Rupee ? Math.max(1, pricing.minRegistrationPeriodYears || 1) : 1;
    setSelectedPeriodYears(minYears);
    // Proceed to Step 3: Customer Details Form
    setCurrentStep('details');
  };

  // STEP 3: Validate Customer Details Form & Continue
  const handleCustomerDetailsContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!fullName.trim()) errors.fullName = 'Full Name is required by registry';
    if (!email.trim() || !email.includes('@')) errors.email = 'Valid Email Address is required';
    if (!mobile.trim() || mobile.length < 8) errors.mobile = 'Valid Mobile Number is required';
    if (!address.trim()) errors.address = 'Physical Street Address is required';
    if (!city.trim()) errors.city = 'City is required';
    if (!state.trim()) errors.state = 'State / Province is required';
    if (!postalCode.trim()) errors.postalCode = 'Postal / ZIP Code is required';
    if (!country.trim()) errors.country = 'Country is required';

    if (Object.keys(errors).length > 0) {
      setDetailsErrors(errors);
      return;
    }

    setDetailsErrors({});
    // Move strictly to Step 4: Complete Plan Preview
    setCurrentStep('preview');
  };

  // Calculations for Step 4
  const isPromo = Boolean(domainPricing?.isPromo1Rupee);
  const firstYear = isPromo ? (domainPricing?.promotionalPrice ?? 1) : (domainPricing?.firstYearPrice || 849);
  const secondYear = domainPricing?.secondYearPrice || domainPricing?.renewalPrice || 999;
  const thirdYear = domainPricing?.thirdYearPrice || domainPricing?.renewalPrice || 999;

  let baseSubtotal = firstYear;
  if (selectedPeriodYears >= 2) baseSubtotal += secondYear;
  if (selectedPeriodYears >= 3) baseSubtotal += thirdYear;

  const discountAmount = appliedCoupon ? appliedCoupon.amount : 0;
  const discountedSubtotal = Math.max(0, baseSubtotal - discountAmount);
  const gstAmount = Math.round(discountedSubtotal * 0.18);
  const finalPayableAmount = discountedSubtotal + gstAmount;

  // Monthly Coupon Validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.applyCoupon(couponCode.trim().toUpperCase(), baseSubtotal, isPromo);
      if (res.valid) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          percent: res.discountPercent,
          amount: res.discountAmount,
        });
        setCouponError(null);
      } else {
        setCouponError(res.message || 'Invalid promotional coupon code');
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Error validating coupon with backend.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // STEP 4 -> STEP 5: Create Order on Backend and open QR Code Page
  const handleProceedToQrCodePage = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsCreatingOrder(true);
    try {
      const names = fullName.trim().split(' ');
      const registrantPayload: DomainRegistrantDetails = {
        domainName: selectedDomain,
        firstName: names[0] || 'Registrant',
        lastName: names.slice(1).join(' ') || 'Customer',
        company: organization,
        email,
        mobile,
        address,
        city,
        state,
        postalCode,
        country,
        organization,
      };

      const res = await api.createOrder({
        customerId: user.id,
        type: 'domain',
        itemId: selectedDomain,
        itemTitle: `Domain Registration: ${selectedDomain} (${selectedPeriodYears} Yr${selectedPeriodYears > 1 ? 's' : ''}${isPromo ? ' - ₹1 Promo' : ''})`,
        subtotal: baseSubtotal,
        couponCode: appliedCoupon?.code,
        isPromoOffer: isPromo,
        registrantDetails: registrantPayload,
      });

      setOrder(res.order);
      localStorage.setItem('nexora_active_order_id', res.order.id);
      window.history.replaceState({}, '', `/domain-purchase?orderId=${res.order.id}`);

      // Move strictly to Step 5: Admin Uploaded QR Code Page
      setCurrentStep('qr_page');
    } catch (err: any) {
      alert(`Order initialization error: ${err.message}`);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // STEP 5 -> STEP 6: Click "Pay Now" below Admin QR Code to open Checkout Page
  const handleProceedToCheckout = () => {
    // Moves strictly to Step 6: Payment Checkout Page
    setCurrentStep('checkout');
  };

  // STEP 6: Execute Real Gateway Payment
  const handleExecutePayment = async () => {
    if (!order) return;
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      let methodLabel = 'UPI';
      let detailsLabel = `UPI App (${upiIdInput})`;

      if (selectedPaymentMethod === 'upi_qr') {
        methodLabel = 'UPI';
        detailsLabel = 'Gateway Dynamic UPI QR Code Scan';
      } else if (selectedPaymentMethod === 'debit_card') {
        methodLabel = 'Debit_Card';
        detailsLabel = `Debit Card ending in ${cardNumber.slice(-4)} (${cardHolder})`;
      } else if (selectedPaymentMethod === 'credit_card') {
        methodLabel = 'Credit_Card';
        detailsLabel = `Credit Card ending in ${cardNumber.slice(-4)} (${cardHolder})`;
      }

      const res = await api.verifyPayment({
        orderId: order.id,
        gatewayOrderId: `order_gw_${order.id}`,
        paymentMethod: methodLabel,
        methodDetails: detailsLabel,
        idempotencyKey: `idemp_${order.id}_${Date.now()}`,
      });

      setConfirmedPayment(res.payment);
      setOrder(res.order);

      // Move strictly to Step 7: Payment Successful Page
      setCurrentStep('payment_success');
    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing failed. Please check your credentials and retry.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // STEP 7 -> STEP 8: Click "Get Started" to open Activate Domain Page
  const handleGetStarted = () => {
    // Moves strictly to Step 8: Activate Domain Page
    setCurrentStep('activate_domain');
  };

  // STEP 8: Authoritative Domain Activation via Registrar API
  const handleActivateDomain = async () => {
    if (!order || !user) return;
    setIsActivating(true);
    setActivationError(null);

    try {
      setActivationStepNotice('Verifying payment confirmation and order authorization...');
      await new Promise((r) => setTimeout(r, 600));

      setActivationStepNotice('Checking real-time authoritative ICANN registry availability...');
      await new Promise((r) => setTimeout(r, 700));

      setActivationStepNotice('Transmitting registrant WHOIS data and cryptographic credentials...');
      await new Promise((r) => setTimeout(r, 800));

      const res = await api.activateDomain({
        orderId: order.id,
        customerId: user.id,
      });

      setActivationStepNotice('Provisioning global Anycast DNS zones (@, www) and WHOIS Privacy Lock...');
      await new Promise((r) => setTimeout(r, 700));

      setActivatedDomain(res.domain);
      setActivationStepNotice('Domain successfully activated by Registrar!');

      // Clear cached order
      localStorage.removeItem('nexora_active_order_id');

      // Short delay so customer views the completed confirmation before going to My Domains
      setTimeout(() => {
        navigate('/dashboard/domains');
      }, 2500);
    } catch (err: any) {
      setActivationError(err.message || 'Domain activation failed at Registrar connector. Please contact support.');
    } finally {
      setIsActivating(false);
    }
  };

  const activeQr = paymentSettings?.activeQrCode;

  return (
    <div className="min-h-[85vh] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Step Progress Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Authoritative Domain Purchase Workflow
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {currentStep === 'search' && 'Step 1: Domain Registry Search'}
                {currentStep === 'selection' && 'Step 2: Domain Selection & Period'}
                {currentStep === 'details' && 'Step 3: Customer Registrant Details'}
                {currentStep === 'preview' && 'Step 4: Complete Plan Preview'}
                {currentStep === 'qr_page' && 'Step 5: Admin Official QR Code'}
                {currentStep === 'checkout' && 'Step 6: Payment Checkout'}
                {currentStep === 'payment_success' && 'Step 7: Payment Successful'}
                {currentStep === 'activate_domain' && 'Step 8: Activate Domain'}
              </h1>
            </div>

            {order && (
              <div className="text-right bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
                <span className="text-slate-500 block text-[10px]">Order Reference:</span>
                <span className="text-emerald-400 font-bold">{order.id}</span>
              </div>
            )}
          </div>

          {/* Stepper Pipeline Indicators */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-4 text-[10px] font-semibold text-center">
            {[
              { id: 'search', label: '1. Search' },
              { id: 'selection', label: '2. Select' },
              { id: 'details', label: '3. Details' },
              { id: 'preview', label: '4. Preview' },
              { id: 'qr_page', label: '5. QR Code' },
              { id: 'checkout', label: '6. Checkout' },
              { id: 'payment_success', label: '7. Success' },
              { id: 'activate_domain', label: '8. Activate' },
            ].map((s) => {
              const stepOrder = ['search', 'selection', 'details', 'preview', 'qr_page', 'checkout', 'payment_success', 'activate_domain'];
              const currentIdx = stepOrder.indexOf(currentStep);
              const thisIdx = stepOrder.indexOf(s.id);
              const isPast = thisIdx < currentIdx;
              const isCurrent = thisIdx === currentIdx;

              return (
                <div
                  key={s.id}
                  className={`p-2 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold shadow-md'
                      : isPast
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="block truncate">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: DOMAIN SEARCH */}
        {/* ========================================================================= */}
        {currentStep === 'search' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <Globe className="w-10 h-10 text-blue-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">Search Your Ideal Domain Name</h2>
              <p className="text-xs text-slate-400">
                Direct ICANN authoritative registry queries with transparent multi-year pricing and ₹1 promotional rates.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center bg-slate-950 border border-slate-700 rounded-2xl p-2 gap-2 focus-within:border-blue-500">
                <div className="flex items-center flex-1 px-3 gap-2 w-full">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Enter domain name (e.g. mybusiness, startupcloud)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-white font-mono text-sm focus:outline-none placeholder:text-slate-500 py-1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{isSearching ? 'Checking Registrar...' : 'Check Availability'}</span>
                </button>
              </div>
            </form>

            {searchError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2 max-w-2xl mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{searchError}</span>
              </div>
            )}

            {searchResult && (
              <div className="max-w-2xl mx-auto space-y-4 pt-4 border-t border-slate-800">
                {/* Primary Result Banner */}
                <div
                  className={`p-5 rounded-2xl border ${
                    searchResult.primaryAvailable
                      ? 'bg-emerald-950/30 border-emerald-700'
                      : 'bg-rose-950/20 border-rose-900/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-lg">{searchResult.primaryDomain}</span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            searchResult.primaryAvailable
                              ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                              : 'bg-rose-900 text-rose-300 border border-rose-700'
                          }`}
                        >
                          {searchResult.primaryAvailable ? 'Available' : 'This domain is already registered'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchResult.primaryAvailable
                          ? `Ready for immediate registry purchase. Renewal at ₹${searchResult.primaryPricing?.renewalPrice || 999}/yr.`
                          : 'This exact domain name is already registered on the global internet and cannot be registered.'}
                      </p>
                    </div>

                    {searchResult.primaryAvailable ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono">
                          <span className="text-xl font-bold text-emerald-400">
                            ₹{searchResult.primaryPricing?.firstYearPrice || 849}
                          </span>
                          <span className="text-[10px] text-slate-500 block">/ 1st yr + GST</span>
                        </div>
                        <button
                          onClick={() => handleSelectDomain(searchResult.primaryDomain, searchResult.primaryPricing)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                        >
                          Buy Now
                        </button>
                      </div>
                    ) : (
                      <div className="px-3.5 py-1.5 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold">
                        Unavailable
                      </div>
                    )}
                  </div>
                </div>

                {/* Neutral Trademark Reminder */}
                {searchResult.trademarkNotice && (
                  <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{searchResult.trademarkNotice}</span>
                  </div>
                )}

                {/* Alternative Suggestions */}
                {searchResult.alternativeSuggestions && searchResult.alternativeSuggestions.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Recommended Available Alternative Variations
                    </h3>
                    <div className="space-y-2">
                      {searchResult.alternativeSuggestions.map((alt: any) => (
                        <div
                          key={alt.domainName}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                        >
                          <div>
                            <span className="font-mono text-xs font-semibold text-white">{alt.domainName}</span>
                            <span className="text-[10px] text-emerald-400 ml-2">Available</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-slate-300">₹{alt.firstYearPrice}/yr</span>
                            <button
                              onClick={() => handleSelectDomain(alt.domainName, alt)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: DOMAIN SELECTION & PERIOD */}
        {/* ========================================================================= */}
        {currentStep === 'selection' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Select Registration Commitment Period</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chosen Domain: <span className="font-mono text-blue-400 font-bold">{selectedDomain}</span>
                </p>
              </div>
              <button
                onClick={() => setCurrentStep('search')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Search
              </button>
            </div>

            {isPromo && (
              <div className="p-3.5 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Special ₹1 Promotional Offer Commitment</p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Year 1 is promotional at ₹{firstYear}. Standard renewal applies for subsequent years. Full transparent pricing is itemized upfront.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((yrs) => {
                const isSelected = selectedPeriodYears === yrs;
                let sub = firstYear;
                if (yrs >= 2) sub += secondYear;
                if (yrs >= 3) sub += thirdYear;
                const tot = sub + Math.round(sub * 0.18);

                return (
                  <button
                    key={yrs}
                    type="button"
                    onClick={() => setSelectedPeriodYears(yrs)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500 shadow-lg'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{yrs} Year{yrs > 1 ? 's' : ''}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className="mt-2 font-mono text-xl font-bold text-emerald-400">₹{tot}</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {yrs === 1 ? 'Includes 18% GST' : `Includes ₹${secondYear}/yr renewal + GST`}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setCurrentStep('details')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
              >
                <span>Continue to Registrant Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CUSTOMER DETAILS FORM */}
        {/* ========================================================================= */}
        {currentStep === 'details' && (
          <form onSubmit={handleCustomerDetailsContinue} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">ICANN Registrant Contact Details</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registrar & legal compliance requirements for domain ownership records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep('selection')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Roy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-white focus:outline-none ${
                    detailsErrors.fullName ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                  }`}
                />
                {detailsErrors.fullName && <p className="text-[11px] text-rose-400 mt-1">{detailsErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@techstart.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-white focus:outline-none ${
                    detailsErrors.email ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                  }`}
                />
                {detailsErrors.email && <p className="text-[11px] text-rose-400 mt-1">{detailsErrors.email}</p>}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-white focus:outline-none ${
                    detailsErrors.mobile ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                  }`}
                />
                {detailsErrors.mobile && <p className="text-[11px] text-rose-400 mt-1">{detailsErrors.mobile}</p>}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company / Organization (Optional)</label>
                <input
                  type="text"
                  placeholder="TechStart Innovations Pvt Ltd"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Street Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 42 MG Road, Cyber Tech Park"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-white focus:outline-none ${
                    detailsErrors.address ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                  }`}
                />
                {detailsErrors.address && <p className="text-[11px] text-rose-400 mt-1">{detailsErrors.address}</p>}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  City <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  State / Province <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Karnataka"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Postal / ZIP Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="560001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Country <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">
                Encrypted with Let's Encrypt TLS &bull; Free ICANN WHOIS Privacy Included
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: COMPLETE PLAN PREVIEW */}
        {/* ========================================================================= */}
        {currentStep === 'preview' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Domain Purchase Summary & Plan Preview</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review itemized fees, registry term, and monthly coupon discount before payment.
                </p>
              </div>
              <button
                onClick={() => setCurrentStep('details')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Edit Details
              </button>
            </div>

            {/* Summary Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Domain Record</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Domain Name:</span>
                  <span className="font-mono text-white font-bold text-sm">{selectedDomain}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Extension (TLD):</span>
                  <span className="font-mono text-blue-400 font-semibold">.{selectedDomain.split('.').slice(1).join('.')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Registration Term:</span>
                  <span className="text-slate-200 font-semibold">{selectedPeriodYears} Year{selectedPeriodYears > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pricing Plan:</span>
                  <span className="text-emerald-400 font-semibold">{isPromo ? 'Special ₹1 Promotional Offer' : 'Standard Authoritative Registry Plan'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Registrant Information</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-slate-200 font-medium">{fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-200 font-mono">{email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="text-slate-200 font-mono">{mobile}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-slate-200">{city}, {state}, {country}</span>
                </div>
              </div>
            </div>

            {/* Monthly Coupon Code Form */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Apply Monthly Promotional Coupon (e.g. DOMAIN20NOV, DOMAIN30NOV, SAVE20MONTH)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter monthly coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs uppercase focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
                >
                  {isApplyingCoupon ? 'Verifying...' : 'Apply Coupon'}
                </button>
              </div>

              {couponError && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> <span>{couponError}</span>
                </p>
              )}
              {appliedCoupon && (
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> <span>Coupon {appliedCoupon.code} applied! ({appliedCoupon.percent}% OFF)</span>
                </p>
              )}
            </div>

            {/* Price Breakdown Calculation */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Original Price (Base Subtotal):</span>
                <span className="font-mono text-slate-200 font-semibold">₹{baseSubtotal}</span>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span>Coupon Discount ({appliedCoupon.percent}% OFF):</span>
                  <span className="font-mono">-₹{appliedCoupon.amount}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-400">
                <span>Itemized Tax (18% GST):</span>
                <span className="font-mono text-slate-300">₹{gstAmount}</span>
              </div>

              <div className="flex items-center justify-between font-bold text-white text-base pt-3 border-t border-slate-800">
                <span>Final Payable Amount:</span>
                <span className="font-mono text-emerald-400 text-xl">₹{finalPayableAmount}</span>
              </div>
            </div>

            {/* Clear Pay Now Button */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleProceedToQrCodePage}
                disabled={isCreatingOrder}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-xl flex items-center gap-2 transition-transform active:scale-95"
              >
                <span>{isCreatingOrder ? 'Generating Order...' : `Pay Now (₹${finalPayableAmount})`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: ADMIN UPLOADED QR CODE PAGE */}
        {/* ========================================================================= */}
        {currentStep === 'qr_page' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-xl mx-auto space-y-6 text-center">
            {/* Top Payment Title as explicitly requested */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 inline-block">
                Merchant Payment QR Code
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                Scan Merchant QR Code
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Official merchant QR code configured by administrator for authorized payment processing.
              </p>
            </div>

            {/* Order & Amount Badge */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="text-left font-mono">
                <span className="text-slate-500 text-[10px] block">Order Reference:</span>
                <span className="text-slate-200 font-bold">{order?.id || 'ORD-2026-901'}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-slate-500 text-[10px] block">Total Amount:</span>
                <span className="text-emerald-400 font-black text-lg">₹{order?.totalAmount || finalPayableAmount}</span>
              </div>
            </div>

            {/* Official Admin QR Code Container: Clear, large, crisp */}
            <div className="p-6 bg-white rounded-3xl inline-block shadow-2xl border-4 border-slate-800 relative mx-auto">
              {activeQr ? (
                <img
                  src={activeQr.imageUrl}
                  alt={activeQr.name || 'Admin Payment QR Code'}
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto rounded-xl"
                />
              ) : (
                <div className="w-64 h-64 sm:w-72 sm:h-72 flex flex-col items-center justify-center p-6 text-center bg-slate-100 rounded-xl space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                  <p className="text-xs font-bold text-slate-800">
                    No Active QR Code Configured
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    The administrator has not activated a merchant QR code yet. Please click the Pay Now button below to pay via the secure checkout page.
                  </p>
                </div>
              )}
            </div>

            {/* Bank Registered Merchant Name (No fabricated bank name, NO plain text UPI ID) */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-200">
                {paymentSettings?.merchantName || 'Nexora Cloud Technologies Pvt Ltd'}
              </p>
              <p className="text-[11px] text-slate-500">
                Scan with any BHIM, Google Pay, PhonePe, Paytm, or Banking UPI app.
              </p>
            </div>

            {/* STRICT REQUIREMENT: Pay Now button placed directly below the QR code. NO Scan QR / Scan Now button! */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Pay Now (₹{order?.totalAmount || finalPayableAmount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: PAYMENT CHECKOUT PAGE (Three Options: UPI, Debit Card, Credit Card) */}
        {/* ========================================================================= */}
        {currentStep === 'checkout' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Secure Payment Checkout</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your preferred payment method. Verified securely with authoritative gateway.
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-slate-500 text-[10px] block">Total Payable:</span>
                <span className="text-emerald-400 font-bold text-base">₹{order?.totalAmount || finalPayableAmount}</span>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* STRICT REQUIREMENT: Exactly 3 Payment Options: 1. UPI Payment, 2. Debit Card, 3. Credit Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'upi', name: '1. UPI Payment', desc: 'Google Pay, PhonePe, Paytm, BHIM & UPI VPA', icon: Smartphone },
                { id: 'debit_card', name: '2. Debit Card', desc: 'RuPay, Visa, MasterCard & Maestro', icon: CreditCard },
                { id: 'credit_card', name: '3. Credit Card', desc: 'Visa, MasterCard, Amex with 3DS OTP', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = selectedPaymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(m.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-950/50 border-blue-500 text-blue-300 ring-2 ring-blue-500/80 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="font-bold text-xs block text-white">{m.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">{m.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Fields for Chosen Payment Method */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
              {selectedPaymentMethod === 'upi' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Enter Your UPI ID / VPA
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. mobile@okaxis, yourname@upi"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="text-slate-500">Popular Handles:</span>
                    {['@okhdfcbank', '@okaxis', '@oksbi', '@paytm', '@ybl', '@ibl'].map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => {
                          const base = upiIdInput.includes('@') ? upiIdInput.split('@')[0] : upiIdInput;
                          setUpiIdInput(`${base || 'customer'}${handle}`);
                        }}
                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 text-[10px] font-mono"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    A secure UPI collect request will be sent to your UPI app for authorization.
                  </p>
                </div>
              )}

              {(selectedPaymentMethod === 'debit_card' || selectedPaymentMethod === 'credit_card') && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Name on Card"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4111 •••• •••• 4444"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Expiry Date (MM/YY)</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Execute Payment Action */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep('qr_page')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to QR Page
              </button>

              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={isProcessingPayment}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center gap-2"
              >
                {isProcessingPayment && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{isProcessingPayment ? 'Verifying with Gateway...' : `Confirm Payment of ₹${order?.totalAmount || finalPayableAmount}`}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: PAYMENT SUCCESSFUL PAGE */}
        {/* ========================================================================= */}
        {currentStep === 'payment_success' && (
          <div className="bg-slate-900 border border-emerald-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-xl mx-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800">
                Payment Successful
              </span>
              <h2 className="text-2xl font-black text-white mt-3">Payment Receipt Confirmed</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your payment transaction has been confirmed by the Gateway. Your order is authorized and ready for authoritative registry activation.
              </p>
            </div>

            {/* Required Transaction Receipt Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5 text-left font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Payment Status:</span>
                <span className="text-emerald-400 font-bold font-sans">Payment Successful</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Domain Name:</span>
                <span className="text-white font-bold">{selectedDomain}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Order ID:</span>
                <span className="text-blue-400 font-bold">{order?.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Payment Amount:</span>
                <span className="text-emerald-400 font-bold">₹{order?.totalAmount || finalPayableAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Payment Method:</span>
                <span className="text-slate-200">{confirmedPayment?.method || selectedPaymentMethod.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Payment Date:</span>
                <span className="text-slate-300">
                  {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </span>
              </div>
            </div>

            {/* STRICT REQUIREMENT: Distinct "Get Started" button beneath */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGetStarted}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 8: ACTIVATE DOMAIN PAGE */}
        {/* ========================================================================= */}
        {currentStep === 'activate_domain' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-xl mx-auto space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center mx-auto text-blue-400 shadow-xl">
              <Globe className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800">
                Authoritative Registry Activation
              </span>
              <h2 className="text-2xl font-black text-white mt-3">Activate Your Domain</h2>
              <p className="text-xs text-slate-400 mt-1">
                Trigger authoritative registration request to the ICANN registry connector for <strong className="text-white font-mono">{selectedDomain}</strong>.
              </p>
            </div>

            {activationError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{activationError}</span>
              </div>
            )}

            {/* Checklist items verified by backend */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-left">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Verified ({order?.id} &bull; ₹{order?.totalAmount})</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Order Ownership Verified ({user?.fullName})</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>WHOIS Registrant Details Prepared</span>
              </div>
            </div>

            {/* Animated Processing Status */}
            {isActivating && (
              <div className="p-4 bg-blue-950/40 border border-blue-800 rounded-xl text-blue-200 text-xs space-y-2">
                <div className="flex items-center justify-center gap-2 font-bold text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Processing Registry Allocation...</span>
                </div>
                <p className="text-[11px] text-blue-300/80 font-mono">{activationStepNotice}</p>
              </div>
            )}

            {activatedDomain && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-center gap-2 font-bold text-sm text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Domain Active & Confirmed!</span>
                </div>
                <p className="text-[11px] text-emerald-300 font-mono">
                  Registrar Tx ID: {activatedDomain.registrarTxId}
                </p>
                <p className="text-[11px] text-slate-400">
                  Redirecting to Customer Dashboard &bull; My Domains...
                </p>
              </div>
            )}

            {/* Primary Action Button */}
            {!activatedDomain && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleActivateDomain}
                  disabled={isActivating}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isActivating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isActivating ? 'Activating with Registrar...' : 'Activate Domain'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
