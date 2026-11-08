import React, { useState } from 'react';
import { Server, ShieldCheck, Mail, Phone, MapPin, Send, HelpCircle, CheckCircle2, ChevronDown } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

// 1. About Us Page
export const AboutPage: React.FC<Props> = ({ navigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">About Nexora Cloud</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          An autonomous, infrastructure-grade cloud hosting and authoritative domain registration enterprise built for high throughput, absolute customer data sovereignty, and instant website deployments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Genuine Infrastructure</h3>
          <p className="text-slate-400 leading-relaxed">
            We operate physical and virtualized bare-metal clusters in Tier-3 data facilities. We never advertise resources our infrastructure cannot strictly provide.
          </p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Authoritative Registrant Rights</h3>
          <p className="text-slate-400 leading-relaxed">
            The customer is always the primary legal Registrant of all purchased domains. We never transfer ownership away from the customer without explicit lawful authorization.
          </p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Zero AI Clutter</h3>
          <p className="text-slate-400 leading-relaxed">
            Customers already have their own websites. We provide clean, direct ZIP uploads, safe extractions, and isolated document roots so you publish immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

// 2. Contact Us Page
export const ContactPage: React.FC<Props> = ({ navigate }) => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Contact Engineering & Support</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Our cloud systems team is available 24 hours a day, 7 days a week.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5 text-xs">
          <h3 className="text-sm font-bold text-white">Operations Headquarters</h3>
          <div className="space-y-4 text-slate-300">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Nexora Cloud Infrastructure Pvt Ltd</p>
                <p className="text-slate-400">Nexora Tower, MG Road, Bengaluru, Karnataka, 560001, India</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-white">support@nexoracloud.com</p>
                <p className="text-slate-400">Enterprise SLA Response under 15 mins</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-white">+91 800-456-7890</p>
                <p className="text-slate-400">Direct Infrastructure Engineer Hotline</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
          {submitted ? (
            <div className="p-6 text-center space-y-3 bg-emerald-950/40 border border-emerald-800 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">Inquiry Dispatched</h4>
              <p className="text-slate-300">Thank you, {name}. A support engineer has been assigned and will reply to {email} shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. FAQ Page
export const FaqPage: React.FC<Props> = ({ navigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does website ZIP deployment work?',
      a: 'After purchasing any hosting plan, go to your Customer Dashboard > Website Deployment. Select your .zip archive and click Deploy. Our server validates against path traversal and ZIP bomb threats, extracts the files safely into your isolated /public_html directory, runs a health check, and publishes your site with Let\'s Encrypt SSL immediately.',
    },
    {
      q: 'What is the ₹1/year promotional hosting offer?',
      a: 'The ₹1/year plan is an authentic introductory cloud hosting package designed to support emerging businesses, students, and startups. It provides 10 GB NVMe storage, unmetered bandwidth, and full customer dashboard access for 1 full year. Renewal rates are clearly displayed prior to purchase (₹499/yr).',
    },
    {
      q: 'Who owns the domain name after registration?',
      a: 'You do. The customer is registered as the exclusive legal Registrant with their submitted name and contact details. Nexora acts strictly as the technical registrar partner. Domain transfers, EPP auth codes, and DNS management remain under your direct control.',
    },
    {
      q: 'Do you offer instant domain transfers?',
      a: 'No, and we never make false claims of instant transfers. Domain transfers adhere strictly to ICANN and Registry verification timelines, typically requiring 5 to 7 days for the losing registrar to release the domain authorization.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We support all major payment options enabled through authorized gateways: UPI (Direct QR code, Google Pay, PhonePe, Paytm, BHIM, and UPI Intent), Debit and Credit Cards (Visa, MasterCard, RuPay, Amex), and Net Banking across major financial institutions.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h1>
        <p className="text-xs sm:text-sm text-slate-400">Clear answers regarding our hosting infrastructure, domain rules, and policies.</p>
      </div>

      <div className="space-y-3 text-xs">
        {faqs.map((f, i) => (
          <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between text-left font-semibold text-slate-200 text-sm hover:text-white"
            >
              <span>{f.q}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
            </button>
            {openIndex === i && (
              <p className="text-slate-400 leading-relaxed pt-1 border-t border-slate-800/60">
                {f.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Help Center Page
export const HelpCenterPage: React.FC<Props> = ({ navigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Nexora Help Center & Knowledge Base</h1>
        <p className="text-xs sm:text-sm text-slate-400">Step-by-step documentation for deploying websites, managing DNS, and securing domains.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white">ZIP Deployment Guide</h3>
          <p className="text-slate-400 leading-relaxed">
            Learn how to package Vite, React, static HTML/CSS, or PHP websites into a clean ZIP file for 1-click deployment.
          </p>
          <button onClick={() => navigate('/dashboard/deploy')} className="text-blue-400 hover:underline font-semibold block">
            Read Deployment Guide →
          </button>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white">DNS Zone Records</h3>
          <p className="text-slate-400 leading-relaxed">
            How to point A records, configure mail exchangers (MX), setup CNAME aliases, and verify DKIM/SPF TXT records.
          </p>
          <button onClick={() => navigate('/dashboard/dns')} className="text-blue-400 hover:underline font-semibold block">
            DNS Instructions →
          </button>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white">Customer Support Desk</h3>
          <p className="text-slate-400 leading-relaxed">
            Need hands-on technical troubleshooting? Open a ticket directly with our systems engineering team.
          </p>
          <button onClick={() => navigate('/dashboard/tickets')} className="text-emerald-400 hover:underline font-semibold block">
            Open Support Ticket →
          </button>
        </div>
      </div>
    </div>
  );
};
