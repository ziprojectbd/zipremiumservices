import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { X, Shield, Zap, Users, Sparkles, Lock, Mail, Eye, EyeOff, ChevronDown, HelpCircle } from 'lucide-react';
import { useShopContext } from '../../store/ShopContext';
import GoogleAuthButton from '../../components/public/GoogleAuthButton';

export default function UserSignInPage() {
  const navigate = useNavigate();
  const { googleLogin, login } = useAuth();
  const { setAlertConfig } = useShopContext();

  React.useEffect(() => {
    setAlertConfig({ isOpen: false, type: 'info', title: '', message: '', onConfirm: undefined });
  }, [setAlertConfig]);

  const [error, setError] = React.useState('');
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [shake, setShake] = React.useState(false);

  // Email/password stays behind a collapsed toggle. Accounts registered before
  // the Google-only switch would otherwise have no way to sign in.
  const [showEmailForm, setShowEmailForm] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isEmailLoading, setIsEmailLoading] = React.useState(false);

  const fail = React.useCallback(
    (message?: string) => {
      const text = message || 'Sign in failed. Please try again.';
      setError(text);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Sign In Failed',
        message: text,
      });
    },
    [setAlertConfig]
  );

  // A brand-new Google account is created on first sign-in, so this single
  // handler serves both "sign in" and "sign up" for new users.
  const handleGoogleSuccess = async (credential: string) => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const result = await googleLogin(credential);
      if (!result.success) {
        fail(result.error || 'Google sign-in failed');
        return;
      }
      // ShopContext syncs username/email/image from AuthContext, so no extra
      // /auth/user round-trip is needed here.
      navigate('/');
    } catch {
      fail('An unexpected error occurred. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      fail('Enter your email and password.');
      return;
    }
    setIsEmailLoading(true);
    setError('');
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        fail(result.error || 'Invalid email or password');
        return;
      }
      navigate('/');
    } catch {
      fail('An unexpected error occurred. Please try again.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '3s' }}></div>

        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400/60 rounded-full animate-[float_3s_ease-in-out_infinite]"></div>
          <div className="absolute top-20 right-16 w-3 h-3 bg-purple-400/60 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
          <div className="absolute bottom-24 left-1/4 w-2 h-2 bg-pink-400/60 rounded-full animate-[float_3s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-16 right-1/3 w-2 h-2 bg-yellow-400/60 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
        </div>

        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-br-full"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-pink-400/20 to-transparent rounded-tl-full"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-3 sm:p-4 lg:p-6">
        <div className={`relative w-full max-w-5xl bg-gray-900 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden border border-white/10 text-left lg:flex lg:min-h-[620px] ${shake ? 'animate-[shake_0.6s_ease-in-out]' : ''}`}>

          {/* Left Side - Visuals & Branding (Desktop Only) */}
          <div className="hidden lg:flex lg:w-5/12 p-8 xl:p-12 flex-col justify-between overflow-hidden bg-[#0F0F1A] relative">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-pink-600/20"></div>
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-700"></div>
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full animate-[spin_10s_linear_infinite]">
                <div className="absolute top-0 left-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse]">
                <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-pink-400 rounded-full shadow-[0_0_15px_rgba(244,114,182,0.8)]"></div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                  <img src="/zi-logo.svg" alt="ZI Logo" className="w-8 h-8" />
                </div>
                <h1 className="text-base sm:text-xl xl:text-2xl font-extrabold leading-tight whitespace-nowrap">
                  <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 bg-clip-text text-transparent drop-shadow-sm cinzel-decorative-black">
                    ZI PREMIUM SERVICES
                  </span>
                </h1>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Back</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
                One tap with Google and you're in — no passwords to remember, ever.
              </p>
            </div>

            <div className="relative z-10 mt-8 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Lock className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Password-Free Login</p>
                  <p className="text-xs text-gray-500">Google handles the credentials</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <Zap className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Instant Access</p>
                  <p className="text-xs text-gray-500">New here? Account is created automatically</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0F0F1A] bg-gray-700 flex items-center justify-center overflow-hidden">
                  <span className="text-xs text-gray-500">{String.fromCharCode(64 + i)}</span>
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-[#0F0F1A] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">+2k</span>
              </div>
            </div>
          </div>

          {/* Right Side - Google Sign In */}
          <div className="relative w-full lg:w-7/12 bg-gray-900/50 backdrop-blur-3xl p-5 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center">
            <button
              onClick={() => navigate('/')}
              aria-label="Close"
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
            >
              <X className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            </button>

            <div className="max-w-md mx-auto w-full">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-8">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <img src="/zi-logo.svg" alt="ZI Logo" className="w-8 h-8" />
                  </div>
                  <h1 className="text-sm sm:text-lg md:text-xl font-extrabold leading-tight whitespace-nowrap">
                    <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 bg-clip-text text-transparent drop-shadow-sm cinzel-decorative-black">
                      ZI PREMIUM SERVICES
                    </span>
                  </h1>
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300 tracking-wide">Google-Only Sign In</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2.5">Sign In</h2>
                <p className="text-sm sm:text-base text-gray-400 max-w-sm mx-auto">
                  Continue with your Google account. Sign in and sign up are the same one-tap step.
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
                  <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-300">Authentication Error</p>
                    <p className="text-xs text-red-400/80 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                onError={fail}
                text="continue_with"
                loading={isGoogleLoading}
                label="We only receive your name, email and profile photo"
              />

              {/* Trust row */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { icon: Shield, label: 'No password', sub: 'Ever stored' },
                  { icon: Zap, label: '1 tap', sub: 'Instant access' },
                  { icon: Users, label: 'Trusted', sub: '2k+ users' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-3 text-center"
                  >
                    <Icon className="w-4 h-4 text-purple-400 mx-auto mb-1.5" />
                    <p className="text-[11px] font-semibold text-white leading-tight">{label}</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center p-4 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-xl border border-purple-500/20">
                <p className="text-purple-200/80 text-sm">
                  New to{' '}
                  <span className="font-semibold text-purple-200">ZI Premium Services</span>? Just
                  tap above — your account is created automatically.
                </p>
                <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
                  By continuing you agree to our{' '}
                  <Link
                    to="/terms-of-service"
                    className="text-purple-400/90 font-medium hover:text-purple-300 underline underline-offset-2 transition-colors"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy-policy"
                    className="text-purple-400/90 font-medium hover:text-purple-300 underline underline-offset-2 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              {/* Existing email/password accounts. Collapsed by default so the
                  Google flow stays the primary path. */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm((v) => !v);
                    setError('');
                  }}
                  aria-expanded={showEmailForm}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors py-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {showEmailForm ? 'Hide email sign in' : 'Sign in with email instead'}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${showEmailForm ? 'rotate-180' : ''}`}
                  />
                </button>

                {showEmailForm && (
                  <form
                    onSubmit={handleEmailSubmit}
                    className="mt-3 space-y-3 animate-[fade-in_0.25s_ease-out]"
                  >
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-white/10 bg-gray-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full rounded-xl border border-white/10 bg-gray-800/50 pl-10 pr-11 py-3 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isEmailLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold py-3 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEmailLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </button>

                    <p className="flex items-start gap-1.5 text-[11px] text-gray-500 leading-relaxed pt-0.5">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-[1px] text-gray-600" />
                      <span>
                        Old account on a different email?{' '}
                        <Link
                          to="/contact-us"
                          className="text-purple-400/90 font-medium hover:text-purple-300 transition-colors"
                        >
                          Contact support
                        </Link>{' '}
                        and we'll help you get back in.
                      </span>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
