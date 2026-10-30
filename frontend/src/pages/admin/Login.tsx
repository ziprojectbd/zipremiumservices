import { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles, Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { googleLogin, login, isAuthenticated, isAdmin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAccessDeniedNotice, setShowAccessDeniedNotice] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if already authenticated as admin
    if (isAuthenticated && isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (showAccessDeniedNotice) {
      const timer = setTimeout(() => {
        setShowAccessDeniedNotice(false);
        navigate('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAccessDeniedNotice, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (!result.success) {
        setError('Invalid credentials. Please check your email and password.');
      } else if (result.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // Logout and show access denied
        navigate('/?error=admin_access_denied');
      }
    } catch {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.success && result.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (result.success) {
        navigate('/?error=admin_access_denied');
      } else {
        setError(result.error || 'Google sign-in failed. Please try again.');
      }
    } catch {
      setError('An error occurred during Google sign-in. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
      {/* Access Denied Notice */}
      {showAccessDeniedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md transform transition-all duration-500 animate-slideUp">
            <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl shadow-2xl border border-red-500/30 p-8 overflow-hidden">
              <div className="absolute inset-0 bg-red-500/10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-red-400 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-300 rounded-full filter blur-2xl opacity-30 animate-ping"></div>
              </div>
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6 animate-bounce">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 animate-pulse">Access Denied</h2>
                <p className="text-red-100 text-lg mb-6 leading-relaxed">
                  This admin area is restricted to authorized personnel only.
                </p>
                <div className="bg-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                  <p className="text-red-50 text-sm">
                    <span className="font-semibold">Notice:</span> You'll be redirected to the homepage in a few seconds.
                  </p>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-white rounded-full animate-progressBar"></div>
                </div>
                <button
                  onClick={() => {
                    setShowAccessDeniedNotice(false);
                    navigate('/');
                  }}
                  className="mt-6 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/30"
                >
                  Go to Homepage Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{backgroundImage: 'radial-gradient(circle farthest-corner at 17.6% 50.7%, rgba(25,0,184,1) 0%, rgba(0,0,0,1) 90%)'}}>
        {/* Enhanced Background with animated gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-16"></div>
          <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-32 left-40 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-4 h-4 bg-cyan-400 rounded-full animate-ping"></div>
        </div>

        <div className={`relative w-full max-w-md transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Enhanced Login Card with glassmorphism */}
          <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>

            {/* Enhanced Logo/Header */}
            <div className="text-center mb-8 relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/25 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Crown className="w-10 h-10 text-white relative z-10" />
                <Sparkles className="absolute top-1 right-1 w-4 h-4 text-yellow-300 animate-pulse" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
                Admin Portal
              </h1>
              <p className="text-gray-400 text-sm">Secure access to premium dashboard</p>
              <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">System Online</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm animate-shake">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <p className="text-red-300 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20"
                    placeholder="admin@zipremium.com"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <Zap className="h-4 w-4 text-blue-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-14 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20"
                    placeholder="Enter your password"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-400 transition-colors group"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    ) : (
                      <Eye className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-2"
                  />
                  <label htmlFor="remember-me" className="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors hover:underline flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                {isLoading ? (
                  <div className="flex items-center gap-3 relative z-10">
                    <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 relative z-10">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Sign In</span>
                    <Zap className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            {isGoogleLoading ? (
              <div className="group relative w-full flex justify-center items-center gap-3 py-4 px-6 border border-white/20 rounded-xl shadow-lg text-sm font-semibold text-white bg-white/5">
                <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting to Google...</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                size="large"
                width="100%"
                theme="filled_black"
                text="signin_with"
                shape="pill"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
