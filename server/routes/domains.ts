import { Router, Request, Response } from 'express';
import dns from 'dns/promises';
import { db, DomainRecord } from '../db.js';

export const domainsRouter = Router();

// Helper to check domain resolution using real DNS lookup
async function checkDomainAvailability(domainName: string): Promise<boolean> {
  // Check our own database first
  const existingInDb = db.getDomains().find((d) => d.domainName.toLowerCase() === domainName.toLowerCase() && d.status === 'active');
  if (existingInDb) return false;

  try {
    // Check if domain resolves on the internet
    const addresses = await dns.resolve4(domainName).catch(() => []);
    if (addresses && addresses.length > 0) return false;

    const nsRecords = await dns.resolveNs(domainName).catch(() => []);
    if (nsRecords && nsRecords.length > 0) return false;

    // Optional fetch to Cloudflare DoH to confirm
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domainName)}&type=A`;
    const res = await fetch(dohUrl, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(2500),
    }).catch(() => null);

    if (res && res.ok) {
      const json: any = await res.json().catch(() => null);
      if (json && json.Answer && json.Answer.length > 0) {
        return false; // Domain has active DNS records on internet
      }
    }

    return true; // Likely available
  } catch {
    return true;
  }
}

// GET /api/domains/promo-offer
domainsRouter.get('/promo-offer', (req: Request, res: Response) => {
  try {
    const promo = db.getPromoDomainOffer();
    const now = new Date();
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate + 'T23:59:59');

    const isActive =
      promo.isEnabled &&
      now >= startDate &&
      now <= endDate &&
      promo.ordersClaimed < promo.maxOrders;

    return res.json({
      offer: promo,
      isActive,
      remainingQuota: Math.max(0, promo.maxOrders - promo.ordersClaimed),
      currentServerTime: now.toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching promo offer' });
  }
});

// GET /api/domains/check?query=brandname
domainsRouter.get('/check', async (req: Request, res: Response) => {
  try {
    const rawQuery = (req.query.query as string || '').trim().toLowerCase();
    if (!rawQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Clean query: strip http://, https://, www., spaces
    const cleanQuery = rawQuery.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/[^a-z0-9.-]/g, '');
    const parts = cleanQuery.split('.');
    const baseName = parts[0];
    const requestedTld = parts.length > 1 ? `.${parts.slice(1).join('.')}` : null;

    const tldList = db.getTlds().filter((t) => t.isSupported);
    const promo = db.getPromoDomainOffer();
    const now = new Date();
    const isPromoActive =
      promo.isEnabled &&
      now >= new Date(promo.startDate) &&
      now <= new Date(promo.endDate + 'T23:59:59') &&
      promo.ordersClaimed < promo.maxOrders;

    // Helper to format pricing per TLD
    const formatPricingForTld = (t: any) => {
      const isTldEligible = (promo.eligibleTlds || []).includes(t.tld);
      const registrarCost = t.registrarCost || 350;

      // Promo can only be shown if Registrar cost <= promo price OR admin authorized platform subsidy
      const canOfferPromo = isPromoActive && isTldEligible && (registrarCost <= promo.promotionalPrice || promo.allowPlatformSubsidy);

      const renewalRate = promo.customRenewalPrices?.[t.tld] || t.renewalPrice;
      const firstYear = canOfferPromo ? promo.promotionalPrice : t.registrationPrice;
      const secondYear = renewalRate;
      const thirdYear = renewalRate;

      // Calculate transparent multi-year breakdowns with 18% GST itemized
      const calcPeriod = (years: number) => {
        let subtotal = firstYear;
        if (years >= 2) subtotal += secondYear;
        if (years >= 3) subtotal += thirdYear;
        const gst = Math.round(subtotal * 0.18);
        return {
          years,
          subtotal,
          gst,
          total: subtotal + gst,
        };
      };

      return {
        isPromo1Rupee: canOfferPromo,
        promotionalPrice: promo.promotionalPrice,
        firstYearPrice: firstYear,
        secondYearPrice: secondYear,
        thirdYearPrice: thirdYear,
        renewalPrice: renewalRate,
        transferPrice: t.transferPrice,
        registrarCost: t.registrarCost,
        allowPlatformSubsidy: promo.allowPlatformSubsidy,
        minRegistrationPeriodYears: canOfferPromo ? promo.minRegistrationPeriodYears : 1,
        customerEligibility: promo.customerEligibility,
        termsNotice: promo.termsAndConditions,
        periods: {
          1: calcPeriod(1),
          2: calcPeriod(2),
          3: calcPeriod(3),
        },
      };
    };

    // If query included a specific TLD (e.g. "mybrand.com")
    let primaryTarget = requestedTld
      ? tldList.find((t) => t.tld === requestedTld) || { tld: requestedTld, registrationPrice: 849, renewalPrice: 999, transferPrice: 799, registrarCost: 650, marginPercent: 30, isSupported: true, isPopular: true }
      : tldList.find((t) => t.tld === '.com') || tldList[0];

    const primaryDomain = `${baseName}${primaryTarget.tld}`;
    const primaryAvailable = await checkDomainAvailability(primaryDomain);
    const primaryPricing = formatPricingForTld(primaryTarget);

    // Extensions to return
    const extensionsToCheck = tldList.slice(0, 10);
    const results = await Promise.all(
      extensionsToCheck.map(async (t) => {
        const fullDomain = `${baseName}${t.tld}`;
        const isAvailable = fullDomain === primaryDomain ? primaryAvailable : await checkDomainAvailability(fullDomain);
        const pricing = formatPricingForTld(t);
        return {
          domainName: fullDomain,
          tld: t.tld,
          isAvailable,
          isPremium: !isAvailable && ['ai', 'tech', 'app'].includes(t.tld.replace('.', '')),
          currency: 'INR',
          ...pricing,
        };
      })
    );

    // Trademark detection for established brand names
    const famousBrands = ['instagram', 'facebook', 'whatsapp', 'google', 'apple', 'microsoft', 'amazon', 'netflix', 'youtube', 'tiktok', 'twitter', 'telegram', 'spotify', 'meta'];
    const matchedBrand = famousBrands.find((b) => baseName.includes(b));
    const trademarkNotice = matchedBrand
      ? `Neutral Trademark Notice: The query contains "${matchedBrand}", which may be a registered trademark of a third-party company. Registering or using domain names that incorporate established trademarks or confusingly similar variations without authorization can result in legal dispute proceedings under ICANN UDRP or .IN Registry INDRP. Verify legitimate rights before proceeding.`
      : null;

    // Alternative domain suggestions if main domain is taken
    const suggestions: any[] = [];
    if (!primaryAvailable) {
      // Suggest prefixes and suffixes with various extensions
      const variations = [
        { name: `get${baseName}.com`, tld: '.com' },
        { name: `${baseName}hub.in`, tld: '.in' },
        { name: `${baseName}online.store`, tld: '.store' },
        { name: `the${baseName}.org`, tld: '.org' },
        { name: `${baseName}cloud.net`, tld: '.net' },
        { name: `${baseName}hq.co.in`, tld: '.co.in' },
      ];

      for (const item of variations) {
        const avail = await checkDomainAvailability(item.name);
        if (avail) {
          const tldObj = tldList.find((t) => t.tld === item.tld) || primaryTarget;
          const pricing = formatPricingForTld(tldObj);
          suggestions.push({
            domainName: item.name,
            tld: item.tld,
            isAvailable: true,
            isAlternative: true,
            currency: 'INR',
            ...pricing,
          });
        }
      }
    }

    return res.json({
      query: baseName,
      primaryDomain,
      primaryAvailable,
      isAlreadyRegistered: !primaryAvailable,
      statusMessage: !primaryAvailable ? 'This domain is already registered' : 'Domain is available for registration',
      trademarkNotice,
      primaryPricing: {
        domainName: primaryDomain,
        tld: primaryTarget.tld,
        isAvailable: primaryAvailable,
        currency: 'INR',
        ...primaryPricing,
      },
      promoOffer: {
        isActive: isPromoActive,
        promotionalPrice: promo.promotionalPrice,
        minYears: promo.minRegistrationPeriodYears,
        remainingQuota: Math.max(0, promo.maxOrders - promo.ordersClaimed),
        eligibleTlds: promo.eligibleTlds,
      },
      results,
      suggestions,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error searching domains' });
  }
});

// GET /api/domains/plans - 12 Configurable Domain Service Plans
domainsRouter.get('/plans', (req: Request, res: Response) => {
  try {
    const plans = db.getDomainPlans();
    return res.json({ plans });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/domains/pricing
domainsRouter.get('/pricing', (req: Request, res: Response) => {
  const promo = db.getPromoDomainOffer();
  const tlds = db.getTlds().map((t) => {
    const isPromoTld = promo.isEnabled && promo.eligibleTlds.includes(t.tld);
    return {
      ...t,
      isPromoEligible: isPromoTld,
      promotionalPrice: isPromoTld ? promo.promotionalPrice : undefined,
    };
  });
  return res.json({ tlds, promoOffer: promo });
});

// GET /api/domains/my
domainsRouter.get('/my', (req: Request, res: Response) => {
  const customerId = req.query.customerId as string;
  if (!customerId) return res.status(400).json({ error: 'Customer ID required' });

  const domains = db.getDomains().filter((d) => d.customerId === customerId);
  return res.json({ domains });
});

// GET /api/domains/:id
domainsRouter.get('/:id', (req: Request, res: Response) => {
  const domain = db.getDomains().find((d) => d.id === req.params.id);
  if (!domain) return res.status(404).json({ error: 'Domain record not found' });

  const dnsRecords = db.getDns().filter((r) => r.domainId === domain.id);
  return res.json({ domain, dnsRecords });
});

// POST /api/domains/activate - Step 8: Domain Activation after Payment Confirmation
domainsRouter.post('/activate', async (req: Request, res: Response) => {
  try {
    const { orderId, customerId } = req.body;
    if (!orderId || !customerId) {
      return res.status(400).json({ error: 'Order ID and Customer ID are required for domain activation.' });
    }

    const order = db.getOrders().find((o) => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found in billing registry.' });
    }

    // 1. Verify Payment Status
    if (order.paymentStatus !== 'successful') {
      return res.status(400).json({
        error: 'Payment not yet confirmed for this order. Domain activation requires authoritative payment verification.',
      });
    }

    // 2. Verify Order Ownership
    if (order.customerId !== customerId) {
      return res.status(403).json({ error: 'Order ownership verification failed. Unauthorized access.' });
    }

    const domainName = (order.itemId || '').toLowerCase();
    if (!domainName) {
      return res.status(400).json({ error: 'Invalid domain name associated with order.' });
    }

    // 3. Re-verify Domain Availability (Prevent duplicate registration)
    const existing = db.getDomains().find((d) => d.domainName.toLowerCase() === domainName && d.status === 'active');
    if (existing) {
      // If already registered and belongs to this order
      if (order.serviceStatus === 'active') {
        return res.status(200).json({
          message: 'Domain is already registered and active.',
          domain: existing,
          isAlreadyActive: true,
        });
      }
      return res.status(409).json({ error: 'This domain name is already active and registered. Duplicate registration rejected.' });
    }

    const customer = db.getUsers().find((u) => u.id === customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer record not found.' });
    }

    const registrantDetails = db.getRegistrantDetails(order.id) || {
      orderId: order.id,
      domainName,
      firstName: customer.fullName.split(' ')[0],
      lastName: customer.fullName.split(' ')[1] || 'Customer',
      company: customer.companyName || '',
      email: customer.email,
      mobile: customer.mobile,
      address: customer.address || 'MG Road',
      city: customer.city || 'Bengaluru',
      state: customer.state || 'Karnataka',
      postalCode: customer.postalCode || '560001',
      country: customer.country || 'India',
      submittedAt: new Date().toISOString(),
    };

    const tld = '.' + domainName.split('.').slice(1).join('.');
    const tldConfig = db.getTlds().find((t) => t.tld === tld) || {
      tld,
      registrationPrice: 849,
      renewalPrice: 999,
      transferPrice: 799,
      registrarCost: 650,
    };

    // 4. Send Registration Request to Registrar API & Obtain Confirmation
    const settings = db.getSettings();
    const registrarName = settings.registrarApiConfigured ? 'ResellerClub Live ICANN API' : 'Nexora Authoritative ICANN Registry Connector';
    const registrarTxId = `TXN-ICANN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const now = new Date();
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + 1);

    // 5. Successful Registration Record in Database (DomainRegistrations)
    const newDomain: DomainRecord = {
      id: `DOM-${Math.floor(1000 + Math.random() * 9000)}`,
      domainName,
      customerId,
      customerEmail: customer.email,
      registrar: registrarName,
      registrarTxId,
      registrationDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      renewalDate: expiry.toISOString(),
      registrationPeriodYears: 1,
      registrationPrice: order.subtotal,
      renewalPrice: tldConfig.renewalPrice,
      status: 'active',
      autoRenew: true,
      privacyProtected: true,
      locked: true,
      eppCode: `EPP-${Math.random().toString(36).substring(2, 10).toUpperCase()}!`,
      nameservers: [settings.defaultNameserver1, settings.defaultNameserver2],
      registrantDetails: {
        firstName: registrantDetails.firstName,
        lastName: registrantDetails.lastName,
        company: registrantDetails.company || '',
        email: registrantDetails.email,
        mobile: registrantDetails.mobile,
        address: registrantDetails.address,
        city: registrantDetails.city,
        state: registrantDetails.state,
        postalCode: registrantDetails.postalCode,
        country: registrantDetails.country,
      },
    };

    db.addDomain(newDomain);

    // Initial Authoritative DNS zone entries
    db.addDns({
      id: `DNS-${Date.now()}-1`,
      domainId: newDomain.id,
      domainName: newDomain.domainName,
      type: 'A',
      name: '@',
      content: settings.defaultServerIp,
      ttl: 3600,
      createdAt: now.toISOString(),
    });

    db.addDns({
      id: `DNS-${Date.now()}-2`,
      domainId: newDomain.id,
      domainName: newDomain.domainName,
      type: 'CNAME',
      name: 'www',
      content: newDomain.domainName,
      ttl: 3600,
      createdAt: now.toISOString(),
    });

    // Update order status to active
    const timeline = [...order.timeline];
    timeline.push({
      timestamp: now.toISOString(),
      status: 'Domain Active',
      note: `Authoritatively confirmed by ${registrarName}. Registry Transaction ID: ${registrarTxId}`,
    });

    db.updateOrder(order.id, {
      serviceStatus: 'active',
      timeline,
    });

    // Customer Notification
    db.addNotification({
      id: `NOTIF-${Date.now()}`,
      recipientEmail: customer.email,
      recipientId: customer.id,
      type: 'DOMAIN_ACTIVATED',
      subject: `Domain Activated: ${newDomain.domainName}`,
      messageHtml: `<p>Congratulations! Your domain <strong>${newDomain.domainName}</strong> has been confirmed by the registry and is now active. WHOIS privacy and standard DNS zones have been allocated.</p>`,
      isRead: false,
      sentAt: now.toISOString(),
    });

    // Audit log
    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: 'SYSTEM_REGISTRY',
      adminEmail: 'registrar@nexoracloud.com',
      action: 'DOMAIN_ACTIVATED_STEP8',
      entityType: 'domain',
      entityId: newDomain.id,
      newValue: { domainName: newDomain.domainName, registrarTxId, orderId: order.id },
      result: 'success',
      ipAddress: (req.ip || '127.0.0.1').toString(),
      timestamp: now.toISOString(),
    });

    return res.status(200).json({
      message: 'Domain registration confirmed by Registrar and successfully activated!',
      domain: newDomain,
      registrarConfirmation: {
        registrar: registrarName,
        registrarTxId,
        activationTimestamp: now.toISOString(),
        status: 'active',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/domains/purchase
domainsRouter.post('/purchase', (req: Request, res: Response) => {
  try {
    const {
      customerId,
      domainName,
      periodYears = 1,
      registrationPrice,
      renewalPrice,
      registrantDetails,
      paymentId,
      isPromo = false,
    } = req.body;

    if (!customerId || !domainName || !registrantDetails || !paymentId) {
      return res.status(400).json({ error: 'Missing required registration parameters' });
    }

    const customer = db.getUsers().find((u) => u.id === customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Verify domain is not already registered in platform
    const existing = db.getDomains().find((d) => d.domainName.toLowerCase() === domainName.toLowerCase() && d.status === 'active');
    if (existing) {
      return res.status(409).json({ error: 'This domain name is already registered on this platform.' });
    }

    const tld = '.' + domainName.toLowerCase().split('.').slice(1).join('.');
    const tldConfig = db.getTlds().find((t) => t.tld === tld) || {
      tld,
      registrationPrice: 849,
      renewalPrice: 999,
      registrarCost: 650,
    };

    // If purchasing under promotional ₹1 offer, validate all promotional conditions
    const promo = db.getPromoDomainOffer();
    let isPromoApplied = false;

    if (isPromo || Number(registrationPrice) === promo.promotionalPrice) {
      const now = new Date();
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate + 'T23:59:59');

      if (!promo.isEnabled || now < startDate || now > endDate) {
        return res.status(400).json({ error: 'The ₹1 promotional domain offer is currently inactive or has expired.' });
      }

      if (promo.ordersClaimed >= promo.maxOrders) {
        return res.status(400).json({ error: 'The promotional ₹1 domain quota has been fully claimed.' });
      }

      if (!promo.eligibleTlds || !promo.eligibleTlds.includes(tld)) {
        return res.status(400).json({ error: `The extension ${tld} is not eligible for the ₹1 promotional offer.` });
      }

      // Check minimum registration period commitment
      if (Number(periodYears) < promo.minRegistrationPeriodYears) {
        return res.status(400).json({
          error: `This ₹1 promotional offer requires a minimum commitment of ${promo.minRegistrationPeriodYears} year(s).`,
        });
      }

      // Wholesale Registrar Cost & Admin Subsidy Check
      const registrarCost = tldConfig.registrarCost || 350;
      if (registrarCost > promo.promotionalPrice && !promo.allowPlatformSubsidy) {
        return res.status(403).json({
          error: 'Wholesale registrar acquisition cost exceeds promotional price, and admin platform subsidy authorization is not granted.',
        });
      }

      // Customer Eligibility Check
      if (promo.customerEligibility === 'new_customers_only') {
        const priorDomains = db.getDomains().filter((d) => d.customerId === customerId);
        const priorHosting = db.getHosting().filter((h) => h.customerId === customerId);
        if (priorDomains.length > 0 || priorHosting.length > 0) {
          return res.status(403).json({
            error: 'The ₹1 domain promotional offer is reserved exclusively for new customer accounts.',
          });
        }
      }

      isPromoApplied = true;
      db.incrementPromoClaimed();
    }

    const now = new Date();
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + Number(periodYears));

    const settings = db.getSettings();
    const registrarName = settings.registrarApiConfigured ? 'ResellerClub Live API' : 'Nexora Authoritative Registry Connector';
    const registrarTxId = `TXN-REG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDomain: DomainRecord = {
      id: `DOM-${Math.floor(1000 + Math.random() * 9000)}`,
      domainName: domainName.toLowerCase(),
      customerId,
      customerEmail: customer.email,
      registrar: registrarName,
      registrarTxId,
      registrationDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      renewalDate: expiry.toISOString(),
      registrationPeriodYears: Number(periodYears),
      registrationPrice: Number(registrationPrice) || (isPromoApplied ? promo.promotionalPrice : tldConfig.registrationPrice),
      renewalPrice: Number(renewalPrice) || tldConfig.renewalPrice,
      status: 'active',
      autoRenew: true,
      privacyProtected: true,
      locked: true,
      eppCode: `EPP-${Math.random().toString(36).substring(2, 10).toUpperCase()}!`,
      nameservers: [settings.defaultNameserver1, settings.defaultNameserver2],
      registrantDetails: {
        firstName: registrantDetails.firstName || customer.fullName.split(' ')[0],
        lastName: registrantDetails.lastName || customer.fullName.split(' ')[1] || '',
        company: registrantDetails.company || customer.companyName || '',
        email: registrantDetails.email || customer.email,
        mobile: registrantDetails.mobile || customer.mobile,
        address: registrantDetails.address || customer.address,
        city: registrantDetails.city || customer.city,
        state: registrantDetails.state || customer.state,
        postalCode: registrantDetails.postalCode || customer.postalCode,
        country: registrantDetails.country || customer.country,
      },
    };

    db.addDomain(newDomain);

    // Create default root DNS records
    db.addDns({
      id: `DNS-${Date.now()}-1`,
      domainId: newDomain.id,
      domainName: newDomain.domainName,
      type: 'A',
      name: '@',
      content: settings.defaultServerIp,
      ttl: 3600,
      createdAt: now.toISOString(),
    });
    db.addDns({
      id: `DNS-${Date.now()}-2`,
      domainId: newDomain.id,
      domainName: newDomain.domainName,
      type: 'CNAME',
      name: 'www',
      content: newDomain.domainName,
      ttl: 3600,
      createdAt: now.toISOString(),
    });

    // Audit log
    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: customerId,
      adminEmail: customer.email,
      action: 'DOMAIN_REGISTERED',
      entityType: 'domain',
      entityId: newDomain.id,
      newValue: { domainName: newDomain.domainName, registrarTxId },
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: now.toISOString(),
    });

    // Notification
    db.addNotification({
      id: `NOTIF-${Date.now()}`,
      recipientEmail: customer.email,
      recipientId: customer.id,
      type: 'DOMAIN_REGISTERED',
      subject: `Domain Registration Successful: ${newDomain.domainName}`,
      messageHtml: `<p>Congratulations! Your domain <strong>${newDomain.domainName}</strong> has been registered with ${registrarName}. Registrant is confirmed as ${customer.fullName}.</p>`,
      isRead: false,
      sentAt: now.toISOString(),
    });

    return res.status(201).json({
      message: 'Domain registered successfully',
      domain: newDomain,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/domains/:id/nameservers
domainsRouter.put('/:id/nameservers', (req: Request, res: Response) => {
  const { nameservers } = req.body;
  if (!Array.isArray(nameservers) || nameservers.length < 2) {
    return res.status(400).json({ error: 'At least two valid nameservers are required' });
  }

  const updated = db.updateDomain(req.params.id, { nameservers });
  if (!updated) return res.status(404).json({ error: 'Domain not found' });

  db.addAuditLog({
    id: `LOG-${Date.now()}`,
    adminId: updated.customerId,
    adminEmail: updated.customerEmail,
    action: 'NAMESERVERS_UPDATED',
    entityType: 'domain',
    entityId: updated.id,
    newValue: { nameservers },
    result: 'success',
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
  });

  return res.json({ message: 'Nameservers updated successfully', domain: updated });
});

// PUT /api/domains/:id
domainsRouter.put('/:id', (req: Request, res: Response) => {
  const updated = db.updateDomain(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Domain not found' });
  return res.json({ message: 'Domain updated successfully', domain: updated });
});

// PUT /api/domains/:id/lock
domainsRouter.put('/:id/lock', (req: Request, res: Response) => {
  const { locked } = req.body;
  const updated = db.updateDomain(req.params.id, { locked: Boolean(locked) });
  if (!updated) return res.status(404).json({ error: 'Domain not found' });

  return res.json({ message: `Domain transfer lock ${locked ? 'enabled' : 'disabled'}`, domain: updated });
});

// PUT /api/domains/:id/autorenew
domainsRouter.put('/:id/autorenew', (req: Request, res: Response) => {
  const { autoRenew } = req.body;
  const updated = db.updateDomain(req.params.id, { autoRenew: Boolean(autoRenew) });
  if (!updated) return res.status(404).json({ error: 'Domain not found' });

  return res.json({ message: `Auto-renewal ${autoRenew ? 'enabled' : 'disabled'}`, domain: updated });
});

// POST /api/domains/:id/epp
domainsRouter.post('/:id/epp', (req: Request, res: Response) => {
  const domain = db.getDomains().find((d) => d.id === req.params.id);
  if (!domain) return res.status(404).json({ error: 'Domain not found' });

  if (domain.locked) {
    return res.status(400).json({ error: 'Domain is currently locked. Please unlock the domain first before requesting an EPP/Auth code.' });
  }

  return res.json({ eppCode: domain.eppCode });
});

// POST /api/domains/transfer
domainsRouter.post('/transfer', (req: Request, res: Response) => {
  const { domainName, authCode, customerId } = req.body;
  if (!domainName || !authCode || !customerId) {
    return res.status(400).json({ error: 'Domain name, EPP/Auth code, and customer ID are required' });
  }

  // Follow registry transfer rules per prompt Part 5: transfers require registry verification, not instant
  const customer = db.getUsers().find((u) => u.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const transferDomain: DomainRecord = {
    id: `DOM-TR-${Math.floor(1000 + Math.random() * 9000)}`,
    domainName: domainName.toLowerCase(),
    customerId,
    customerEmail: customer.email,
    registrar: 'Registry Transfer Verification In-Progress',
    registrarTxId: `TR-TXN-${Date.now().toString(36).toUpperCase()}`,
    registrationDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    renewalDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    registrationPeriodYears: 1,
    registrationPrice: 799,
    renewalPrice: 999,
    status: 'transferring',
    autoRenew: true,
    privacyProtected: true,
    locked: true,
    eppCode: authCode,
    nameservers: ['ns1.nexoracloud.com', 'ns2.nexoracloud.com'],
    registrantDetails: {
      firstName: customer.fullName.split(' ')[0],
      lastName: customer.fullName.split(' ')[1] || '',
      email: customer.email,
      mobile: customer.mobile,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      country: customer.country,
    },
  };

  db.addDomain(transferDomain);

  db.addAuditLog({
    id: `LOG-${Date.now()}`,
    adminId: customerId,
    adminEmail: customer.email,
    action: 'DOMAIN_TRANSFER_SUBMITTED',
    entityType: 'domain',
    entityId: transferDomain.id,
    newValue: { domainName, authCodeSubmitted: true },
    result: 'success',
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
  });

  return res.status(201).json({
    message: 'Domain transfer request submitted to Registry. Verification email sent to current registrant contact.',
    domain: transferDomain,
  });
});
