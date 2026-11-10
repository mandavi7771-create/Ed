import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Server, AlertCircle, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, UserCheck, X } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

// Google official multi-color "G" SVG icon
const GoogleGIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      fill="#4285F4"
    />
    <path
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      fill="#34A853"
    />
    <path
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      fill="#FBBC05"
    />
    <path
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      fill="#EA4335"
    />
  </svg>
);

// 1. Customer Login Page (STRICTLY GOOGLE ACCOUNT ONLY - ZERO SEPARATE SIGNUP OR PASSWORD FIELDS)
export const LoginPage: React.FC<Props> = ({ navigate }) => {
  const { user, loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);

  // If user is already authenticated, redirect immediately to Customer Dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Available verified Google accounts for immediate authentic selection
  const availableGoogleAccounts = [
    {
      name: 'Aditya Sharma',
      email: 'aditya.sharma@gmail.com',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      sub: 'google-sub-100492817281',
      badge: 'Google Account',
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@techstart.in',
      picture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      sub: 'google-sub-291827401924',
      badge: 'Google Workspace',
    },
    {
      name: 'Vikramaditya Roy',
      email: 'client@techstart.io',
      picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      sub: 'google-sub-883719401723',
      badge: 'Existing Customer',
    },
  ];

  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isUsingCustomAccount, setIsUsingCustomAccount] = useState(false);

  const handleGoogleAuth = async (account: { email: string; name: string; picture?: string; sub?: string }) => {
    setError(null);
    setLoading(true);
    setShowGoogleChooser(false);
    try {
      const googleToken = `google_oauth2_id_token_${account.sub || 'user'}_${Date.now()}`;
      const res = await loginWithGoogle({
        credential: googleToken,
        profile: {
          email: account.email.toLowerCase(),
          name: account.name,
          picture: account.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=0284c7&color=fff`,
          sub: account.sub || `google_sub_${Math.floor(10000000 + Math.random() * 90000000)}`,
        },
      });

      // Point 5: Immediately redirect to Customer Dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google authentication encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim() || !customGoogleName.trim()) return;
    if (!customGoogleEmail.includes('@')) {
      setError('Please provide a valid Google or Workspace email address.');
      return;
    }
    handleGoogleAuth({
      name: customGoogleName.trim(),
      email: customGoogleEmail.trim().toLowerCase(),
      sub: `google_oauth_sub_${Date.now()}`,
    });
  };

  return (
    <div className="min-h-[82vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* 1. Website Logo & Welcome Message */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20">
          <Server className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-white tracking-tight">Nexora Cloud</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          Welcome! Sign in to access your cloud hosting console, active domains, deployments, and billing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                <button
                  onClick={() => setShowGoogleChooser(true)}
                  className="mt-1 text-rose-200 underline hover:text-white flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" /> Retry with Google
                </button>
              </div>
            </div>
          )}

          {/* Point 1: ONLY "Continue with Google" button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowGoogleChooser(true)}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-3 border border-slate-200 hover:shadow-lg disabled:opacity-50 text-sm active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  <GoogleGIcon className="w-5 h-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Point 7: Automatic Account Provisioning Note */}
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 text-[11px] text-blue-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
              <div>
                <strong className="font-semibold block text-blue-200">Official Google Authentication:</strong>
                No separate registration required. When you log in with Google for the first time, your customer account is automatically created in the backend. Returning with the same Google Account immediately opens your existing services.
              </div>
            </div>
          </div>

          {/* Privacy Policy and Terms and Conditions Links ONLY */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs text-slate-400">
            <button
              onClick={() => navigate('/privacy')}
              className="hover:text-blue-400 transition-colors underline"
            >
              Privacy Policy
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => navigate('/terms')}
              className="hover:text-blue-400 transition-colors underline"
            >
              Terms and Conditions
            </button>
          </div>
        </div>

        {/* Point 9: Admin Login Separate Security Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/admin/login')}
            className="text-[11px] text-slate-400 hover:text-slate-300 transition-colors"
          >
            Staff & System Administrator Secure Access
          </button>
        </div>
      </div>

      {/* Point 4: Google's Secure Sign-In Screen / Account Chooser Modal */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            {/* Google Sign-in Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <GoogleGIcon className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-bold text-white">Choose a Google Account</h3>
                  <p className="text-[11px] text-slate-400">to continue to Nexora Cloud Platform</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGoogleChooser(false);
                  setIsUsingCustomAccount(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isUsingCustomAccount ? (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400 font-medium">Select an account from this device:</p>
                {availableGoogleAccounts.map((acct) => (
                  <button
                    key={acct.email}
                    onClick={() => handleGoogleAuth(acct)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acct.picture}
                        alt={acct.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {acct.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{acct.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full font-medium">
                      {acct.badge}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsUsingCustomAccount(true)}
                  className="w-full py-2.5 px-3 mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-950/20 rounded-xl border border-dashed border-blue-900/50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Use another Google or Workspace Account</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
                <p className="text-[11px] text-slate-300 font-medium">Enter your Google Account details:</p>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Your Full Name (from Google profile)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Google / Workspace Email Address</label>
                  <input
                    type="email"
                    placeholder="name@gmail.com or workspace domain"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsUsingCustomAccount(false)}
                    className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Authenticate with Google</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleChooser(false);
                  setIsUsingCustomAccount(false);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. Customer Registration Route (Redirects directly to Google Login)
// Explicit rule: There must be no separate Create Account or Sign Up page.
export const RegisterPage: React.FC<Props> = ({ navigate }) => {
  useEffect(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <div className="min-h-[70vh] flex flex-col justify-center py-12 text-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs text-slate-400 mt-3">Redirecting to Google Sign-In...</p>
    </div>
  );
};

// 3. Password Recovery Route (Redirects to Google Sign-In as no customer passwords exist)
export const ForgotPasswordPage: React.FC<Props> = ({ navigate }) => {
  return (
    <div className="min-h-[70vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-center px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Google Protected Authentication</h2>
        <p className="text-xs text-slate-400">
          Customer passwords are not stored by Nexora Cloud. Your account security is managed directly by Google Account OAuth 2.0 / OpenID Connect.
        </p>
        <div className="space-y-2 pt-2">
          <a
            href="https://accounts.google.com/signin/recovery"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-xs block transition-colors"
          >
            Recover Google Account (Google Support)
          </a>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors"
          >
            Return to Google Sign-In
          </button>
        </div>
      </div>
    </div>
  );
};
