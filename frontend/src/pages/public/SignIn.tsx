import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import { Mail, Lock, Eye, EyeOff, X, ArrowRight, Shield, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useShopContext } from '../../store/ShopContext';
import { devLog } from '../../utils/devLogger';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-green-400' };
  return { score, label: 'Excellent', color: 'bg-emerald-400' };
}

export default function UserSignInPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const { setAlertConfig, setUsername, setUserEmail, setUserImage } = useShopContext();

  const emailRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setAlertConfig({ isOpen: false, type: 'info', title: '', message: '', onConfirm: undefined });
    const timer = setTimeout(() => {
      emailRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [setAlertConfig]);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState({ email: false, password: false });
  const [shake, setShake] = React.useState(false);
  const [emailSuggestions, setEmailSuggestions] = React.useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = React.useState(false);

  const passwordStrength = React.useMemo(() => getPasswordStrength(password), [password]);

  const emailDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com', '@icloud.com'];

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError('');

    if (value && !value.includes('@')) {
      setEmailSuggestions(emailDomains.map(domain => value + domain));
      setShowEmailSuggestions(true);
    } else if (value && value.includes('@')) {
      const [local, partial] = value.split('@');
      const filtered = emailDomains
        .filter(domain => domain.slice(1).startsWith(partial || ''))
        .map(domain => local + domain);
      setEmailSuggestions(filtered);
      setShowEmailSuggestions(filtered.length > 0 && partial !== emailDomains.find(d => d.slice(1) === partial)?.slice(1));
    } else {
      setShowEmailSuggestions(false);
    }
  };

  const acceptEmailSuggestion = (suggestion: string) => {
    setEmail(suggestion);
    setShowEmailSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (rememberMe) {
      localStorage.setItem('juwel_email', email);
    } else {
      localStorage.removeItem('juwel_email');
    }

    try {
      const result = await login(email, password);

      if (!result.success) {
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setError(result.error || 'Sign in failed');
        setAlertConfig({
          isOpen: true,
          type: 'error',
          title: 'Sign In Failed',
          message: result.error || 'Sign in failed',
        });
      } else {
        try {
          const userRes = await api.get(`/auth/user?email=${email}`);
          const userData = userRes.data;
          if (userData.success && userData.data) {
            setUsername(userData.data.name);
            setUserEmail(userData.data.email);
            setUserImage(userData.data.image || '');
          }
        } catch (error) {
          devLog('Failed to fetch user data:', error);
        }

        navigate('/');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
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
        <div className={`relative w-full max-w-5xl bg-gray-900 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden border border-white/10 text-left lg:flex max-h-[90vh] lg:max-h-none ${shake ? 'animate-[shake_0.6s_ease-in-out]' : ''}`}>

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
                Sign in to access your premium account and continue your digital journey with us.
              </p>
            </div>

            <div className="relative z-10 mt-8 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Secure Authentication</p>
                  <p className="text-xs text-gray-500">End-to-end encrypted login</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <Zap className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Instant Access</p>
                  <p className="text-xs text-gray-500">No waiting, sign in & go</p>
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

          {/* Right Side - Sign In Form */}
          <div className="relative w-full lg:w-7/12 bg-gray-900/50 backdrop-blur-3xl p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 overflow-y-auto max-h-[90vh] lg:max-h-none">
            <button
              onClick={() => navigate('/')}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
            >
              <X className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            </button>

            <div className="max-w-md mx-auto w-full">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-6 sm:mb-8">
                <div className="flex flex-col items-center gap-2 text-center">
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

              <div className="text-center lg:text-left mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Sign In</h2>
                <p className="text-sm sm:text-base text-gray-400">Welcome back! Please enter your details.</p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-300">Authentication Error</p>
                    <p className="text-xs text-red-400/80 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="mb-5 flex justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    if (credentialResponse.credential) {
                      setIsGoogleLoading(true);
                      const result = await googleLogin(credentialResponse.credential);
                      if (result.success) {
                        try {
                          const userRes = await api.get(`/auth/user?email=${result.user?.email}`);
                          const userData = userRes.data;
                          if (userData.success && userData.data) {
                            setUsername(userData.data.name);
                            setUserEmail(userData.data.email);
                            setUserImage(userData.data.image || '');
                          }
                        } catch (error) {
                          devLog('Failed to fetch user data:', error);
                        }
                        navigate('/');
                      } else {
                        setError(result.error || 'Google sign-in failed');
                        setShake(true);
                        setTimeout(() => setShake(false), 600);
                        setAlertConfig({
                          isOpen: true,
                          type: 'error',
                          title: 'Sign In Failed',
                          message: result.error || 'Google sign-in failed',
                        });
                      }
                      setIsGoogleLoading(false);
                    }
                  }}
                  onError={() => {
                    setError('Google sign-in failed');
                    setShake(true);
                    setTimeout(() => setShake(false), 600);
                  }}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>

              <div className="relative flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">or sign in with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <div className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused.email ? 'text-purple-400' : 'text-gray-600'}`}>
                      <Mail className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      ref={emailRef}
                      type="email"
                      className="w-full bg-gray-800/50 border border-white/10 rounded-xl pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 focus:bg-gray-800/70 transition-all duration-200 text-sm sm:text-base"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onFocus={() => {
                        setIsFocused(prev => ({ ...prev, email: true }));
                        if (email && !email.includes('@')) {
                          setEmailSuggestions(emailDomains.map(domain => email + domain));
                          setShowEmailSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        setIsFocused(prev => ({ ...prev, email: false }));
                        setTimeout(() => setShowEmailSuggestions(false), 200);
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === 'Tab') && showEmailSuggestions && emailSuggestions.length > 0) {
                          e.preventDefault();
                          acceptEmailSuggestion(emailSuggestions[0]);
                        }
                      }}
                      required
                      autoComplete="email"
                    />
                    {email && !error && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="w-4 h-4 text-green-400/60" />
                      </div>
                    )}
                    {showEmailSuggestions && emailSuggestions.length > 0 && (
                      <div className="absolute z-50 mt-2 w-full rounded-xl overflow-hidden border border-purple-400/40 bg-gray-900/95 backdrop-blur-md shadow-2xl shadow-purple-500/20">
                        {emailSuggestions.map((suggestion, index) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => acceptEmailSuggestion(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-purple-500/20 transition-colors flex items-center gap-3"
                          >
                            <Mail className="w-4 h-4 text-purple-400" />
                            <span className="text-white text-sm">{suggestion}</span>
                            {index === 0 && (
                              <span className="ml-auto text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">Tab</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                    <div className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused.password ? 'text-purple-400' : 'text-gray-600'}`}>
                      <Lock className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-gray-800/50 border border-white/10 rounded-xl pl-10 sm:pl-11 pr-12 py-3 sm:py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 focus:bg-gray-800/70 transition-all duration-200 text-sm sm:text-base"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                      onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-purple-400 hover:text-purple-300" />
                      ) : (
                        <Eye className="w-5 h-5 text-purple-400 hover:text-purple-300" />
                      )}
                    </button>
                  </div>

                  {password.length > 0 && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= passwordStrength.score ? passwordStrength.color : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium transition-colors duration-200 ${
                        passwordStrength.score <= 1 ? 'text-red-400' :
                        passwordStrength.score <= 2 ? 'text-orange-400' :
                        passwordStrength.score <= 3 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <div className={`w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center group-hover:border-purple-500/50 peer-checked:bg-gradient-to-br peer-checked:from-purple-500 peer-checked:to-pink-500 peer-checked:border-transparent peer-checked:shadow-[0_0_10px_rgba(168,85,247,0.4)] ${
                        rememberMe ? 'border-purple-500' : 'border-white/20 bg-white/5'
                      }`}>
                        {rememberMe && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-purple-200/80 group-hover:text-purple-100 transition-colors">Remember me</span>
                  </label>
                  <button type="button" className="text-sm text-purple-400 hover:text-pink-400 transition-colors font-medium"
                    onClick={() => setAlertConfig({
                      isOpen: true,
                      type: 'info',
                      title: 'Forgot Password',
                      message: 'Please contact support to reset your password.',
                    })}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:from-purple-700 active:to-pink-700 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                      </>
                    )}
                  </div>
                  <div className="absolute inset-0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-400/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-purple-300/70">or</span>
                </div>
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-xl border border-purple-500/20">
                <p className="text-purple-200/80 text-sm">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/sign-up')}
                    className="text-transparent bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text hover:from-pink-300 hover:to-orange-300 font-bold transition-all inline-flex items-center gap-1 group text-sm sm:text-base"
                  >
                    Sign Up Now
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
