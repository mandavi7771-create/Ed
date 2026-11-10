import fs from 'fs';
import path from 'path';

// Define Storage Directories with safe serverless fallback for Netlify/Lambda
function getSafeStoragePath(dirName: string): string {
  try {
    const localPath = path.resolve(process.cwd(), dirName);
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }
    const testFile = path.join(localPath, '.write_test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return localPath;
  } catch {
    const tmpPath = path.resolve('/tmp', dirName);
    if (!fs.existsSync(tmpPath)) {
      try {
        fs.mkdirSync(tmpPath, { recursive: true });
      } catch {}
    }
    return tmpPath;
  }
}

const DATA_DIR = getSafeStoragePath('data');
const DB_FILE = path.join(DATA_DIR, 'nexora_db.json');
export const HOSTING_STORAGE_DIR = getSafeStoragePath('storage/hosting');
export const UPLOADS_DIR = getSafeStoragePath('storage/uploads');

export interface User {
  id: string; // e.g., CUST-1001 or ADM-101
  fullName: string;
  email: string;
  passwordHash: string; // hashed in production/demo
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
  twoFactorSecret?: string;
  googleId?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HostingPlan {
  id: string;
  name: string;
  slug: string;
  price: number; // in INR ₹
  renewalPrice: number;
  validity: string; // "1 Year"
  category: 'special' | 'shared' | 'business' | 'professional' | 'enterprise';
  description: string;
  features: string[];
  websitesAllowed: number;
  storageGB: number;
  bandwidthGB: number; // -1 for unmetered
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
  registrar: string; // "ResellerClub Live", "Namecheap API", "Nexora Registry Connector"
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
  id: string; // e.g., HOST-7701
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
  documentRoot: string; // e.g. "/public_html"
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
  name: string; // e.g. "@", "www", "mail"
  content: string; // e.g. "159.65.132.88" or "mail.domain.com"
  ttl: number; // e.g. 3600
  priority?: number; // for MX, SRV
  createdAt: string;
}

export interface Order {
  id: string; // e.g., ORD-2026-901
  customerId: string;
  customerName: string;
  customerEmail: string;
  type: 'hosting' | 'domain' | 'renewal';
  itemTitle: string;
  itemId: string; // planId or domainName
  subtotal: number;
  taxRate: number; // 0.18
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
  id: string; // e.g., PAY-8801
  orderId: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  gateway: 'Razorpay' | 'UPI_Direct' | 'Card_Secure' | 'NetBanking' | 'ADMIN_TEST_DEMO' | string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  method: 'UPI' | 'Credit_Card' | 'Debit_Card' | 'NetBanking' | 'Wallet' | string;
  methodDetails?: string; // e.g. "Google Pay (UPI)" or "HDFC Visa ending 4242"
  status: 'successful' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  refundedAmount?: number;
  refundReason?: string;
  refundTxId?: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string; // TIK-501
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
  taxRatePercent: number; // 18% GST
  taxName: string; // "GST"
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
}

export interface PromoDomainOffer {
  id: string;
  title: string;
  isEnabled: boolean;
  promotionalPrice: number; // ₹1 default
  eligibleTlds: string[]; // ['.com', '.in', '.net', '.org', '.co.in', '.online', '.store', '.tech', '.site', '.xyz']
  startDate: string; // e.g. '2026-01-01'
  endDate: string; // e.g. '2026-12-31'
  maxOrders: number; // e.g. 500
  ordersClaimed: number; // e.g. 42
  customerEligibility: 'all' | 'new_customers_only' | 'existing_customers';
  minRegistrationPeriodYears: number; // 1, 2, or 3
  allowPlatformSubsidy: boolean; // if true, admin authorizes absorbing wholesale registrar cost difference
  customRenewalPrices?: { [tld: string]: number };
  termsAndConditions: string;
}

export interface DomainServicePlan {
  id: string; // 'plan-dom-1' to 'plan-dom-12'
  tierNumber: number; // 1 to 12
  name: string;
  slug: string;
  servicePackagePrice: number; // e.g., 1, 499, 699, 899, 1500, 2499, 4999, 7999, 9999, 14999, 24999, custom
  firstYearPrice?: number;
  renewalPrice: number;
  features: string[];
  description: string;
  isActive: boolean;
  category: 'promotional' | 'standard' | 'business' | 'enterprise';
  badge?: string;
}

export interface Coupon {
  id: string; // e.g. 'COUP-2026-NOV20'
  code: string; // e.g. 'DOMAIN20NOV'
  discountPercent: number; // 20 or 30
  discountType?: 'percentage';
  title?: string;
  description: string;
  minOrderValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  validFrom?: string;
  expiryDate?: string;
  validUntil?: string;
  isActive: boolean;
  isExpired?: boolean;
  eligibleServices?: ('domain' | 'hosting' | 'all')[];
  applicableServices?: string[];
  allowCombineWithPromo1Rupee?: boolean;
  stackableWithPromo?: boolean;
  usageCount?: number;
  usedCount?: number;
  maxUses?: number;
  usageLimitPerCustomer?: number;
  redeemedBy?: { customerId: string; orderId: string; redeemedAt: string; discountApplied: number }[];
  createdAt?: string;
}

export interface BackupRecord {
  id: string; // 'BAK-1001'
  hostingId: string;
  customerId: string;
  domainName: string;
  fileName?: string;
  sizeMB?: number;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
  status: 'completed' | 'in_progress' | 'failed' | 'ready';
  type: 'automated_daily' | 'manual_snapshot' | 'automated' | 'manual';
  downloadUrl?: string;
  storageLocation?: string;
  retentionDays?: number;
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
  orderId: string;
  domainName: string;
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
  submittedAt: string;
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

export interface DatabaseSchema {
  users: User[];
  plans: HostingPlan[];
  domainPlans: DomainServicePlan[];
  domains: DomainRecord[];
  hosting: HostingAccount[];
  dns: DnsEntry[];
  orders: Order[];
  payments: PaymentTransaction[];
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  settings: PlatformSettings;
  tlds: TldPricing[];
  promoDomainOffer: PromoDomainOffer;
  coupons: Coupon[];
  backups: BackupRecord[];
  paymentSettings?: PaymentSettings;
  domainRegistrantDetails?: DomainRegistrantDetails[];
  paymentAttempts?: PaymentAttempt[];
  paymentWebhooks?: PaymentWebhook[];
  refundRecords?: RefundRecord[];
}

// Default Seed Plans per Part 2 of master prompt
const DEFAULT_PLANS: HostingPlan[] = [
  {
    id: 'plan-special',
    name: 'Special Offer',
    slug: 'special-offer',
    price: 1,
    renewalPrice: 499,
    validity: '1 Year',
    category: 'special',
    description: 'Promotional 1-Year Cloud Hosting package. Limited availability for emerging businesses.',
    features: ['1 Website', '10 GB High-Speed NVMe Storage', 'Unmetered Bandwidth', 'Free SSL Certificate', 'Custom DNS Manager', '1-Click ZIP Deployment'],
    websitesAllowed: 1,
    storageGB: 10,
    bandwidthGB: -1,
    ramMB: 1024,
    cpuCores: 1,
    freeDomain: false,
    freeSsl: true,
    freeDns: true,
    dailyBackups: false,
    isPromotional: true,
    isActive: true,
    quotaRemaining: 48,
  },
  {
    id: 'plan-basic',
    name: 'Basic Hosting',
    slug: 'basic-hosting',
    price: 499,
    renewalPrice: 599,
    validity: '1 Year',
    category: 'shared',
    description: 'Essential hosting for personal blogs, portfolios, and single landing pages.',
    features: ['1 Website', '25 GB NVMe SSD', '100 GB Bandwidth', 'Free Let\'s Encrypt SSL', '2 Subdomains', 'Web-based File Manager'],
    websitesAllowed: 1,
    storageGB: 25,
    bandwidthGB: 100,
    ramMB: 1024,
    cpuCores: 1,
    freeDomain: false,
    freeSsl: true,
    freeDns: true,
    dailyBackups: true,
    isPromotional: false,
    isActive: true,
  },
  {
    id: 'plan-standard',
    name: 'Standard Hosting',
    slug: 'standard-hosting',
    price: 699,
    renewalPrice: 799,
    validity: '1 Year',
    category: 'shared',
    description: 'Balanced power and speed for freelancers and growing sites.',
    features: ['3 Websites', '50 GB NVMe SSD', '250 GB Bandwidth', 'Free SSL for all domains', '5 Subdomains', 'File Manager & ZIP Deploy'],
    websitesAllowed: 3,
    storageGB: 50,
    bandwidthGB: 250,
    ramMB: 2048,
    cpuCores: 2,
    freeDomain: false,
    freeSsl: true,
    freeDns: true,
    dailyBackups: true,
    isPromotional: false,
    isActive: true,
  },
  {
    id: 'plan-premium',
    name: 'Premium Hosting',
    slug: 'premium-hosting',
    price: 799,
    renewalPrice: 999,
    validity: '1 Year',
    category: 'shared',
    description: 'High performance for established creators and commercial portfolios.',
    features: ['10 Websites', '100 GB NVMe SSD', 'Unmetered Bandwidth', 'Free .com/.in Domain Included', 'Unlimited SSL Certificates', 'Automated Health Checks'],
    websitesAllowed: 10,
    storageGB: 100,
    bandwidthGB: -1,
    ramMB: 4096,
    cpuCores: 2,
    freeDomain: true,
    freeSsl: true,
    freeDns: true,
    dailyBackups: true,
    isPromotional: false,
    isActive: true,
  },
  {
    id: 'plan-business',
    name: 'Business Hosting',
    slug: 'business-hosting',
    price: 899,
    renewalPrice: 1199,
    validity: '1 Year',
    category: 'business',
    description: 'Engineered for e-commerce, corporate websites, and traffic surges.',
    features: ['50 Websites', '150 GB Ultra NVMe', 'Unmetered Bandwidth', 'Free Domain for 1st Year', 'Free Wildcard SSL', 'Priority Support Queue', 'Daily Automated Backups'],
    websitesAllowed: 50,
    storageGB: 150,
    bandwidthGB: -1,
    ramMB: 6144,
    cpuCores: 4,
    freeDomain: true,
    freeSsl: true,
    freeDns: true,
    dailyBackups: true,
    isPromotional: false,
    isActive: true,
  },
  {
    id: 'plan-professional',
    name: 'Professional Hosting',
    slug: 'professional-hosting',
    price: 1000,
    renewalPrice: 1499,
    validity: '1 Year',
    category: 'professional',
    description: 'Heavy duty cloud performance with isolated CPU and memory quotas.',
    features: ['100 Websites', '200 GB NVMe Storage', 'Unmetered Bandwidth', 'Dedicated IP Option', 'Free Domain & SSL', 'Instant ZIP Deployment', '24/7 Priority Support'],
    websitesAllowed: 100,
    storageGB: 200,
    bandwidthGB: -1,
    ramMB: 8192,
    cpuCores: 4,
    freeDomain: true,
    freeSsl: true,
    freeDns: true,
    dailyBackups: true,
    isPromotional: false,
    isActive: true,
  },
  {
    id: 'plan-advanced',
    name: 'Advanced Hosting',
    slug: 'advanced-hosting',
    price: 5000,
    renewalPrice: 5999,
    validity: '1 Year',
    category: 'professional',
    description: 'Multi-instance cluster configuration for SaaS platforms and digital agencies.',
    features: ['Unlimited Websites', '400 GB NVMe SSD', 'Unmetered Bandwidth', 'Dedicated Static IP', 'Free Domain & Multi-domain SSL', 'SSH & Custom Environment API', 'SLA 99.95%'],
    websitesAllowed: 999,
    storageGB: 400,
    bandwidthGB: -1,
    ramMB: 16384,
    cpuCores: 8,
    freeDomain: true,
    freeSsl: true,
    freeDns: true,
    dailyBackups: true,
    isPromotional: false,
    isActive: true,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Hosting',
    slug: 'enterprise-hosting',
    price: 10000,
    renewalPrice: 11999,
    validity: '1 Year',
    category: 'enterprise',
    description: 'Dedicated cloud computing resources with guaranteed compute cycles and isolated kernel.',
    features: ['Unlimited Websites', '800 GB NVMe Enterprise', 'Unmetered Bandwidth', '2 Dedicated IPv4', 'Enterprise Grade DDoS Shield', 'Custom Nameservers', 'Dedicated Account Manager'],
    websitesAllowed: 999,
    storageGB: 800,
    bandwidthGB: -1,
    ramMB: 32768,
    cpuCores: 16,
    freeDomain: true,
    freeSsl: true,
    freeDns: true,
    dailyBackups: true,
    isPromotional: false,
    isActive: true,
  },
  {
    id: 'plan-enterprise-plus',
    name: 'Enterprise Plus',
    slug: 'enterprise-plus',
    price: 15000,
    renewalPrice: 17500,
    validity: '1 Year',
    category: 'enterprise',
    description: 'Scalable multi-cloud deployment with automated failover and geo-redundancy.',
    features: ['Unlimited Websites', '1.5 TB NVMe Storage', 'Unmetered Bandwidth', '4 Dedicated IPs', 'Automated Multi-Region Failover', 'Custom Security Rules', '15-min Support Response SLA'],
    websitesAllowed: 999,
    storageGB: 1500,
    bandwidthGB: -1,
    ramMB: 49152,
    cpuCores: 24,
    freeDomain: true,
    freeSsl: true,
    freeDns: true,
    dailyBackups: true,
    isPromotional: false,
    isActive: true,
  },
  {
    id: 'plan-pro-business',
    name: 'Pro Business',
    slug: 'pro-business',
    price: 30000,
    renewalPrice: 34000,
    validity: '1 Year',
    category: 'enterprise',
    description: 'Mission-critical enterprise cloud for financial services, hospitals and massive traffic.',
    features: ['Unlimited Websites', '3 TB NVMe Storage', 'Unmetered 10Gbps Uplink', '8 Dedicated IPs', 'Custom WAF & Compliance Shield', 'Real-time Storage Snapshot Replicas', 'Direct Engineer Hotline'],
    websitesAllowed: 999,
    storageGB: 3000,
    bandwidthGB: -1,
    ramMB: 65536,
    cpuCores: 32,
    freeDomain: true,
    freeSsl: true,
    freeDns: true,
    dailyBackups: true,
    isPromotional: false,
    isActive: true,
  },
  {
    id: 'plan-ultimate-enterprise',
    name: 'Ultimate Enterprise',
    slug: 'ultimate-enterprise',
    price: 40000,
    renewalPrice: 45000,
    validity: '1 Year',
    category: 'enterprise',
    description: 'Unrestricted bare-metal cloud infrastructure with custom hardware provisioning and white-glove engineering.',
    features: ['Unlimited Websites', '6 TB NVMe Enterprise Array', 'Unmetered Dedicated Pipe', '16 Dedicated IPs', 'Custom Kernel Tuning & Extensions', 'Disaster Recovery Warm Standby', 'Executive Concierge Operations'],
    websitesAllowed: 999,
    storageGB: 6000,
    bandwidthGB: -1,
    ramMB: 131072,
    cpuCores: 64,
    freeDomain: true,
    freeSsl: true,
    freeDns: true,
    dailyBackups: true,
    isPromotional: false,
    isActive: true,
  },
];

// Default TLDs per Part 4 & 10
const DEFAULT_TLDS: TldPricing[] = [
  { tld: '.com', registrationPrice: 849, renewalPrice: 999, transferPrice: 799, registrarCost: 650, marginPercent: 30, isSupported: true, isPopular: true },
  { tld: '.in', registrationPrice: 499, renewalPrice: 649, transferPrice: 449, registrarCost: 350, marginPercent: 42, isSupported: true, isPopular: true },
  { tld: '.net', registrationPrice: 949, renewalPrice: 1149, transferPrice: 899, registrarCost: 750, marginPercent: 26, isSupported: true, isPopular: true },
  { tld: '.org', registrationPrice: 899, renewalPrice: 1099, transferPrice: 849, registrarCost: 700, marginPercent: 28, isSupported: true, isPopular: true },
  { tld: '.co.in', registrationPrice: 399, renewalPrice: 549, transferPrice: 349, registrarCost: 280, marginPercent: 42, isSupported: true, isPopular: false },
  { tld: '.online', registrationPrice: 199, renewalPrice: 1499, transferPrice: 999, registrarCost: 120, marginPercent: 65, isSupported: true, isPopular: true },
  { tld: '.store', registrationPrice: 249, renewalPrice: 1899, transferPrice: 1299, registrarCost: 160, marginPercent: 55, isSupported: true, isPopular: true },
  { tld: '.tech', registrationPrice: 299, renewalPrice: 1999, transferPrice: 1499, registrarCost: 200, marginPercent: 49, isSupported: true, isPopular: true },
  { tld: '.site', registrationPrice: 149, renewalPrice: 1399, transferPrice: 899, registrarCost: 99, marginPercent: 50, isSupported: true, isPopular: false },
  { tld: '.xyz', registrationPrice: 199, renewalPrice: 999, transferPrice: 799, registrarCost: 110, marginPercent: 80, isSupported: true, isPopular: true },
  { tld: '.app', registrationPrice: 1199, renewalPrice: 1399, transferPrice: 1099, registrarCost: 950, marginPercent: 26, isSupported: true, isPopular: true },
  { tld: '.blog', registrationPrice: 499, renewalPrice: 1699, transferPrice: 1199, registrarCost: 380, marginPercent: 31, isSupported: true, isPopular: false },
  { tld: '.info', registrationPrice: 399, renewalPrice: 1499, transferPrice: 999, registrarCost: 290, marginPercent: 37, isSupported: true, isPopular: false },
  { tld: '.biz', registrationPrice: 499, renewalPrice: 1399, transferPrice: 999, registrarCost: 350, marginPercent: 42, isSupported: true, isPopular: false },
  { tld: '.website', registrationPrice: 249, renewalPrice: 1299, transferPrice: 899, registrarCost: 180, marginPercent: 38, isSupported: true, isPopular: false },
];

// Default Promo Domain Offer per Additional Module
export const DEFAULT_PROMO_OFFER: PromoDomainOffer = {
  id: 'PROMO-DOM-1',
  title: 'Special ₹1 Domain Registration Offer',
  isEnabled: true,
  promotionalPrice: 1,
  eligibleTlds: ['.com', '.in', '.net', '.org', '.co.in', '.online', '.store', '.tech', '.site', '.xyz'],
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  maxOrders: 500,
  ordersClaimed: 42,
  customerEligibility: 'all',
  minRegistrationPeriodYears: 1,
  allowPlatformSubsidy: true,
  customRenewalPrices: {
    '.com': 999,
    '.in': 649,
    '.net': 1149,
    '.org': 1099,
    '.co.in': 549,
    '.online': 1499,
    '.store': 1899,
    '.tech': 1999,
    '.site': 1399,
    '.xyz': 999,
  },
  termsAndConditions: 'Promotional ₹1 domain registration offer is valid on select TLDs. Subsequent year renewals apply at standard rates. 18% GST itemized transparently. No hidden charges or unauthorized add-ons. Domain activation requires authoritative registry confirmation.',
};

// Default 12 Configurable Domain Plans per Section 5
export const DEFAULT_DOMAIN_PLANS: DomainServicePlan[] = [
  {
    id: 'plan-dom-1',
    tierNumber: 1,
    name: 'Special Promotional Offer',
    slug: 'special-promo-offer',
    servicePackagePrice: 1,
    renewalPrice: 499,
    category: 'promotional',
    description: 'Promotional 1st-year registration rate on select authoritative TLDs.',
    features: ['1 Domain Registration', 'Free Let\'s Encrypt SSL', 'Authoritative Anycast DNS', 'Whois Privacy Protection included'],
    isActive: true,
  },
  {
    id: 'plan-dom-2',
    tierNumber: 2,
    name: 'Basic Plan',
    slug: 'basic-plan',
    servicePackagePrice: 499,
    renewalPrice: 599,
    category: 'standard',
    description: 'Standard domain registration with essential DNS management.',
    features: ['Standard Domain Registration', 'Standard DNS Manager', 'Basic Email Forwarding (2 Aliases)', 'Domain Theft Protection Lock'],
    isActive: true,
  },
  {
    id: 'plan-dom-3',
    tierNumber: 3,
    name: 'Standard Plan',
    slug: 'standard-plan',
    servicePackagePrice: 699,
    renewalPrice: 799,
    category: 'standard',
    description: 'Enhanced domain package with full DNS control and privacy guard.',
    features: ['Domain Registration & Auto-Renew', 'Advanced Anycast DNS Zone Editor', 'Full WHOIS Identity Shield', '5 Email Forwarding Aliases'],
    isActive: true,
  },
  {
    id: 'plan-dom-4',
    tierNumber: 4,
    name: 'Premium Plan',
    slug: 'premium-plan',
    servicePackagePrice: 899,
    renewalPrice: 999,
    category: 'standard',
    description: 'Complete domain management suite with premium DNS SLA.',
    features: ['Top-Tier Domain Registration', 'DDoS-Protected Anycast DNS', 'Free Wildcard SSL Provisioning', 'Unlimited Subdomain Records', 'EPP Transfer Security Lock'],
    isActive: true,
  },
  {
    id: 'plan-dom-5',
    tierNumber: 5,
    name: 'Professional Plan',
    slug: 'professional-plan',
    servicePackagePrice: 1500,
    renewalPrice: 1750,
    category: 'business',
    description: 'Professional domain portfolio plan with DNSSEC and accelerated TTLs.',
    features: ['Domain Registration + DNSSEC', 'Ultra-Fast 60s TTL DNS Propagation', 'WHOIS Privacy Masking', 'Priority Nameserver Redundancy', '24/7 Registrar Desk Hotline'],
    isActive: true,
  },
  {
    id: 'plan-dom-6',
    tierNumber: 6,
    name: 'Business Plan',
    slug: 'business-plan',
    servicePackagePrice: 2499,
    renewalPrice: 2799,
    category: 'business',
    description: 'High-availability business domain management for corporate portals.',
    features: ['Multi-Region Anycast DNS Nodes', 'Automated Health Monitoring & Failover', 'Custom Vanity Nameservers (ns1/ns2.yourdomain)', 'Compliance WHOIS Auditing', 'Priority Registry Support'],
    isActive: true,
  },
  {
    id: 'plan-dom-7',
    tierNumber: 7,
    name: 'Advanced Business Plan',
    slug: 'advanced-business-plan',
    servicePackagePrice: 4999,
    renewalPrice: 5499,
    category: 'business',
    description: 'Robust corporate domain protection with trademark watchlist alert.',
    features: ['Enterprise Global DNS Network', 'Brand Trademark Collision Scanner', 'Dedicated Vanity Nameserver Cluster', '2-Hour DNS Assistance SLA', 'Multi-User Domain Access Roles'],
    isActive: true,
  },
  {
    id: 'plan-dom-8',
    tierNumber: 8,
    name: 'Premium Business Plan',
    slug: 'premium-business-plan',
    servicePackagePrice: 7999,
    renewalPrice: 8999,
    category: 'business',
    description: 'Advanced portfolio shielding and domain governance suite.',
    features: ['Registry Lock Security Protection', 'Automated Geo-DNS Traffic Steering', 'Corporate Domain Registry Audit Trail', 'Dedicated Technical Account Manager', 'Custom Reverse DNS (PTR) Records'],
    isActive: true,
  },
  {
    id: 'plan-dom-9',
    tierNumber: 9,
    name: 'Enterprise Plan',
    slug: 'enterprise-plan',
    servicePackagePrice: 9999,
    renewalPrice: 11499,
    category: 'enterprise',
    description: 'Mission-critical enterprise domain infrastructure with zero downtime guarantee.',
    features: ['High-Assurance Anycast DNS Infrastructure', 'Registry-Level Lock Enforcement', 'Comprehensive Trademark Infringement Guard', 'Custom API Access for Bulk Operations', '15-Minute Critical Incident SLA'],
    isActive: true,
  },
  {
    id: 'plan-dom-10',
    tierNumber: 10,
    name: 'Enterprise Plus',
    slug: 'enterprise-plus',
    servicePackagePrice: 14999,
    renewalPrice: 16999,
    category: 'enterprise',
    description: 'Enterprise security suite with threat intelligence and proactive defense.',
    features: ['Real-Time Domain Phishing & Typosquatting Shield', 'Automated DNSSEC Key Rollover', 'Custom Edge Routing & Latency Optimizer', 'Executive Concierge Registrar Engineering', 'Unlimited DNS Zones & Subdomains'],
    isActive: true,
  },
  {
    id: 'plan-dom-11',
    tierNumber: 11,
    name: 'Ultimate Enterprise',
    slug: 'ultimate-enterprise',
    servicePackagePrice: 24999,
    renewalPrice: 27999,
    category: 'enterprise',
    description: 'Flagship enterprise domain solution for global corporations and financial institutions.',
    features: ['Global 100% DNS Uptime SLA with Financial Backing', 'Dedicated Anycast IP Blocks & Custom BGP Routing', 'White-Glove Legal & Registry Dispute Concierge', 'Executive Security Audit & Hardening Reports', 'Direct Registry Engineer Hotline'],
    isActive: true,
  },
  {
    id: 'plan-dom-12',
    tierNumber: 12,
    name: 'Custom Enterprise Plan',
    slug: 'custom-enterprise',
    servicePackagePrice: 39999,
    renewalPrice: 44999,
    category: 'enterprise',
    description: 'Tailored enterprise domain architecture designed to custom organizational specifications.',
    features: ['Bespoke Anycast DNS Architecture', 'Custom TLD Whitelisting & Policy Enforcement', 'Multi-Cloud Automated Failover & Disaster Recovery', 'Dedicated Account Executive & Legal Liaison', 'Custom Invoicing & Multi-Entity Billing'],
    isActive: true,
  },
];

// Default Monthly Coupons per Section 8 & 9 (20% and 30% discounts)
export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'COUP-2026-NOV20',
    code: 'DOMAIN20NOV',
    discountPercent: 20,
    discountType: 'percentage',
    title: '20% OFF November Domain Special',
    description: 'Get an authentic 20% discount on all eligible domain registrations and service plans.',
    minOrderValue: 499,
    maxDiscountAmount: 2000,
    startDate: '2026-11-01',
    expiryDate: '2026-11-30',
    isActive: true,
    isExpired: false,
    eligibleServices: ['domain', 'all'],
    allowCombineWithPromo1Rupee: false,
    usageCount: 14,
    usageLimitPerCustomer: 1,
    redeemedBy: [],
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'COUP-2026-NOV30',
    code: 'DOMAIN30NOV',
    discountPercent: 30,
    discountType: 'percentage',
    title: '30% OFF November Business Domain Deal',
    description: 'Save 30% on multi-year domain registrations and business service tiers.',
    minOrderValue: 899,
    maxDiscountAmount: 3500,
    startDate: '2026-11-01',
    expiryDate: '2026-11-30',
    isActive: true,
    isExpired: false,
    eligibleServices: ['domain', 'all'],
    allowCombineWithPromo1Rupee: false,
    usageCount: 8,
    usageLimitPerCustomer: 1,
    redeemedBy: [],
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'COUP-2026-SAVE20',
    code: 'SAVE20MONTH',
    discountPercent: 20,
    discountType: 'percentage',
    title: '20% OFF Cloud Hosting & Domains',
    description: 'Monthly customer appreciation voucher: 20% savings across domains and hosting packages.',
    minOrderValue: 499,
    maxDiscountAmount: 2500,
    startDate: '2026-11-01',
    expiryDate: '2026-11-30',
    isActive: true,
    isExpired: false,
    eligibleServices: ['all'],
    allowCombineWithPromo1Rupee: false,
    usageCount: 22,
    usageLimitPerCustomer: 1,
    redeemedBy: [],
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'COUP-2026-SAVE30',
    code: 'SAVE30MONTH',
    discountPercent: 30,
    discountType: 'percentage',
    title: '30% OFF Annual Cloud Infrastructure',
    description: '30% discount on higher annual plans and multi-domain bundles.',
    minOrderValue: 1500,
    maxDiscountAmount: 5000,
    startDate: '2026-11-01',
    expiryDate: '2026-11-30',
    isActive: true,
    isExpired: false,
    eligibleServices: ['all'],
    allowCombineWithPromo1Rupee: false,
    usageCount: 11,
    usageLimitPerCustomer: 1,
    redeemedBy: [],
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'COUP-2026-OCT20-EXP',
    code: 'DOMAIN20OCT',
    discountPercent: 20,
    discountType: 'percentage',
    title: '20% OFF October Domain Sprint (Expired)',
    description: 'Previous month promotional coupon archive.',
    minOrderValue: 499,
    startDate: '2026-10-01',
    expiryDate: '2026-10-31',
    isActive: false,
    isExpired: true,
    eligibleServices: ['domain', 'all'],
    allowCombineWithPromo1Rupee: false,
    usageCount: 45,
    usageLimitPerCustomer: 1,
    redeemedBy: [],
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

// Default Backups per Section 2 & 11
export const DEFAULT_BACKUPS: BackupRecord[] = [
  {
    id: 'BAK-1001',
    hostingId: 'HOST-4001',
    customerId: 'CUST-2001',
    domainName: 'techstartapp.com',
    fileName: 'techstartapp_full_backup_20261101.tar.gz',
    sizeMB: 18.4,
    createdAt: '2026-11-01T02:00:00.000Z',
    status: 'completed',
    type: 'automated_daily',
    downloadUrl: '/api/hosting/HOST-4001/backups/BAK-1001/download',
  },
  {
    id: 'BAK-1002',
    hostingId: 'HOST-4001',
    customerId: 'CUST-2001',
    domainName: 'techstartapp.com',
    fileName: 'techstartapp_manual_snapshot_20261107.tar.gz',
    sizeMB: 21.2,
    createdAt: '2026-11-07T14:30:00.000Z',
    status: 'completed',
    type: 'manual_snapshot',
    downloadUrl: '/api/hosting/HOST-4001/backups/BAK-1002/download',
  },
];

// Default High-Resolution Merchant Payment QR Code (Vector SVG Data URI with Nexora Pay Hub)
export const DEFAULT_QR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#ffffff" rx="24"/>
  <!-- Top Left Finder -->
  <rect x="32" y="32" width="86" height="86" fill="#0f172a" rx="14"/>
  <rect x="46" y="46" width="58" height="58" fill="#ffffff" rx="8"/>
  <rect x="58" y="58" width="34" height="34" fill="#0f172a" rx="5"/>
  <!-- Top Right Finder -->
  <rect x="282" y="32" width="86" height="86" fill="#0f172a" rx="14"/>
  <rect x="296" y="46" width="58" height="58" fill="#ffffff" rx="8"/>
  <rect x="308" y="58" width="34" height="34" fill="#0f172a" rx="5"/>
  <!-- Bottom Left Finder -->
  <rect x="32" y="282" width="86" height="86" fill="#0f172a" rx="14"/>
  <rect x="46" y="296" width="58" height="58" fill="#ffffff" rx="8"/>
  <rect x="58" y="308" width="34" height="34" fill="#0f172a" rx="5"/>
  <!-- Timing modules -->
  <rect x="132" y="65" width="18" height="18" fill="#0f172a" rx="3"/>
  <rect x="162" y="65" width="18" height="18" fill="#0f172a" rx="3"/>
  <rect x="192" y="65" width="18" height="18" fill="#0f172a" rx="3"/>
  <rect x="222" y="65" width="18" height="18" fill="#0f172a" rx="3"/>
  <rect x="252" y="65" width="18" height="18" fill="#0f172a" rx="3"/>
  
  <rect x="65" y="132" width="18" height="18" fill="#0f172a" rx="3"/>
  <rect x="65" y="162" width="18" height="18" fill="#0f172a" rx="3"/>
  <rect x="65" y="192" width="18" height="18" fill="#0f172a" rx="3"/>
  <rect x="65" y="222" width="18" height="18" fill="#0f172a" rx="3"/>
  <rect x="65" y="252" width="18" height="18" fill="#0f172a" rx="3"/>

  <!-- High-Density QR Data Grid Blocks -->
  <rect x="132" y="100" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="170" y="100" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="210" y="100" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="248" y="100" width="26" height="26" fill="#0f172a" rx="4"/>

  <rect x="100" y="140" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="274" y="140" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="312" y="140" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="344" y="140" width="26" height="26" fill="#0f172a" rx="4"/>

  <rect x="100" y="180" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="274" y="180" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="312" y="180" width="26" height="26" fill="#0f172a" rx="4"/>

  <rect x="100" y="220" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="274" y="220" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="312" y="220" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="344" y="220" width="26" height="26" fill="#0f172a" rx="4"/>

  <rect x="132" y="260" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="170" y="260" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="210" y="260" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="250" y="260" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="290" y="260" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="330" y="260" width="26" height="26" fill="#0f172a" rx="4"/>

  <rect x="132" y="300" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="180" y="300" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="230" y="300" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="280" y="300" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="330" y="300" width="26" height="26" fill="#0f172a" rx="4"/>

  <rect x="140" y="340" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="190" y="340" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="240" y="340" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="290" y="340" width="26" height="26" fill="#0f172a" rx="4"/>
  <rect x="340" y="340" width="26" height="26" fill="#0f172a" rx="4"/>

  <!-- Center Official Merchant Branding Hub -->
  <rect x="140" y="140" width="120" height="120" fill="#ffffff" rx="20" stroke="#0f172a" stroke-width="4"/>
  <circle cx="200" cy="186" r="30" fill="#2563eb"/>
  <path d="M188 186 C188 180 193 176 199 176 C204 176 208 179 210 182 C212 181 214 181 216 182 C219 184 221 188 221 191 C221 195 218 198 214 198 L188 198 Z" fill="#ffffff"/>
  <text x="200" y="238" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">NEXORA PAY</text>
</svg>`)}`;

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  activeQrCode: {
    id: 'QR-ADMIN-101',
    name: 'Official Nexora Cloud Merchant Primary QR',
    imageUrl: DEFAULT_QR_SVG,
    isActive: true,
    uploadedAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
  },
  qrCodeList: [
    {
      id: 'QR-ADMIN-101',
      name: 'Official Nexora Cloud Merchant Primary QR',
      imageUrl: DEFAULT_QR_SVG,
      isActive: true,
      uploadedAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-08T00:00:00.000Z',
    },
  ],
  enabledMethods: {
    upi: true,
    upi_qr: true,
    debit_card: true,
    credit_card: true,
    netbanking: true,
  },
  merchantName: 'Nexora Cloud Technologies Pvt Ltd',
};

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        if (!parsed.promoDomainOffer) {
          parsed.promoDomainOffer = { ...DEFAULT_PROMO_OFFER };
        }
        if (!parsed.domainPlans || parsed.domainPlans.length === 0) {
          parsed.domainPlans = [...DEFAULT_DOMAIN_PLANS];
        }
        if (!parsed.coupons || parsed.coupons.length === 0) {
          parsed.coupons = [...DEFAULT_COUPONS];
        }
        if (!parsed.backups) {
          parsed.backups = [...DEFAULT_BACKUPS];
        }
        if (!parsed.paymentSettings || !parsed.paymentSettings.activeQrCode) {
          parsed.paymentSettings = JSON.parse(JSON.stringify(DEFAULT_PAYMENT_SETTINGS));
        }
        if (!parsed.domainRegistrantDetails) parsed.domainRegistrantDetails = [];
        if (!parsed.paymentAttempts) parsed.paymentAttempts = [];
        if (!parsed.paymentWebhooks) parsed.paymentWebhooks = [];
        if (!parsed.refundRecords) parsed.refundRecords = [];
        return parsed;
      } catch (err) {
        console.error('Failed to load database JSON, re-seeding:', err);
      }
    }
    const seed = this.createSeedData();
    this.save(seed);
    return seed;
  }

  private save(dataToSave?: DatabaseSchema) {
    const payload = dataToSave || this.data;
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private createSeedData(): DatabaseSchema {
    const defaultSettings: PlatformSettings = {
      brandName: 'Nexora Cloud',
      supportEmail: 'support@nexoracloud.com',
      supportPhone: '+91 800-456-7890',
      currency: 'INR',
      taxRatePercent: 18,
      taxName: 'GST (18%)',
      registrarApiConfigured: false,
      registrarApiKeyMasked: 'RC-LIVE-********9821',
      registrarEndpoint: 'https://api.resellerclub.com/v1/domains',
      paymentGatewayConfigured: true,
      paymentGatewayKeyId: 'rzp_live_nexora_784920',
      emailSmtpConfigured: true,
      defaultNameserver1: 'ns1.nexoracloud.com',
      defaultNameserver2: 'ns2.nexoracloud.com',
      defaultServerIp: '159.65.132.88',
      maintenanceMode: false,
      promoSpecialOfferEnabled: true,
    };

    const initialUsers: User[] = [
      {
        id: 'ADM-1001',
        fullName: 'Super Administrator',
        email: 'admin@nexoracloud.com',
        passwordHash: 'Admin@123456',
        mobile: '+91 9876543210',
        country: 'India',
        state: 'Karnataka',
        city: 'Bengaluru',
        address: 'Nexora Tower, MG Road',
        postalCode: '560001',
        companyName: 'Nexora Cloud Infrastructure Pvt Ltd',
        role: 'super_admin',
        status: 'active',
        twoFactorEnabled: true,
        twoFactorSecret: '654321',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'ADM-1002',
        fullName: 'Rohan Sharma',
        email: 'rohan.tech@nexoracloud.com',
        passwordHash: 'Staff@123456',
        mobile: '+91 9876543211',
        country: 'India',
        state: 'Maharashtra',
        city: 'Mumbai',
        address: 'BKC Complex',
        postalCode: '400051',
        role: 'tech_manager',
        status: 'active',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
      {
        id: 'CUST-2001',
        fullName: 'Vikramaditya Roy',
        email: 'client@techstart.io',
        passwordHash: 'Client@123456',
        mobile: '+91 9988776655',
        country: 'India',
        state: 'Karnataka',
        city: 'Bengaluru',
        address: '42 Koramangala 4th Block',
        postalCode: '560034',
        companyName: 'TechStart Technologies',
        role: 'customer',
        status: 'active',
        createdAt: '2026-02-15T10:00:00.000Z',
        updatedAt: '2026-02-15T10:00:00.000Z',
      },
    ];

    const initialDomains: DomainRecord[] = [
      {
        id: 'DOM-3001',
        domainName: 'techstartapp.com',
        customerId: 'CUST-2001',
        customerEmail: 'client@techstart.io',
        registrar: 'ResellerClub Gateway API',
        registrarTxId: 'RC-TXN-984210',
        registrationDate: '2026-02-15T10:15:00.000Z',
        expiryDate: '2027-02-15T10:15:00.000Z',
        renewalDate: '2027-02-15T10:15:00.000Z',
        registrationPeriodYears: 1,
        registrationPrice: 849,
        renewalPrice: 999,
        status: 'active',
        autoRenew: true,
        privacyProtected: true,
        locked: true,
        eppCode: 'NEX-89YTA-4',
        nameservers: ['ns1.nexoracloud.com', 'ns2.nexoracloud.com'],
        connectedHostingId: 'HOST-4001',
        registrantDetails: {
          firstName: 'Vikramaditya',
          lastName: 'Roy',
          company: 'TechStart Technologies',
          email: 'client@techstart.io',
          mobile: '+91 9988776655',
          address: '42 Koramangala 4th Block',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560034',
          country: 'India',
        },
      },
    ];

    const initialHosting: HostingAccount[] = [
      {
        id: 'HOST-4001',
        customerId: 'CUST-2001',
        customerEmail: 'client@techstart.io',
        planId: 'plan-business',
        planName: 'Business Hosting',
        domainName: 'techstartapp.com',
        serverNode: 'blr-node-04.nexoracloud.net',
        serverIp: '159.65.132.88',
        status: 'active',
        startDate: '2026-02-15T10:20:00.000Z',
        expiryDate: '2027-02-15T10:20:00.000Z',
        autoRenew: true,
        storageUsedMB: 12.4,
        storageTotalMB: 153600, // 150 GB
        bandwidthUsedGB: 18.2,
        bandwidthTotalGB: 9999,
        documentRoot: '/public_html',
        sslStatus: 'active',
        sslIssuer: "Let's Encrypt Authority X3",
        sslExpiry: '2026-05-15T10:20:00.000Z',
        deploymentStatus: 'live',
        lastDeployedAt: '2026-02-15T10:35:00.000Z',
        deploymentLogs: [
          { timestamp: '2026-02-15T10:20:00.000Z', level: 'info', message: 'Hosting instance container initialized.' },
          { timestamp: '2026-02-15T10:21:00.000Z', level: 'info', message: 'DNS and Apache virtual host created.' },
          { timestamp: '2026-02-15T10:22:00.000Z', level: 'info', message: "Let's Encrypt SSL certificate issued and installed." },
          { timestamp: '2026-02-15T10:35:00.000Z', level: 'info', message: 'ZIP archive successfully extracted. 14 files published.' },
          { timestamp: '2026-02-15T10:35:10.000Z', level: 'info', message: 'Health check probe HTTP/200 OK passed.' },
        ],
        ftpUsername: 'techstart_usr',
        ftpHost: 'ftp.techstartapp.com',
      },
    ];

    const initialDns: DnsEntry[] = [
      { id: 'DNS-1', domainId: 'DOM-3001', domainName: 'techstartapp.com', type: 'A', name: '@', content: '159.65.132.88', ttl: 3600, createdAt: '2026-02-15T10:20:00.000Z' },
      { id: 'DNS-2', domainId: 'DOM-3001', domainName: 'techstartapp.com', type: 'CNAME', name: 'www', content: 'techstartapp.com', ttl: 3600, createdAt: '2026-02-15T10:20:00.000Z' },
      { id: 'DNS-3', domainId: 'DOM-3001', domainName: 'techstartapp.com', type: 'MX', name: '@', content: 'mail.techstartapp.com', priority: 10, ttl: 3600, createdAt: '2026-02-15T10:20:00.000Z' },
      { id: 'DNS-4', domainId: 'DOM-3001', domainName: 'techstartapp.com', type: 'TXT', name: '@', content: 'v=spf1 include:_spf.nexoracloud.com ~all', ttl: 3600, createdAt: '2026-02-15T10:20:00.000Z' },
    ];

    const initialOrders: Order[] = [
      {
        id: 'ORD-2026-101',
        customerId: 'CUST-2001',
        customerName: 'Vikramaditya Roy',
        customerEmail: 'client@techstart.io',
        type: 'hosting',
        itemTitle: 'Business Hosting (1 Year)',
        itemId: 'plan-business',
        subtotal: 899,
        taxRate: 0.18,
        taxAmount: 161.82,
        discountAmount: 0,
        totalAmount: 1060.82,
        currency: 'INR',
        paymentStatus: 'successful',
        serviceStatus: 'active',
        paymentId: 'PAY-8801',
        createdAt: '2026-02-15T10:10:00.000Z',
        timeline: [
          { timestamp: '2026-02-15T10:10:00.000Z', status: 'Order Placed', note: 'Customer initialized order for Business Hosting' },
          { timestamp: '2026-02-15T10:12:00.000Z', status: 'Payment Successful', note: 'UPI transaction confirmed via Razorpay ID rzp_pay_90912' },
          { timestamp: '2026-02-15T10:13:00.000Z', status: 'Provisioned', note: 'Server directory /storage/hosting/CUST-2001/HOST-4001 allocated' },
        ],
      },
    ];

    const initialPayments: PaymentTransaction[] = [
      {
        id: 'PAY-8801',
        orderId: 'ORD-2026-101',
        customerId: 'CUST-2001',
        customerEmail: 'client@techstart.io',
        amount: 1060.82,
        currency: 'INR',
        gateway: 'Razorpay',
        gatewayOrderId: 'order_NxR90128',
        gatewayPaymentId: 'pay_NxR891283',
        method: 'UPI',
        methodDetails: 'UPI QR / UPI Intent (techstart@okaxis)',
        status: 'successful',
        idempotencyKey: 'idemp-8912739102',
        createdAt: '2026-02-15T10:12:00.000Z',
      },
    ];

    const initialTickets: SupportTicket[] = [
      {
        id: 'TIK-501',
        customerId: 'CUST-2001',
        customerName: 'Vikramaditya Roy',
        customerEmail: 'client@techstart.io',
        category: 'Website Deployment',
        subject: 'Custom Node.js runtime compatibility inquiry',
        priority: 'medium',
        status: 'resolved',
        assignedStaffId: 'ADM-1002',
        assignedStaffName: 'Rohan Sharma',
        createdAt: '2026-02-16T11:00:00.000Z',
        updatedAt: '2026-02-16T12:30:00.000Z',
        messages: [
          {
            id: 'MSG-1',
            senderId: 'CUST-2001',
            senderName: 'Vikramaditya Roy',
            senderRole: 'customer',
            message: 'Hello Nexora team, does Business Hosting support Node.js apps or only static HTML/CSS/JS and PHP?',
            createdAt: '2026-02-16T11:00:00.000Z',
          },
          {
            id: 'MSG-2',
            senderId: 'ADM-1002',
            senderName: 'Rohan Sharma',
            senderRole: 'staff',
            message: 'Hi Vikramaditya! Business Hosting natively runs static web apps (HTML, CSS, JS, Vite dist builds) and PHP 8.2+. For full Node.js background services, our Advanced Hosting (₹5,000/yr) includes dedicated Node.js and PM2 cluster support.',
            createdAt: '2026-02-16T11:45:00.000Z',
          },
          {
            id: 'MSG-3',
            senderId: 'CUST-2001',
            senderName: 'Vikramaditya Roy',
            senderRole: 'customer',
            message: 'Understood, thank you! I will deploy the React Vite production build as static HTML/JS for now.',
            createdAt: '2026-02-16T12:15:00.000Z',
          },
        ],
      },
    ];

    const initialAuditLogs: AuditLog[] = [
      {
        id: 'LOG-1',
        adminId: 'ADM-1001',
        adminEmail: 'admin@nexoracloud.com',
        action: 'PLATFORM_INITIALIZATION',
        entityType: 'settings',
        entityId: 'SYSTEM',
        newValue: { brand: 'Nexora Cloud', status: 'initialized' },
        result: 'success',
        ipAddress: '127.0.0.1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    ];

    const initialNotifications: NotificationItem[] = [
      {
        id: 'NOTIF-1',
        recipientEmail: 'client@techstart.io',
        recipientId: 'CUST-2001',
        type: 'HOSTING_ACTIVATED',
        subject: 'Your Nexora Cloud Hosting is Live! (techstartapp.com)',
        messageHtml: '<p>Dear Vikramaditya, your Business Hosting account has been successfully provisioned. You can now upload your website ZIP files directly from your Customer Dashboard.</p>',
        isRead: false,
        sentAt: '2026-02-15T10:22:00.000Z',
      },
    ];

    // Seed default hosting site directory so the sample client has live files!
    const sampleDir = path.join(HOSTING_STORAGE_DIR, 'CUST-2001', 'HOST-4001', 'public_html');
    if (!fs.existsSync(sampleDir)) {
      fs.mkdirSync(sampleDir, { recursive: true });
      fs.writeFileSync(
        path.join(sampleDir, 'index.html'),
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TechStart Official Website</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 580px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    h1 { color: #38bdf8; margin-top: 0; }
    p { color: #94a3b8; line-height: 1.6; }
    .badge { display: inline-block; background: #0369a1; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">LIVE DEPLOYMENT</div>
    <h1>Welcome to TechStart!</h1>
    <p>This static website was uploaded as a ZIP archive and extracted automatically via Nexora Cloud Hosting Platform.</p>
    <p><strong>Domain:</strong> techstartapp.com &bull; <strong>Server IP:</strong> 159.65.132.88</p>
    <p style="font-size: 13px; color: #64748b;">SSL Certified &bull; Fast NVMe SSD &bull; HTTP/2 Enabled</p>
  </div>
</body>
</html>`
      );
      fs.writeFileSync(
        path.join(sampleDir, 'robots.txt'),
        `User-agent: *\nAllow: /\nSitemap: https://techstartapp.com/sitemap.xml`
      );
    }

    return {
      users: initialUsers,
      plans: DEFAULT_PLANS,
      domains: initialDomains,
      hosting: initialHosting,
      dns: initialDns,
      orders: initialOrders,
      payments: initialPayments,
      tickets: initialTickets,
      auditLogs: initialAuditLogs,
      notifications: initialNotifications,
      settings: defaultSettings,
      tlds: DEFAULT_TLDS,
      promoDomainOffer: { ...DEFAULT_PROMO_OFFER },
      domainPlans: [...DEFAULT_DOMAIN_PLANS],
      coupons: [...DEFAULT_COUPONS],
      backups: [...DEFAULT_BACKUPS],
      paymentSettings: { ...DEFAULT_PAYMENT_SETTINGS },
      domainRegistrantDetails: [],
      paymentAttempts: [],
      paymentWebhooks: [],
      refundRecords: [],
    };
  }

  // Getters
  public getUsers(): User[] { return this.data.users; }
  public getPlans(): HostingPlan[] { return this.data.plans; }
  public getDomainPlans(): DomainServicePlan[] {
    if (!this.data.domainPlans || this.data.domainPlans.length === 0) {
      this.data.domainPlans = [...DEFAULT_DOMAIN_PLANS];
      this.save();
    }
    return this.data.domainPlans;
  }
  public getCoupons(): Coupon[] {
    if (!this.data.coupons || this.data.coupons.length === 0) {
      this.data.coupons = [...DEFAULT_COUPONS];
      this.save();
    }
    return this.data.coupons;
  }
  public getBackups(): BackupRecord[] {
    if (!this.data.backups) {
      this.data.backups = [...DEFAULT_BACKUPS];
      this.save();
    }
    return this.data.backups;
  }
  public getDomains(): DomainRecord[] { return this.data.domains; }
  public getHosting(): HostingAccount[] { return this.data.hosting; }
  public getDns(): DnsEntry[] { return this.data.dns; }
  public getOrders(): Order[] { return this.data.orders; }
  public getPayments(): PaymentTransaction[] { return this.data.payments; }
  public getTickets(): SupportTicket[] { return this.data.tickets; }
  public getAuditLogs(): AuditLog[] { return this.data.auditLogs; }
  public getNotifications(): NotificationItem[] { return this.data.notifications; }
  public getSettings(): PlatformSettings { return this.data.settings; }
  public getTlds(): TldPricing[] { return this.data.tlds; }

  // Mutations with Auto-Save
  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.users[idx];
  }

  public updatePlan(id: string, updates: Partial<HostingPlan>): HostingPlan | null {
    const idx = this.data.plans.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.plans[idx] = { ...this.data.plans[idx], ...updates };
    this.save();
    return this.data.plans[idx];
  }

  public addPlan(plan: HostingPlan): HostingPlan {
    this.data.plans.push(plan);
    this.save();
    return plan;
  }

  public addDomain(domain: DomainRecord): DomainRecord {
    this.data.domains.push(domain);
    this.save();
    return domain;
  }

  public updateDomain(id: string, updates: Partial<DomainRecord>): DomainRecord | null {
    const idx = this.data.domains.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.domains[idx] = { ...this.data.domains[idx], ...updates };
    this.save();
    return this.data.domains[idx];
  }

  public addHosting(account: HostingAccount): HostingAccount {
    this.data.hosting.push(account);
    this.save();
    return account;
  }

  public updateHosting(id: string, updates: Partial<HostingAccount>): HostingAccount | null {
    const idx = this.data.hosting.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    this.data.hosting[idx] = { ...this.data.hosting[idx], ...updates };
    this.save();
    return this.data.hosting[idx];
  }

  public addDns(entry: DnsEntry): DnsEntry {
    this.data.dns.push(entry);
    this.save();
    return entry;
  }

  public updateDns(id: string, updates: Partial<DnsEntry>): DnsEntry | null {
    const idx = this.data.dns.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.dns[idx] = { ...this.data.dns[idx], ...updates };
    this.save();
    return this.data.dns[idx];
  }

  public deleteDns(id: string): boolean {
    const prevLen = this.data.dns.length;
    this.data.dns = this.data.dns.filter((d) => d.id !== id);
    if (this.data.dns.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addOrder(order: Order): Order {
    this.data.orders.push(order);
    this.save();
    return order;
  }

  public updateOrder(id: string, updates: Partial<Order>): Order | null {
    const idx = this.data.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    this.data.orders[idx] = { ...this.data.orders[idx], ...updates };
    this.save();
    return this.data.orders[idx];
  }

  public addPayment(payment: PaymentTransaction): PaymentTransaction {
    this.data.payments.push(payment);
    this.save();
    return payment;
  }

  public updatePayment(id: string, updates: Partial<PaymentTransaction>): PaymentTransaction | null {
    const idx = this.data.payments.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.payments[idx] = { ...this.data.payments[idx], ...updates };
    this.save();
    return this.data.payments[idx];
  }

  public addTicket(ticket: SupportTicket): SupportTicket {
    this.data.tickets.push(ticket);
    this.save();
    return ticket;
  }

  public updateTicket(id: string, updates: Partial<SupportTicket>): SupportTicket | null {
    const idx = this.data.tickets.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.data.tickets[idx] = { ...this.data.tickets[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.tickets[idx];
  }

  public addAuditLog(log: AuditLog): AuditLog {
    this.data.auditLogs.unshift(log); // prepend latest
    // Limit to 500 logs
    if (this.data.auditLogs.length > 500) this.data.auditLogs.pop();
    this.save();
    return log;
  }

  public addNotification(notif: NotificationItem): NotificationItem {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public markNotificationRead(id: string): boolean {
    const n = this.data.notifications.find((item) => item.id === id);
    if (n) {
      n.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  public updateSettings(updates: Partial<PlatformSettings>): PlatformSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  public updateTld(tld: string, updates: Partial<TldPricing>): TldPricing | null {
    const idx = this.data.tlds.findIndex((t) => t.tld === tld);
    if (idx === -1) return null;
    this.data.tlds[idx] = { ...this.data.tlds[idx], ...updates };
    this.save();
    return this.data.tlds[idx];
  }

  public getPromoDomainOffer(): PromoDomainOffer {
    if (!this.data.promoDomainOffer) {
      this.data.promoDomainOffer = { ...DEFAULT_PROMO_OFFER };
      this.save();
    }
    return this.data.promoDomainOffer;
  }

  public updatePromoDomainOffer(updates: Partial<PromoDomainOffer>): PromoDomainOffer {
    if (!this.data.promoDomainOffer) {
      this.data.promoDomainOffer = { ...DEFAULT_PROMO_OFFER };
    }
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    this.data.promoDomainOffer = {
      ...this.data.promoDomainOffer,
      ...cleanUpdates,
    };
    if (!this.data.promoDomainOffer.eligibleTlds || !Array.isArray(this.data.promoDomainOffer.eligibleTlds)) {
      this.data.promoDomainOffer.eligibleTlds = [...DEFAULT_PROMO_OFFER.eligibleTlds];
    }
    this.save();
    return this.data.promoDomainOffer;
  }

  public incrementPromoClaimed(): number {
    if (!this.data.promoDomainOffer) {
      this.data.promoDomainOffer = { ...DEFAULT_PROMO_OFFER };
    }
    this.data.promoDomainOffer.ordersClaimed = (this.data.promoDomainOffer.ordersClaimed || 0) + 1;
    this.save();
    return this.data.promoDomainOffer.ordersClaimed;
  }

  // Domain Plans (12 Tiers)
  public updateDomainPlan(id: string, updates: Partial<DomainServicePlan>): DomainServicePlan | null {
    if (!this.data.domainPlans) this.data.domainPlans = [...DEFAULT_DOMAIN_PLANS];
    const idx = this.data.domainPlans.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.domainPlans[idx] = { ...this.data.domainPlans[idx], ...updates };
    this.save();
    return this.data.domainPlans[idx];
  }

  // Coupons
  public addCoupon(coupon: Coupon): Coupon {
    if (!this.data.coupons) this.data.coupons = [...DEFAULT_COUPONS];
    this.data.coupons.unshift(coupon);
    this.save();
    return coupon;
  }

  public updateCoupon(id: string, updates: Partial<Coupon>): Coupon | null {
    if (!this.data.coupons) this.data.coupons = [...DEFAULT_COUPONS];
    const idx = this.data.coupons.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.coupons[idx] = { ...this.data.coupons[idx], ...updates };
    this.save();
    return this.data.coupons[idx];
  }

  public applyCoupon(
    code: string,
    subtotal: number,
    customerIdOrIsPromo?: string | boolean,
    maybeIsPromo?: boolean
  ): { valid: boolean; discountPercent: number; discountAmount: number; finalAmount: number; coupon?: Coupon; message: string; error?: string } {
    if (!code) return { valid: false, discountPercent: 0, discountAmount: 0, finalAmount: subtotal, message: 'Coupon code required', error: 'Coupon code required' };
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.getCoupons().find((c) => c.code.toUpperCase() === cleanCode);

    const isPromo1Rupee = typeof customerIdOrIsPromo === 'boolean' ? customerIdOrIsPromo : Boolean(maybeIsPromo);
    const customerId = typeof customerIdOrIsPromo === 'string' ? customerIdOrIsPromo : '';

    if (!coupon) {
      return { valid: false, discountPercent: 0, discountAmount: 0, finalAmount: subtotal, message: 'Invalid coupon code. Please verify the code.', error: 'Invalid coupon code. Please verify the code.' };
    }

    if (!coupon.isActive || coupon.isExpired) {
      return { valid: false, discountPercent: 0, discountAmount: 0, finalAmount: subtotal, message: 'This coupon code has expired or is inactive.', error: 'This coupon code has expired or is inactive.' };
    }

    const now = new Date();
    const expiry = coupon.expiryDate || coupon.validUntil;
    if (expiry && now > new Date(expiry + 'T23:59:59')) {
      coupon.isExpired = true;
      coupon.isActive = false;
      this.save();
      return { valid: false, discountPercent: 0, discountAmount: 0, finalAmount: subtotal, message: 'This monthly coupon campaign has ended.', error: 'This monthly coupon campaign has ended.' };
    }

    if (isPromo1Rupee && !coupon.allowCombineWithPromo1Rupee && !coupon.stackableWithPromo) {
      return {
        valid: false,
        discountPercent: 0,
        discountAmount: 0,
        finalAmount: subtotal,
        message: 'Coupons cannot be stacked with the ₹1 special promotional domain or hosting rate.',
        error: 'Coupons cannot be stacked with the ₹1 special promotional domain or hosting rate.',
      };
    }

    const minVal = coupon.minOrderValue ?? coupon.minOrderAmount ?? 0;
    if (subtotal < minVal) {
      return {
        valid: false,
        discountPercent: 0,
        discountAmount: 0,
        finalAmount: subtotal,
        message: `Minimum order value of ₹${minVal} required to apply coupon ${coupon.code}.`,
        error: `Minimum order value of ₹${minVal} required to apply coupon ${coupon.code}.`,
      };
    }

    // Check duplicate usage per customer if customerId provided
    if (customerId && coupon.redeemedBy && coupon.usageLimitPerCustomer) {
      const userRedemptions = coupon.redeemedBy.filter((r) => r.customerId === customerId).length;
      if (userRedemptions >= coupon.usageLimitPerCustomer) {
        return {
          valid: false,
          discountPercent: 0,
          discountAmount: 0,
          finalAmount: subtotal,
          message: `Coupon ${coupon.code} has already been claimed for your account. Limit 1 use per customer.`,
          error: `Coupon ${coupon.code} has already been claimed for your account. Limit 1 use per customer.`,
        };
      }
    }

    // Calculate discount
    let discount = Math.round((subtotal * coupon.discountPercent) / 100);
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }

    // Never produce a negative payable amount
    if (discount >= subtotal) {
      discount = Math.max(0, subtotal - 1);
    }

    const finalAmount = Math.max(0, subtotal - discount);

    return {
      valid: true,
      discountPercent: coupon.discountPercent,
      discountAmount: discount,
      finalAmount,
      coupon,
      message: `Coupon ${coupon.code} applied successfully! (${coupon.discountPercent}% OFF)`,
    };
  }

  // Monthly Coupon Auto-Generator
  public generateMonthlyCoupons(): Coupon[] {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const now = new Date();
    const monthStr = months[now.getMonth()];
    const year = now.getFullYear();

    const code20 = `DOMAIN20${monthStr}`;
    const code30 = `DOMAIN30${monthStr}`;
    const save20 = `SAVE20${monthStr}`;
    const save30 = `SAVE30${monthStr}`;

    const lastDayOfMonth = new Date(year, now.getMonth() + 1, 0).getDate();
    const expiryDate = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
    const startDate = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const existing = this.getCoupons();
    // Expire old ones
    existing.forEach((c) => {
      if (new Date(c.expiryDate + 'T23:59:59') < now) {
        c.isActive = false;
        c.isExpired = true;
      }
    });

    const newCoupons: Coupon[] = [];

    const templates = [
      { code: code20, percent: 20, title: `20% OFF ${monthStr} Domain Special`, min: 499, max: 2000, serv: ['domain', 'all'] },
      { code: code30, percent: 30, title: `30% OFF ${monthStr} Business Domain Deal`, min: 899, max: 3500, serv: ['domain', 'all'] },
      { code: save20, percent: 20, title: `20% OFF ${monthStr} Cloud Hosting & Domains`, min: 499, max: 2500, serv: ['all'] },
      { code: save30, percent: 30, title: `30% OFF ${monthStr} Annual Cloud Infrastructure`, min: 1500, max: 5000, serv: ['all'] },
    ];

    for (const t of templates) {
      if (!existing.some((c) => c.code === t.code)) {
        const c: Coupon = {
          id: `COUP-${year}-${t.code}`,
          code: t.code,
          discountPercent: t.percent,
          discountType: 'percentage',
          title: t.title,
          description: `Authentic ${t.percent}% savings on all eligible registrations for ${monthStr} ${year}.`,
          minOrderValue: t.min,
          maxDiscountAmount: t.max,
          startDate,
          expiryDate,
          isActive: true,
          isExpired: false,
          eligibleServices: t.serv as any,
          allowCombineWithPromo1Rupee: false,
          usageCount: 0,
          usageLimitPerCustomer: 1,
          redeemedBy: [],
          createdAt: now.toISOString(),
        };
        this.data.coupons.unshift(c);
        newCoupons.push(c);
      }
    }

    this.save();
    return newCoupons;
  }

  // Backups
  public addBackup(backup: BackupRecord): BackupRecord {
    if (!this.data.backups) this.data.backups = [];
    this.data.backups.unshift(backup);
    this.save();
    return backup;
  }

  public deleteBackup(id: string): boolean {
    if (!this.data.backups) return false;
    const initialLen = this.data.backups.length;
    this.data.backups = this.data.backups.filter((b) => b.id !== id);
    if (this.data.backups.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Google Account Login & Automatic Account Creation
  public loginOrRegisterGoogleUser(payload: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }): { user: User; isNew: boolean } {
    const cleanEmail = payload.email.toLowerCase().trim();
    let existing = this.data.users.find(
      (u) => (u.googleId && u.googleId === payload.googleId) || u.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      // Update googleId and avatarUrl if not set
      if (!existing.googleId) existing.googleId = payload.googleId;
      if (payload.avatarUrl && !existing.avatarUrl) existing.avatarUrl = payload.avatarUrl;
      existing.updatedAt = new Date().toISOString();
      this.save();
      return { user: existing, isNew: false };
    }

    // Automatic customer account creation on first login
    const newId = `CUST-${1000 + this.data.users.length + 1}`;
    const newUser: User = {
      id: newId,
      fullName: payload.fullName || cleanEmail.split('@')[0],
      email: cleanEmail,
      passwordHash: `GOOGLE_AUTH_${payload.googleId}`, // No password needed for Google SSO
      mobile: '+91 9876543210',
      country: 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      address: 'Verified Google Identity',
      postalCode: '560001',
      role: 'customer',
      status: 'active',
      googleId: payload.googleId,
      avatarUrl: payload.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.fullName || 'User')}&background=0284c7&color=fff`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.addUser(newUser);

    // Audit log
    this.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: 'SYSTEM',
      adminEmail: 'system@nexoracloud.com',
      action: 'CUSTOMER_GOOGLE_REGISTERED',
      entityType: 'customer',
      entityId: newUser.id,
      newValue: { email: newUser.email, fullName: newUser.fullName, googleId: payload.googleId },
      result: 'success',
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    // Welcome Notification
    this.addNotification({
      id: `NOTIF-${Date.now()}`,
      recipientEmail: newUser.email,
      recipientId: newUser.id,
      type: 'ACCOUNT_CREATED',
      subject: 'Welcome to Nexora Cloud Platform',
      messageHtml: `<p>Hello ${newUser.fullName}, your customer account (${newUser.id}) has been created automatically using your Google Account. You can now register domains, deploy websites, and manage cloud services seamlessly.</p>`,
      isRead: false,
      sentAt: new Date().toISOString(),
    });

    return { user: newUser, isNew: true };
  }

  // Payment Settings & Admin QR Code Controls
  public getPaymentSettings(): PaymentSettings {
    if (!this.data.paymentSettings || !this.data.paymentSettings.activeQrCode) {
      this.data.paymentSettings = JSON.parse(JSON.stringify(DEFAULT_PAYMENT_SETTINGS));
      this.save();
    }
    return this.data.paymentSettings!;
  }

  public updatePaymentSettings(updates: Partial<PaymentSettings>): PaymentSettings {
    const current = this.getPaymentSettings();
    this.data.paymentSettings = {
      ...current,
      ...updates,
      enabledMethods: {
        ...current.enabledMethods,
        ...(updates.enabledMethods || {}),
      },
    };
    this.save();
    return this.data.paymentSettings;
  }

  public addAdminQrCode(qr: { name: string; imageUrl: string; isActive?: boolean }): AdminQrCode {
    const settings = this.getPaymentSettings();
    const id = `QR-${Date.now()}`;
    const now = new Date().toISOString();
    const newQr: AdminQrCode = {
      id,
      name: qr.name,
      imageUrl: qr.imageUrl,
      isActive: qr.isActive ?? true,
      uploadedAt: now,
      updatedAt: now,
    };
    if (newQr.isActive) {
      settings.qrCodeList.forEach((q) => { q.isActive = false; });
      settings.activeQrCode = newQr;
    }
    settings.qrCodeList.unshift(newQr);
    this.save();
    return newQr;
  }

  public activateAdminQrCode(id: string): AdminQrCode | null {
    const settings = this.getPaymentSettings();
    const target = settings.qrCodeList.find((q) => q.id === id);
    if (!target) return null;
    settings.qrCodeList.forEach((q) => { q.isActive = (q.id === id); });
    target.isActive = true;
    target.updatedAt = new Date().toISOString();
    settings.activeQrCode = target;
    this.save();
    return target;
  }

  public deactivateAdminQrCode(id: string): boolean {
    const settings = this.getPaymentSettings();
    const target = settings.qrCodeList.find((q) => q.id === id);
    if (!target) return false;
    target.isActive = false;
    target.updatedAt = new Date().toISOString();
    if (settings.activeQrCode?.id === id) {
      settings.activeQrCode = null;
    }
    this.save();
    return true;
  }

  public deleteAdminQrCode(id: string): boolean {
    const settings = this.getPaymentSettings();
    const idx = settings.qrCodeList.findIndex((q) => q.id === id);
    if (idx === -1) return false;
    const isDeletedActive = settings.qrCodeList[idx].isActive;
    settings.qrCodeList.splice(idx, 1);
    if (isDeletedActive) {
      settings.activeQrCode = settings.qrCodeList.find((q) => q.isActive) || settings.qrCodeList[0] || null;
      if (settings.activeQrCode) settings.activeQrCode.isActive = true;
    }
    this.save();
    return true;
  }

  public replaceAdminQrCode(id: string, updates: { name?: string; imageUrl?: string; isActive?: boolean }): AdminQrCode | null {
    const settings = this.getPaymentSettings();
    const target = settings.qrCodeList.find((q) => q.id === id);
    if (!target) return null;
    if (updates.name) target.name = updates.name.trim();
    if (updates.imageUrl) target.imageUrl = updates.imageUrl.trim();
    target.updatedAt = new Date().toISOString();
    if (updates.isActive !== undefined) {
      if (updates.isActive) {
        settings.qrCodeList.forEach((q) => { q.isActive = (q.id === id); });
        target.isActive = true;
        settings.activeQrCode = target;
      } else {
        target.isActive = false;
        if (settings.activeQrCode?.id === id) {
          settings.activeQrCode = null;
        }
      }
    } else if (target.isActive) {
      settings.activeQrCode = target;
    }
    this.save();
    return target;
  }

  // Domain Registrant Details
  public saveRegistrantDetails(details: DomainRegistrantDetails): DomainRegistrantDetails {
    if (!this.data.domainRegistrantDetails) this.data.domainRegistrantDetails = [];
    const idx = this.data.domainRegistrantDetails.findIndex((d) => d.orderId === details.orderId);
    if (idx !== -1) {
      this.data.domainRegistrantDetails[idx] = details;
    } else {
      this.data.domainRegistrantDetails.push(details);
    }
    this.save();
    return details;
  }

  public getRegistrantDetails(orderId: string): DomainRegistrantDetails | undefined {
    if (!this.data.domainRegistrantDetails) return undefined;
    return this.data.domainRegistrantDetails.find((d) => d.orderId === orderId);
  }

  // Payment Attempts Audit
  public addPaymentAttempt(attempt: PaymentAttempt): PaymentAttempt {
    if (!this.data.paymentAttempts) this.data.paymentAttempts = [];
    this.data.paymentAttempts.unshift(attempt);
    this.save();
    return attempt;
  }

  public getPaymentAttempts(): PaymentAttempt[] {
    return this.data.paymentAttempts || [];
  }

  // Gateway Webhooks Log
  public addPaymentWebhook(webhook: PaymentWebhook): PaymentWebhook {
    if (!this.data.paymentWebhooks) this.data.paymentWebhooks = [];
    this.data.paymentWebhooks.unshift(webhook);
    this.save();
    return webhook;
  }

  public getPaymentWebhooks(): PaymentWebhook[] {
    return this.data.paymentWebhooks || [];
  }

  // Refund Records
  public addRefundRecord(refund: RefundRecord): RefundRecord {
    if (!this.data.refundRecords) this.data.refundRecords = [];
    this.data.refundRecords.unshift(refund);
    this.save();
    return refund;
  }

  public getRefundRecords(): RefundRecord[] {
    return this.data.refundRecords || [];
  }
}

export const db = new Database();
