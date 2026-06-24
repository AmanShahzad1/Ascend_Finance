'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiLock, FiHome, FiEye, FiEyeOff } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/pages/home');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const firstNameInput = document.getElementById('firstName');
    if (firstNameInput) {
      firstNameInput.focus();
    }
  }, []);

  // Validation functions
  const validateName = (name: string) => {
    return /^[a-zA-Z\s]+$/.test(name);
  };

  const validateForm = () => {
    if (!validateName(formData.firstName)) {
      setError('First name must contain only alphabets');
      return false;
    }
    if (!validateName(formData.lastName)) {
      setError('Last name must contain only alphabets');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate form before submission
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await register(formData);
      if (result && result.success) {
        toast.success('Account created! Please check your email for verification code.');
        router.push(`/pages/verify-otp?email=${encodeURIComponent(formData.email)}`);
      } else {
        const errorMessage = result?.message || 'Registration failed';
        setError(errorMessage);
        toast.error(errorMessage);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Registration error details:', err);
      const errorMessage = err.message || 'Registration failed';
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
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-4 w-4 xs:h-5 xs:w-5 text-emerald-500" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="block w-full pl-9 xs:pl-10 pr-3 py-2.5 xs:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 placeholder-gray-400 ios-input-fix"
                    placeholder="John"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-4 w-4 xs:h-5 xs:w-5 text-emerald-500" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="block w-full pl-9 xs:pl-10 pr-3 py-2.5 xs:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 placeholder-gray-400 ios-input-fix"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-4 w-4 xs:h-5 xs:w-5 text-emerald-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="block w-full pl-9 xs:pl-10 pr-3 py-2.5 xs:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 placeholder-gray-400 ios-input-fix"
                  placeholder="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-4 w-4 xs:h-5 xs:w-5 text-emerald-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-9 xs:pl-10 pr-3 py-2.5 xs:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 placeholder-gray-400 ios-input-fix"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-4 w-4 xs:h-5 xs:w-5 text-emerald-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-9 xs:pl-10 pr-9 xs:pr-10 py-2.5 xs:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 placeholder-gray-400 ios-input-fix"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer ios-touch-optimize"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-4 w-4 xs:h-5 xs:w-5 text-emerald-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="block w-full pl-9 xs:pl-10 pr-9 xs:pr-10 py-2.5 xs:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 placeholder-gray-400 ios-input-fix"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer ios-touch-optimize"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
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
                {isLoading && (
                  <div className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <div className="animate-spin rounded-full h-4 w-4 xs:h-5 xs:w-5 border-2 border-emerald-200 border-t-transparent"></div>
                  </div>
                )}
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-4 xs:mt-6">
            <div className="text-center mb-3 xs:mb-4">
              <p className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </p>
            </div>
            <div className="flex justify-center">
              <span className="text-xs xs:text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/pages/login"
                  className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors duration-200 ios-touch-optimize"
                >
                  Sign in
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}