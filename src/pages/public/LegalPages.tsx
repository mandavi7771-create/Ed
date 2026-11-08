import React from 'react';

interface Props {
  navigate: (path: string) => void;
}

// 1. Terms and Conditions
export const TermsPage: React.FC<Props> = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Terms and Conditions</h1>
      <p className="text-slate-400">Last updated: January 1, 2026 · Nexora Cloud Infrastructure Pvt Ltd</p>

      <section className="space-y-2 border-t border-slate-800 pt-4">
        <h2 className="text-sm font-bold text-white">1. Provision of Services</h2>
        <p>
          Nexora Cloud provides cloud web hosting, domain name registration, automated DNS services, and SSL management. By ordering or maintaining an active account, you agree to comply with all applicable local, national, and international laws, as well as ICANN regulations.
        </p>
      </section>

      <section className="space-y-2 border-t border-slate-800 pt-4">
        <h2 className="text-sm font-bold text-white">2. Domain Ownership & Registrant Rights</h2>
        <p>
          The customer who registers a domain name is acknowledged as the lawful Registrant of that domain name using their submitted registrant contact details. Nexora acts as an authorized technical management registrar. Nexora will not transfer domain ownership without the customer's explicit, authenticated authorization.
        </p>
      </section>

      <section className="space-y-2 border-t border-slate-800 pt-4">
        <h2 className="text-sm font-bold text-white">3. Acceptable Use Policy</h2>
        <p>
          Customers must not upload or publish malware, phishing kits, illegal content, spam engines, or denial-of-service scripts. Uploaded ZIP archives are scanned automatically for path traversal and security integrity. Violations will result in immediate suspension with recorded cause.
        </p>
      </section>

      <section className="space-y-2 border-t border-slate-800 pt-4">
        <h2 className="text-sm font-bold text-white">4. Resource Quotas & SLAs</h2>
        <p>
          NVMe storage, RAM allocations, and bandwidth quotas are enforced per the purchased hosting tier. Advertised resources reflect authentic physical infrastructure allocations.
        </p>
      </section>
    </div>
  );
};

// 2. Privacy Policy
export const PrivacyPage: React.FC<Props> = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
      <p className="text-slate-400">Last updated: January 1, 2026 · Compliance with applicable data protection laws</p>

      <section className="space-y-2 border-t border-slate-800 pt-4">
        <h2 className="text-sm font-bold text-white">1. Information Collected</h2>
        <p>
          We collect only the essential customer information required to provision hosting and register domains: full name, company name (if applicable), billing address, email address, and mobile phone number. We never request unnecessary KYC documents from ordinary customers.
        </p>
      </section>

      <section className="space-y-2 border-t border-slate-800 pt-4">
        <h2 className="text-sm font-bold text-white">2. Payment Credential Security</h2>
        <p>
          Nexora Cloud does not store card CVVs, card PINs, UPI PINs, or one-time passwords (OTPs). Payments are processed securely via PCI-DSS compliant payment gateways with 256-bit SSL encryption.
        </p>
      </section>

      <section className="space-y-2 border-t border-slate-800 pt-4">
        <h2 className="text-sm font-bold text-white">3. WHOIS Privacy</h2>
        <p>
          For supported domain extensions, WHOIS privacy protection masks personal contact details from public lookups while preserving authoritative legal ownership with the customer.
        </p>
      </section>
    </div>
  );
};

// 3. Refund Policy
export const RefundPolicyPage: React.FC<Props> = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Refund Policy</h1>
      <p className="text-slate-400">Last updated: January 1, 2026 · Customer satisfaction and refund rules</p>

      <section className="space-y-2 border-t border-slate-800 pt-4">
        <h2 className="text-sm font-bold text-white">1. Cloud Web Hosting Services</h2>
        <p>
          All shared, business, professional, and enterprise hosting accounts come with a 30-day money-back guarantee. If you are unsatisfied with performance or compatibility within 30 days of initial purchase, contact support to receive a full refund through the original payment gateway.
        </p>
      </section>

      <section className="space-y-2 border-t border-slate-800 pt-4">
        <h2 className="text-sm font-bold text-white">2. Domain Name Registrations</h2>
        <p>
          Domain registration fees paid to central registries (e.g. Verisign, Public Interest Registry, NIXI) are non-refundable once the domain is confirmed as Active by the registrar. If domain registration fails after successful payment, a 100% immediate automated refund or balance credit is issued.
        </p>
      </section>

      <section className="space-y-2 border-t border-slate-800 pt-4">
        <h2 className="text-sm font-bold text-white">3. Processing Time</h2>
        <p>
          Approved refunds are processed via Gateway API within 24 hours. Depending on your bank or payment method (UPI, Debit Card, Net Banking), funds typically credit within 3 to 5 business days.
        </p>
      </section>
    </div>
  );
};
