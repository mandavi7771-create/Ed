import {
  User,
  HostingPlan,
  DomainRecord,
  HostingAccount,
  DnsEntry,
  Order,
  PaymentTransaction,
  SupportTicket,
  AuditLog,
  NotificationItem,
  PlatformSettings,
  TldPricing,
  Coupon,
  DomainServicePlan,
  BackupRecord,
  AdminQrCode,
  PaymentSettings,
  DomainRegistrantDetails,
  PaymentAttempt,
  PaymentWebhook,
  RefundRecord,
} from '../types';

const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('nexora_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  async loginWithGoogle(payload: { credential?: string; profile?: { email: string; name: string; picture?: string; sub?: string } }): Promise<{ message: string; user: User; token: string; isNewUser: boolean }> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async register(body: any): Promise<{ message: string; user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async login(body: any): Promise<{ message: string; user: User; token: string; requires2FA?: boolean; userId?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async updateProfile(body: any): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  // Domains
  async checkDomain(query: string): Promise<{
    query: string;
    primaryDomain: string;
    primaryAvailable: boolean;
    results: {
      domainName: string;
      tld: string;
      isAvailable: boolean;
      isPremium: boolean;
      registrationPrice: number;
      renewalPrice: number;
      transferPrice: number;
      currency: string;
    }[];
    suggestions: any[];
    primaryPricing?: any;
    promoOffer?: any;
  }> {
    const res = await fetch(`${API_BASE}/domains/check?query=${encodeURIComponent(query)}`);
    return handleResponse(res);
  },

  async getPromoDomainOffer(): Promise<{
    offer: any;
    isActive: boolean;
    remainingQuota: number;
    currentServerTime: string;
  }> {
    const res = await fetch(`${API_BASE}/domains/promo-offer`);
    return handleResponse(res);
  },

  async getDomainPricing(): Promise<{ tlds: TldPricing[]; promoOffer?: any }> {
    const res = await fetch(`${API_BASE}/domains/pricing`);
    return handleResponse(res);
  },

  async getMyDomains(customerId: string): Promise<{ domains: DomainRecord[] }> {
    const res = await fetch(`${API_BASE}/domains/my?customerId=${customerId}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getDomain(id: string): Promise<{ domain: DomainRecord; dnsRecords: DnsEntry[] }> {
    const res = await fetch(`${API_BASE}/domains/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async purchaseDomain(body: any): Promise<{ message: string; domain: DomainRecord }> {
    const res = await fetch(`${API_BASE}/domains/purchase`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async updateNameservers(id: string, nameservers: string[]): Promise<{ message: string; domain: DomainRecord }> {
    const res = await fetch(`${API_BASE}/domains/${id}/nameservers`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ nameservers }),
    });
    return handleResponse(res);
  },

  async setDomainLock(id: string, locked: boolean): Promise<{ message: string; domain: DomainRecord }> {
    const res = await fetch(`${API_BASE}/domains/${id}/lock`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ locked }),
    });
    return handleResponse(res);
  },

  async setDomainAutoRenew(id: string, autoRenew: boolean): Promise<{ message: string; domain: DomainRecord }> {
    const res = await fetch(`${API_BASE}/domains/${id}/autorenew`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ autoRenew }),
    });
    return handleResponse(res);
  },

  async updateDomain(id: string, updates: Partial<DomainRecord>): Promise<{ message: string; domain: DomainRecord }> {
    const res = await fetch(`${API_BASE}/domains/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async getEppCode(id: string): Promise<{ eppCode: string }> {
    const res = await fetch(`${API_BASE}/domains/${id}/epp`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async submitDomainTransfer(body: any): Promise<{ message: string; domain: DomainRecord }> {
    const res = await fetch(`${API_BASE}/domains/transfer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  // Hosting
  async getPlans(): Promise<{ plans: HostingPlan[] }> {
    const res = await fetch(`${API_BASE}/hosting/plans`);
    return handleResponse(res);
  },

  async getMyHosting(customerId: string): Promise<{ hosting: HostingAccount[] }> {
    const res = await fetch(`${API_BASE}/hosting/my?customerId=${customerId}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getHosting(id: string): Promise<{ account: HostingAccount }> {
    const res = await fetch(`${API_BASE}/hosting/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async purchaseHosting(body: any): Promise<{ message: string; account: HostingAccount }> {
    const res = await fetch(`${API_BASE}/hosting/purchase`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async deployWebsiteZip(hostingId: string, formData: FormData): Promise<{ message: string; account: HostingAccount; hasIndex: boolean; logs: any[] }> {
    const token = localStorage.getItem('nexora_token');
    const res = await fetch(`${API_BASE}/hosting/${hostingId}/deploy-zip`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return handleResponse(res);
  },

  async checkHostingHealth(hostingId: string): Promise<{
    domain: string;
    httpStatus: number;
    latencyMs: number;
    sslValid: boolean;
    ipAddress: string;
    status: string;
  }> {
    const res = await fetch(`${API_BASE}/hosting/${hostingId}/health-check`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // File Manager
  async listFiles(hostingId: string, subPath: string = ''): Promise<{
    currentPath: string;
    items: { name: string; isDirectory: boolean; size: number; updatedAt: string; extension: string }[];
    totalBytes: number;
    totalMB: number;
    storageLimitMB: number;
  }> {
    const res = await fetch(`${API_BASE}/filemanager/${hostingId}/list?path=${encodeURIComponent(subPath)}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async readFile(hostingId: string, filePath: string): Promise<{ fileName: string; path: string; content: string; size: number }> {
    const res = await fetch(`${API_BASE}/filemanager/${hostingId}/read?path=${encodeURIComponent(filePath)}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async writeFile(hostingId: string, filePath: string, content: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/filemanager/${hostingId}/write`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ path: filePath, content }),
    });
    return handleResponse(res);
  },

  async createFolder(hostingId: string, folderName: string, currentPath: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/filemanager/${hostingId}/mkdir`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ folderName, currentPath }),
    });
    return handleResponse(res);
  },

  async deleteFile(hostingId: string, filePath: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/filemanager/${hostingId}/delete?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async renameFile(hostingId: string, oldPath: string, newName: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/filemanager/${hostingId}/rename`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ oldPath, newName }),
    });
    return handleResponse(res);
  },

  // DNS
  async getDnsRecords(domainId: string): Promise<{ domain: any; records: DnsEntry[] }> {
    const res = await fetch(`${API_BASE}/dns/${domainId}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async addDnsRecord(domainId: string, record: Partial<DnsEntry>): Promise<{ message: string; record: DnsEntry }> {
    const res = await fetch(`${API_BASE}/dns/${domainId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record),
    });
    return handleResponse(res);
  },

  async updateDnsRecord(domainId: string, recordId: string, record: Partial<DnsEntry>): Promise<{ message: string; record: DnsEntry }> {
    const res = await fetch(`${API_BASE}/dns/${domainId}/${recordId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(record),
    });
    return handleResponse(res);
  },

  async deleteDnsRecord(domainId: string, recordId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/dns/${domainId}/${recordId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async verifyDns(domainId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/dns/${domainId}/verify`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // SSL
  async getSslInfo(hostingId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ssl/${hostingId}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async provisionSsl(hostingId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ssl/${hostingId}/provision`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Billing & Checkout
  async getPublicPaymentSettings(): Promise<{
    activeQrCode: AdminQrCode | null;
    enabledMethods: PaymentSettings['enabledMethods'];
    merchantName: string;
  }> {
    const res = await fetch(`${API_BASE}/billing/payment-settings`);
    return handleResponse(res);
  },

  async getOrder(orderId: string): Promise<{
    order: Order;
    registrantDetails?: DomainRegistrantDetails | null;
    payment?: PaymentTransaction | null;
  }> {
    const res = await fetch(`${API_BASE}/billing/orders/${orderId}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createOrder(body: {
    customerId: string;
    type: 'hosting' | 'domain' | 'renewal';
    itemId: string;
    itemTitle: string;
    subtotal: number;
    couponCode?: string;
    isPromoOffer?: boolean;
    registrantDetails?: DomainRegistrantDetails;
  }): Promise<{
    order: Order;
    gatewayOrderId: string;
    upiUri: string;
    keyId: string;
    taxName: string;
    discountApplied?: number;
    coupon?: any;
  }> {
    const res = await fetch(`${API_BASE}/billing/create-order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async verifyPayment(body: {
    orderId: string;
    gatewayOrderId?: string;
    paymentMethod: string;
    methodDetails?: string;
    idempotencyKey?: string;
  }): Promise<{ message: string; payment: PaymentTransaction; order: Order }> {
    const res = await fetch(`${API_BASE}/billing/verify-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  // Step 8: Domain Activation
  async activateDomain(payload: {
    orderId: string;
    customerId: string;
  }): Promise<{
    message: string;
    domain: DomainRecord;
    registrarConfirmation?: any;
    isAlreadyActive?: boolean;
  }> {
    const res = await fetch(`${API_BASE}/domains/activate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getMyOrders(customerId: string): Promise<{ orders: Order[] }> {
    const res = await fetch(`${API_BASE}/billing/orders?customerId=${customerId}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getMyPayments(customerId: string): Promise<{ payments: PaymentTransaction[] }> {
    const res = await fetch(`${API_BASE}/billing/payments?customerId=${customerId}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getInvoice(orderId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/billing/invoice/${orderId}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Support Tickets
  async getTickets(customerId?: string): Promise<{ tickets: SupportTicket[] }> {
    const url = customerId ? `${API_BASE}/tickets?customerId=${customerId}` : `${API_BASE}/tickets`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getTicket(id: string): Promise<{ ticket: SupportTicket }> {
    const res = await fetch(`${API_BASE}/tickets/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createTicket(formData: FormData): Promise<{ message: string; ticket: SupportTicket }> {
    const token = localStorage.getItem('nexora_token');
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return handleResponse(res);
  },

  async replyTicket(ticketId: string, formData: FormData): Promise<{ message: string; ticket: SupportTicket }> {
    const token = localStorage.getItem('nexora_token');
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return handleResponse(res);
  },

  async updateTicketStatus(ticketId: string, status: string): Promise<{ message: string; ticket: SupportTicket }> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Admin
  async getAdminOverview(range: string = '30d'): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/overview?range=${range}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAdminCustomers(search: string = ''): Promise<{ customers: any[] }> {
    const res = await fetch(`${API_BASE}/admin/customers?search=${encodeURIComponent(search)}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAdminCustomer(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/customers/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async suspendCustomer(id: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/customers/${id}/suspend`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  async reactivateCustomer(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/customers/${id}/reactivate`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminDomains(): Promise<{ domains: DomainRecord[] }> {
    const res = await fetch(`${API_BASE}/admin/domains`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAdminHosting(): Promise<{ hosting: HostingAccount[] }> {
    const res = await fetch(`${API_BASE}/admin/hosting`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async suspendHosting(id: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/hosting/${id}/suspend`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  async reactivateHosting(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/hosting/${id}/reactivate`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminOrders(): Promise<{ orders: Order[] }> {
    const res = await fetch(`${API_BASE}/admin/orders`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAdminPayments(): Promise<{ payments: PaymentTransaction[] }> {
    const res = await fetch(`${API_BASE}/admin/payments`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async processRefund(body: { paymentId: string; reason: string; refundAmount?: number }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/refunds`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async updateHostingPlan(id: string, updates: Partial<HostingPlan>): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/plans/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async updateTldPricing(tld: string, updates: Partial<TldPricing>): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/tlds/${tld}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async getAdminSettings(): Promise<{ settings: PlatformSettings }> {
    const res = await fetch(`${API_BASE}/admin/settings`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAdminPromoDomainOffer(): Promise<{
    offer: any;
    isLive: boolean;
    allTlds: TldPricing[];
    stats: {
      ordersClaimed: number;
      maxOrders: number;
      remainingQuota: number;
      percentClaimed: number;
    };
  }> {
    const res = await fetch(`${API_BASE}/admin/promo-domain-offer`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async updateAdminPromoDomainOffer(updates: any): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/promo-domain-offer`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async saveAdminSettings(updates: Partial<PlatformSettings>): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async getStaff(): Promise<{ staff: any[] }> {
    const res = await fetch(`${API_BASE}/admin/staff`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async addStaff(body: any): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Notifications
  async getMyNotifications(customerId: string): Promise<{ notifications: NotificationItem[] }> {
    const res = await fetch(`${API_BASE}/notifications/my?customerId=${customerId}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async markNotificationRead(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async triggerRenewals(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/trigger-renewals`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Domain Plans (12 Tiers)
  async getDomainPlans(): Promise<{ plans: DomainServicePlan[] }> {
    const res = await fetch(`${API_BASE}/domains/plans`);
    return handleResponse(res);
  },

  async getAdminDomainPlans(): Promise<{ plans: DomainServicePlan[] }> {
    const res = await fetch(`${API_BASE}/admin/domain-plans`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async updateAdminDomainPlan(id: string, updates: Partial<DomainServicePlan>): Promise<{ message: string; plan: DomainServicePlan }> {
    const res = await fetch(`${API_BASE}/admin/domain-plans/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  // Coupons (Monthly 20% & 30%)
  async getCoupons(): Promise<{ coupons: Coupon[] }> {
    const res = await fetch(`${API_BASE}/billing/coupons`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async applyCoupon(code: string, subtotal: number, isPromoOffer?: boolean): Promise<{
    valid: boolean;
    discountPercent: number;
    discountAmount: number;
    finalAmount: number;
    message: string;
    coupon?: Coupon;
  }> {
    const res = await fetch(`${API_BASE}/billing/coupons/apply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, subtotal, isPromoOffer }),
    });
    return handleResponse(res);
  },

  async getAdminCoupons(): Promise<{ coupons: Coupon[] }> {
    const res = await fetch(`${API_BASE}/admin/coupons`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createAdminCoupon(body: Partial<Coupon>): Promise<{ message: string; coupon: Coupon }> {
    const res = await fetch(`${API_BASE}/admin/coupons`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async updateAdminCoupon(id: string, updates: Partial<Coupon>): Promise<{ message: string; coupon: Coupon }> {
    const res = await fetch(`${API_BASE}/admin/coupons/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async generateMonthlyCoupons(): Promise<{ message: string; coupons: Coupon[] }> {
    const res = await fetch(`${API_BASE}/admin/coupons/generate-monthly`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Backups
  async getBackups(customerId?: string): Promise<{ backups: BackupRecord[] }> {
    const url = customerId ? `${API_BASE}/billing/backups?customerId=${customerId}` : `${API_BASE}/billing/backups`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createBackup(body: { hostingId: string; type?: string; description?: string }): Promise<{ message: string; backup: BackupRecord }> {
    const res = await fetch(`${API_BASE}/billing/backups/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async deleteBackup(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/billing/backups/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async restoreBackup(id: string): Promise<{ message: string; restoredAt: string }> {
    const res = await fetch(`${API_BASE}/billing/backups/${id}/restore`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Strictly Admin-Only Demo Payment Verification
  async adminDemoPayment(orderId: string): Promise<{ message: string; payment: PaymentTransaction; order: Order }> {
    const res = await fetch(`${API_BASE}/billing/admin-demo-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ orderId }),
    });
    return handleResponse(res);
  },

  // Admin Payment & QR Code Management (Step 11)
  async getAdminPaymentSettings(): Promise<{ settings: PaymentSettings }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async uploadAdminQrCode(body: { name: string; imageUrl: string; isActive?: boolean }): Promise<{ message: string; qrCode: AdminQrCode; settings: PaymentSettings }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/qr-upload`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async activateAdminQrCode(id: string): Promise<{ message: string; qrCode: AdminQrCode; settings: PaymentSettings }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/qr/${id}/activate`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async deactivateAdminQrCode(id: string): Promise<{ message: string; settings: PaymentSettings }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/qr/${id}/deactivate`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async deleteAdminQrCode(id: string): Promise<{ message: string; settings: PaymentSettings }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/qr/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async replaceAdminQrCode(id: string, payload: { name?: string; imageUrl?: string; isActive?: boolean }): Promise<{ message: string; qrCode: AdminQrCode; settings: PaymentSettings }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/qr/${id}/replace`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateAdminMerchantName(merchantName: string): Promise<{ message: string; settings: PaymentSettings }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/merchant`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ merchantName }),
    });
    return handleResponse(res);
  },

  async updateAdminPaymentMethods(enabledMethods: any): Promise<{ message: string; settings: PaymentSettings }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/methods`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ enabledMethods }),
    });
    return handleResponse(res);
  },

  async getAdminPaymentAttempts(): Promise<{ attempts: PaymentAttempt[] }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/attempts`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAdminPaymentWebhooks(): Promise<{ webhooks: PaymentWebhook[] }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/webhooks`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAdminPendingPayments(): Promise<{ pendingOrders: Order[] }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/pending-payments`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAdminRefundRecords(): Promise<{ refunds: RefundRecord[] }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings/refunds`, { headers: getHeaders() });
    return handleResponse(res);
  },
};
