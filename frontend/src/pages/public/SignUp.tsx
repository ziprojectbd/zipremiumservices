import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { X, Shield, User, ArrowRight, Star, Sparkles, Zap, BadgeCheck } from 'lucide-react';
import { useShopContext } from '../../store/ShopContext';
import GoogleAuthButton from '../../components/public/GoogleAuthButton';

export default function UserSignUpPage() {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();
  const { setAlertConfig } = useShopContext();

  React.useEffect(() => {
    setAlertConfig({ isOpen: false, type: 'info', title: '', message: '', onConfirm: undefined });
  }, [setAlertConfig]);

  const [error, setError] = React.useState('');
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [shake, setShake] = React.useState(false);

  const fail = React.useCallback(
    (message?: string) => {
      const text = message || 'Sign up failed. Please try again.';
      setError(text);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Sign Up Failed',
        message: text,
      });
    },
    [setAlertConfig]
  );

  // The Google endpoint creates the account on first use, so sign-up and
  // sign-in share this single handler.
  const handleGoogleSignUp = async (credential: string) => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const result = await googleLogin(credential);
      if (!result.success) {
        fail(result.error || 'Google sign-up failed');
        return;
      }
      navigate('/');
    } catch {
      fail('An unexpected error occurred. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-br-full"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-pink-400/20 to-transparent rounded-tl-full"></div>
      </div>

      {/* Main Content */}
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                  <img src="/zi-logo.svg" alt="ZI Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h1 className="text-base sm:text-xl xl:text-2xl font-extrabold leading-tight whitespace-nowrap">
                  <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 bg-clip-text text-transparent drop-shadow-sm cinzel-decorative-black">
                    ZI PREMIUM SERVICES
                  </span>
                </h1>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Start your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Premium</span> Journey.
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
                One Google tap creates your account — no forms, no passwords, nothing to remember.
              </p>
            </div>

            <div className="relative z-10 mt-12 lg:mt-0 space-y-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0F0F1A] bg-gray-700 flex items-center justify-center overflow-hidden">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-[#0F0F1A] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">+2k</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="flex text-yellow-500"><Star className="w-4 h-4 fill-yellow-500" /></div>
                <span className="font-medium">Trusted by top developers</span>
              </div>
            </div>
          </div>

          {/* Right Side - Google Sign Up */}
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
                <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <img src="/zi-logo.svg" alt="ZI Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
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
                  <span className="text-xs font-semibold text-purple-300 tracking-wide">Google-Only Sign Up</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2.5">Create an Account</h2>
                <p className="text-sm sm:text-base text-gray-400 max-w-sm mx-auto">
                  Join <span className="cinzel-decorative-bold">ZI PREMIUM SERVICES</span> with one Google tap. No password required.
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
                  <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-300">Sign Up Error</p>
                    <p className="text-xs text-red-400/80 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <GoogleAuthButton
                onSuccess={handleGoogleSignUp}
                onError={fail}
                text="signup_with"
                loading={isGoogleLoading}
                label="We only receive your name, email and profile photo"
              />

              {/* What you get */}
              <div className="mt-8 space-y-2.5">
                {[
                  { icon: Zap, title: 'Instant setup', sub: 'Account ready in seconds' },
                  { icon: BadgeCheck, title: 'Secure by default', sub: 'No password to leak or forget' },
                  { icon: Star, title: 'Full marketplace access', sub: 'Order, track and manage everything' },
                ].map(({ icon: Icon, title, sub }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3.5 py-3"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/15 flex-shrink-0">
                      <Icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{title}</p>
                      <p className="text-xs text-gray-500 leading-tight mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-[11px] text-gray-500 text-center leading-relaxed">
                By continuing you agree to our{' '}
                <span className="text-purple-400/90 font-medium">Terms of Service</span> and{' '}
                <span className="text-purple-400/90 font-medium">Privacy Policy</span>.
              </p>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/sign-in')}
                    className="text-transparent bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text hover:from-pink-300 hover:to-orange-300 font-bold transition-all inline-flex items-center gap-1 group text-sm sm:text-base"
                  >
                    Sign In
                    <ArrowRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
