'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

function ResetPasswordContent() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { resetPassword, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/pages/home');
    }
  }, [isAuthenticated, router]);

  // Get email and verified status from URL params
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const verified = searchParams.get('verified');
    
    if (emailParam && verified === 'true') {
      setEmail(emailParam);
    } else {
      router.push('/pages/forgot-password');
    }
  }, [searchParams, router]);

  useEffect(() => {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      valid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      toast.error(passwordValidation.message);
      setIsLoading(false);
      return;
    }

    try {
      // Since OTP is already verified, we pass 'verified' to indicate this
      const result = await resetPassword(email, 'verified', formData.password);
      if (result && result.success) {
        toast.success('Password reset successfully! You can now log in with your new password.');
        router.push('/pages/login?reset=success');
      } else {
        const errorMessage = result?.message || 'Failed to reset password';
        setError(errorMessage);
        toast.error(errorMessage);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Reset password error details:', err);
      const errorMessage = err.message || 'Failed to reset password';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300 mx-auto"></div>
          <p className="text-amber-200 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-black flex flex-col justify-center py-4 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23fbbf24%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <div className="w-full max-w-md mx-auto text-center relative z-10">
        <div className="animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 mb-2 tracking-tight drop-shadow-lg">
            <span className="font-light">Ascen</span><span className="font-bold">D</span> <span className="font-light">Finance</span>
          </h1>
          <p className="text-sm sm:text-base text-amber-200 mb-6">
            Master your money. Liberate your life.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm py-6 sm:py-8 px-4 sm:px-6 md:px-10 shadow-xl rounded-xl sm:rounded-2xl border border-amber-200/30 transition-all duration-300 hover:shadow-amber-300/25">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
              <FiLock className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <div className="mt-2 p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-200 mb-4">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Code verified successfully! Now set your new password.
              </div>
            </div>
            <p className="text-gray-600 mt-2">
              Create a new password for <strong>{email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-200 border-t-transparent"></div>
                ) : (
                  <FiCheck className="h-5 w-5 text-emerald-200 group-hover:text-emerald-100 transition-colors" />
                )}
              </span>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6">
            <div className="flex justify-center">
              <Link
                href="/pages/login"
                className="flex items-center text-sm text-emerald-600 hover:text-emerald-500 transition-colors duration-200"
              >
                <FiArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-black flex flex-col justify-center py-4 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="w-full max-w-md mx-auto text-center relative z-10">
          <div className="bg-white/90 backdrop-blur-sm py-6 sm:py-8 px-4 sm:px-6 md:px-10 shadow-xl rounded-xl sm:rounded-2xl border border-amber-200/30">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
