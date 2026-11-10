export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  companyName?: string;
  role: 'customer' | 'super_admin' | 'admin' | 'finance_manager' | 'support_manager' | 'tech_manager' | 'readonly_staff';
  status: 'active' | 'suspended' | 'pending_verification';
  suspendedReason?: string;
  twoFactorEnabled?: boolean;
  googleId?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HostingPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  renewalPrice: number;
  validity: string;
  category: 'special' | 'shared' | 'business' | 'professional' | 'enterprise';
  description: string;
  features: string[];
  websitesAllowed: number;
  storageGB: number;
  bandwidthGB: number;
  ramMB: number;
  cpuCores: number;
  freeDomain: boolean;
  freeSsl: boolean;
  freeDns: boolean;
  dailyBackups: boolean;
  isPromotional: boolean;
  isActive: boolean;
  quotaRemaining?: number;
}

export interface DomainRecord {
  id: string;
  domainName: string;
  customerId: string;
  customerEmail: string;
  registrar: string;
  registrarTxId: string;
  registrationDate: string;
  expiryDate: string;
  renewalDate: string;
  registrationPeriodYears: number;
  registrationPrice: number;
  renewalPrice: number;
  status: 'active' | 'pending' | 'failed' | 'expired' | 'transferring';
  autoRenew: boolean;
  privacyProtected: boolean;
  locked: boolean;
  eppCode: string;
  nameservers: string[];
  connectedHostingId?: string;
  registrantDetails: {
    firstName: string;
    lastName: string;
    company?: string;
    email: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface HostingAccount {
  id: string;
  customerId: string;
  customerEmail: string;
  planId: string;
  planName: string;
  domainName: string;
  serverNode: string;
  serverIp: string;
  status: 'active' | 'suspended' | 'provisioning' | 'pending_setup' | 'expired';
  suspendedReason?: string;
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
  storageUsedMB: number;
  storageTotalMB: number;
  bandwidthUsedGB: number;
  bandwidthTotalGB: number;
  documentRoot: string;
  sslStatus: 'active' | 'pending' | 'expired' | 'error' | 'none';
  sslIssuer?: string;
  sslExpiry?: string;
  deploymentStatus: 'live' | 'pending' | 'failed' | 'not_deployed';
  lastDeployedAt?: string;
  deploymentLogs: { timestamp: string; level: 'info' | 'warn' | 'error'; message: string }[];
  ftpUsername: string;
  ftpHost: string;
}

export interface DnsEntry {
  id: string;
  domainId: string;
  domainName: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV' | 'CAA';
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  type: 'hosting' | 'domain' | 'renewal';
  itemTitle: string;
  itemId: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'processing' | 'successful' | 'failed' | 'refunded';
  serviceStatus: 'pending' | 'provisioning' | 'active' | 'failed' | 'cancelled' | 'pending_activation';
  paymentId?: string;
  createdAt: string;
  timeline: { timestamp: string; status: string; note: string }[];
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  gateway: 'Razorpay' | 'UPI_Direct' | 'Card_Secure' | 'NetBanking' | 'ADMIN_TEST_DEMO' | string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  method: 'UPI' | 'Credit_Card' | 'Debit_Card' | 'NetBanking' | 'Wallet' | string;
  methodDetails?: string;
  status: 'successful' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  refundedAmount?: number;
  refundReason?: string;
  refundTxId?: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  category: 'Domain' | 'Hosting' | 'Payment' | 'Website Deployment' | 'SSL' | 'DNS' | 'Renewal' | 'Other';
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: 'customer' | 'staff' | 'system';
    message: string;
    attachmentUrl?: string;
    attachmentName?: string;
    createdAt: string;
  }[];
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: 'customer' | 'domain' | 'hosting' | 'order' | 'payment' | 'plan' | 'settings' | 'ticket';
  entityId: string;
  previousValue?: any;
  newValue?: any;
  result: 'success' | 'failure';
  ipAddress: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  recipientEmail: string;
  recipientId: string;
  type: string;
  subject: string;
  messageHtml: string;
  isRead: boolean;
  sentAt: string;
}

export interface PlatformSettings {
  brandName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  taxRatePercent: number;
  taxName: string;
  registrarApiConfigured: boolean;
  registrarApiKeyMasked: string;
  registrarEndpoint: string;
  paymentGatewayConfigured: boolean;
  paymentGatewayKeyId: string;
  emailSmtpConfigured: boolean;
  defaultNameserver1: string;
  defaultNameserver2: string;
  defaultServerIp: string;
  maintenanceMode: boolean;
  promoSpecialOfferEnabled: boolean;
}

export interface TldPricing {
  tld: string;
  registrationPrice: number;
  renewalPrice: number;
  transferPrice: number;
  registrarCost: number;
  marginPercent: number;
  isSupported: boolean;
  isPopular: boolean;
  isPromoEligible?: boolean;
  promotionalPrice?: number;
}

export interface PromoDomainOffer {
  id: string;
  title: string;
  isEnabled: boolean;
  promotionalPrice: number;
  eligibleTlds: string[];
  startDate: string;
  endDate: string;
  maxOrders: number;
  ordersClaimed: number;
  customerEligibility: 'all' | 'new_customers_only' | 'existing_customers';
  minRegistrationPeriodYears: number;
  allowPlatformSubsidy: boolean;
  customRenewalPrices?: { [tld: string]: number };
  termsAndConditions: string;
}

export interface DomainPeriodPricing {
  years: number;
  subtotal: number;
  gst: number;
  total: number;
}

export interface DomainCheckResult {
  domainName: string;
  tld: string;
  isAvailable: boolean;
  isPremium?: boolean;
  currency: string;
  isPromo1Rupee: boolean;
  promotionalPrice: number;
  firstYearPrice: number;
  secondYearPrice: number;
  thirdYearPrice: number;
  renewalPrice: number;
  transferPrice: number;
  registrarCost: number;
  allowPlatformSubsidy: boolean;
  minRegistrationPeriodYears: number;
  customerEligibility: string;
  termsNotice: string;
  periods: {
    1: DomainPeriodPricing;
    2: DomainPeriodPricing;
    3: DomainPeriodPricing;
  };
}

export interface DomainServicePlan {
  id: string;
  tierNumber: number;
  name: string;
  slug: string;
  servicePackagePrice: number;
  firstYearPrice: number;
  renewalPrice: number;
  features: string[];
  description: string;
  isActive: boolean;
  category: 'promotional' | 'standard' | 'business' | 'enterprise';
  badge?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  discountType: 'percentage';
  title: string;
  description: string;
  minOrderValue: number;
  maxDiscountAmount?: number;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  isExpired: boolean;
  eligibleServices: ('domain' | 'hosting' | 'all')[];
  allowCombineWithPromo1Rupee: boolean;
  usageCount: number;
  usageLimitPerCustomer: number;
  redeemedBy: { customerId: string; orderId: string; redeemedAt: string; discountApplied: number }[];
  createdAt: string;
}

export interface BackupRecord {
  id: string;
  hostingId: string;
  customerId: string;
  domainName: string;
  fileName: string;
  sizeMB: number;
  createdAt: string;
  status: 'completed' | 'in_progress' | 'failed';
  type: 'automated_daily' | 'manual_snapshot';
  downloadUrl: string;
}

export interface AdminQrCode {
  id: string;
  name: string;
  imageUrl: string;
  isActive: boolean;
  uploadedAt: string;
  updatedAt: string;
}

export interface PaymentSettings {
  activeQrCode: AdminQrCode | null;
  qrCodeList: AdminQrCode[];
  enabledMethods: {
    upi: boolean;
    upi_qr: boolean;
    debit_card: boolean;
    credit_card: boolean;
    netbanking: boolean;
  };
  merchantName: string;
  merchantVpaMasked?: string;
}

export interface DomainRegistrantDetails {
  orderId?: string;
  domainName?: string;
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  organization?: string;
  submittedAt?: string;
}

export interface PaymentAttempt {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  method: string;
  gateway: string;
  status: 'initiated' | 'successful' | 'failed';
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
}

export interface PaymentWebhook {
  id: string;
  event: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  payload: any;
  status: 'processed' | 'ignored' | 'failed';
  receivedAt: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  orderId: string;
  customerId: string;
  amount: number;
  reason: string;
  refundTxId: string;
  status: 'successful' | 'processing' | 'failed';
  createdAt: string;
}

export interface GlobalDnsCheckResult {
  domainName: string;
  nameservers: {
    cloudflare: string[];
    google: string[];
    isPropagated: boolean;
  };
  aRecords: {
    cloudflare: string[];
    google: string[];
  };
  testedAt: string;
}

export interface AcceptanceTestStep {
  step: number;
  title: string;
  description: string;
  status: 'passed' | 'failed' | 'in_progress' | 'pending';
  timestamp?: string;
  details?: any;
}

export interface AcceptanceTestResult {
  testId: string;
  testDomain: string;
  allPassed: boolean;
  executedAt: string;
  steps: AcceptanceTestStep[];
}

export interface ProductionReadinessItem {
  id: string;
  category: 'Domains' | 'DNS' | 'Portability' | 'Hosting' | 'Payments' | 'Security';
  title: string;
  status: 'Working and Verified' | 'Configuration Required' | 'Provider Approval Required' | 'Not Supported' | 'Failed Verification';
  details: string;
  evidenceOrRequirement: string;
}

export interface ProductionReadinessReport {
  generatedAt: string;
  overallStatus: 'Ready for Live Reseller Credentials' | 'Pending Provider Credentials';
  summary: {
    workingAndVerified: number;
    configurationRequired: number;
    providerApprovalRequired: number;
    notSupported: number;
    failedVerification: number;
  };
  items: ProductionReadinessItem[];
}
