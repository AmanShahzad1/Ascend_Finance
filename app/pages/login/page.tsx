'use client';
//Test
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiLogIn, FiMail, FiLock, FiHome, FiEye, FiEyeOff } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/pages/home');
    }
  }, [isAuthenticated, router]);

  // Check for verification success message
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      toast.success('Email verified successfully! You can now log in.');
    }
  }, []);

  useEffect(() => {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.focus();
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowVerificationPrompt(false); // Reset prompt on new attempt

    try {
      const result = await login(email, password, rememberMe);
      if (result && result.success) {
        toast.success('Logged in successfully!');
        router.push('/pages/home');
      } else {
        const errorMessage = result?.message || 'Invalid email or password';
        
        // Check if the error is about unverified email
        if (errorMessage.includes('Please verify your email')) {
          setError('Please verify your email first');
          setShowVerificationPrompt(true);
        } else {
          setError(errorMessage);
        }
        toast.error(errorMessage);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Login error details:', err);
      const errorMessage = err.message || 'Invalid email or password';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-black flex flex-col justify-center py-4 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23fbbf24%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-amber-200 bg-white/10 backdrop-blur-sm border border-amber-200/20 rounded-lg hover:bg-white/20 hover:text-amber-100 transition-all duration-200"
        >
          <FiHome className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Back to Home</span>
          <span className="sm:hidden">Home</span>
        </Link>
      </div>
      
      <div className="w-full max-w-md mx-auto text-center relative z-10">
        <div className="animate-fade-in">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 mb-2 tracking-tight drop-shadow-lg leading-tight">
            <span className="font-light">Ascen</span><span className="font-bold">D</span> <span className="font-light">Finance</span>
          </h1>
          <p className="text-xs xs:text-sm sm:text-base text-amber-200 mb-4 sm:mb-6">
            Master your money. Liberate your life.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm py-4 xs:py-6 sm:py-8 px-3 xs:px-4 sm:px-6 md:px-10 shadow-xl rounded-xl sm:rounded-2xl border border-amber-200/30 transition-all duration-300 hover:shadow-amber-300/25">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          <form className="space-y-3 xs:space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-4 w-4 xs:h-5 xs:w-5 text-emerald-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 xs:pl-10 pr-3 py-2.5 xs:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 placeholder-gray-400 ios-input-fix"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-4 w-4 xs:h-5 xs:w-5 text-emerald-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 xs:pl-10 pr-9 xs:pr-10 py-2.5 xs:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 placeholder-gray-400 ios-input-fix"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer ios-touch-optimize"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-4 w-4 xs:h-5 xs:w-5" />
                  ) : (
                    <FiEye className="h-4 w-4 xs:h-5 xs:w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded ios-touch-optimize"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs xs:text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-xs xs:text-sm">
                <Link
                  href="/pages/forgot-password"
                  className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors duration-200 ios-touch-optimize"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center items-center py-3 xs:py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ios-touch-optimize ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 xs:h-5 xs:w-5 border-2 border-emerald-200 border-t-transparent"></div>
                  ) : (
                    <FiLogIn className="h-4 w-4 xs:h-5 xs:w-5 text-emerald-200 group-hover:text-emerald-100 transition-colors" />
                  )}
                </span>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {showVerificationPrompt && (
            <div className="mt-3 xs:mt-4 p-3 xs:p-4 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 xs:h-5 xs:w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.491 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2 xs:ml-3">
                  <h3 className="text-xs xs:text-sm font-medium text-amber-800">
                    Email verification required
                  </h3>
                  <div className="mt-1 xs:mt-2 text-xs xs:text-sm text-amber-700">
                    <p>Please verify your email address to continue.</p>
                  </div>
                  <div className="mt-2 xs:mt-3">
                    <button
                      onClick={() => router.push(`/pages/verify-otp?email=${encodeURIComponent(email)}`)}
                      className="bg-amber-100 px-2 xs:px-3 py-1 rounded-md text-xs xs:text-sm font-medium text-amber-800 hover:bg-amber-200 transition-colors ios-touch-optimize"
                    >
                      Verify Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 xs:mt-6">
            <div className="flex justify-center">
              <span className="text-xs xs:text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  href="/pages/register"
                  className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors duration-200 ios-touch-optimize"
                >
                  Sign up
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}