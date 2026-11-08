import React from 'react';
import { Server, ShieldCheck, Lock, Award, HeartHandshake } from 'lucide-react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs">
      {/* Trust & Guarantee Strip */}
      <div className="border-b border-slate-900/80 bg-slate-950/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/50 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-200 text-xs">99.98% Uptime SLA</p>
              <p className="text-[11px] text-slate-500">Tier-3 NVMe Datacenters</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-200 text-xs">Free Automated SSL</p>
              <p className="text-[11px] text-slate-500">Let's Encrypt TLS 1.3 Pre-installed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-200 text-xs">ICANN Certified Registrar</p>
              <p className="text-[11px] text-slate-500">Authoritative Direct Registry</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-200 text-xs">24/7 Priority Support</p>
              <p className="text-[11px] text-slate-500">Direct Infrastructure Engineers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Link Directory (All 30 Required Platform Pages) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Server className="w-3.5 h-3.5" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">NexoraCloud</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Autonomous enterprise cloud hosting, live registrar connectivity, instant website ZIP deployment, and automated DNS infrastructure.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              <p>Nexora Cloud Infrastructure Pvt Ltd</p>
              <p>MG Road, Bengaluru, Karnataka 560001</p>
              <p className="mt-1 text-slate-400">GSTIN: 29AAACN8912P1ZX</p>
            </div>
          </div>

          {/* Hosting Solutions */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs tracking-wider uppercase mb-3">Hosting Solutions</h4>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => navigate('/web-hosting')} className="hover:text-white transition-colors">Web Hosting</button></li>
              <li><button onClick={() => navigate('/shared-hosting')} className="hover:text-white transition-colors">Shared Hosting</button></li>
              <li><button onClick={() => navigate('/business-hosting')} className="hover:text-white transition-colors">Business Hosting</button></li>
              <li><button onClick={() => navigate('/professional-hosting')} className="hover:text-white transition-colors">Professional Hosting</button></li>
              <li><button onClick={() => navigate('/enterprise-hosting')} className="hover:text-white transition-colors">Enterprise Hosting</button></li>
              <li><button onClick={() => navigate('/hosting-pricing')} className="text-blue-400 hover:text-blue-300 font-medium">All 11 Hosting Plans (₹1 to ₹40k)</button></li>
            </ul>
          </div>

          {/* Domain Services */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs tracking-wider uppercase mb-3">Domain Registry</h4>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => navigate('/domain-search')} className="hover:text-white transition-colors">Domain Search</button></li>
              <li><button onClick={() => navigate('/domain-registration')} className="hover:text-white transition-colors">Domain Registration</button></li>
              <li><button onClick={() => navigate('/domain-transfer')} className="hover:text-white transition-colors">Domain Transfer</button></li>
              <li><button onClick={() => navigate('/domain-pricing')} className="hover:text-white transition-colors">TLD Pricing Matrix</button></li>
              <li><button onClick={() => navigate('/dashboard/dns')} className="hover:text-white transition-colors">DNS Zone Manager</button></li>
              <li><button onClick={() => navigate('/dashboard/ssl')} className="hover:text-white transition-colors">Automated SSL Manager</button></li>
            </ul>
          </div>

          {/* Customer Portal */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs tracking-wider uppercase mb-3">Customer Portal</h4>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors">Customer Dashboard</button></li>
              <li><button onClick={() => navigate('/dashboard/hosting')} className="hover:text-white transition-colors">Hosting Management</button></li>
              <li><button onClick={() => navigate('/dashboard/domains')} className="hover:text-white transition-colors">Domain Management</button></li>
              <li><button onClick={() => navigate('/dashboard/deploy')} className="text-emerald-400 hover:text-emerald-300 font-medium">Website ZIP Deployment</button></li>
              <li><button onClick={() => navigate('/dashboard/filemanager')} className="hover:text-white transition-colors">Customer File Manager</button></li>
              <li><button onClick={() => navigate('/dashboard/billing')} className="hover:text-white transition-colors">Billing & GST Invoices</button></li>
              <li><button onClick={() => navigate('/dashboard/tickets')} className="hover:text-white transition-colors">Support Desk Tickets</button></li>
            </ul>
          </div>

          {/* Company & Compliance */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs tracking-wider uppercase mb-3">Company & Legal</h4>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => navigate('/about-us')} className="hover:text-white transition-colors">About Us</button></li>
              <li><button onClick={() => navigate('/contact-us')} className="hover:text-white transition-colors">Contact Us</button></li>
              <li><button onClick={() => navigate('/faq')} className="hover:text-white transition-colors">Frequently Asked Questions</button></li>
              <li><button onClick={() => navigate('/help-center')} className="hover:text-white transition-colors">Help Center & Guides</button></li>
              <li><button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms and Conditions</button></li>
              <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/refund-policy')} className="hover:text-white transition-colors">Refund Policy</button></li>
              <li><button onClick={() => navigate('/admin')} className="text-amber-400 hover:text-amber-300">Admin Control Center</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Nexora Cloud Infrastructure Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Payment Security: 256-Bit SSL Encrypted</span>
            <span>·</span>
            <span>Supported Gateways: UPI, Cards, NetBanking</span>
            <span>·</span>
            <span>Strict Anti-Phishing & Anti-Spam Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
