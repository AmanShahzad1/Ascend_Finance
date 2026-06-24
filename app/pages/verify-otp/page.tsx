'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

function VerifyOTPContent() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { verifyOTP, resendOTP, login } = useAuth();

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.push('/pages/register');
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await verifyOTP(email!, otp);
      
      if (result.success) {
        toast.success('Email verified successfully!');
        // Automatically log in the user after successful verification
        // We need to get the password from somewhere or create a new login flow
        // For now, redirect to login page with a success message
        router.push('/pages/login?verified=true');
      } else {
        toast.error(result.message);
      }
       // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setIsResending(true);
    
    try {
      const result = await resendOTP(email!);
      
      if (result.success) {
        toast.success('New verification code sent!');
        setTimeLeft(60);
        setCanResend(false);
        setOtp('');
      } else {
        toast.error(result.message);
      }
       // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email) {
    return null;
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
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-sm text-gray-600 mb-4">
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-sm font-medium text-emerald-600">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-xl sm:text-2xl font-mono tracking-widest text-gray-900"
                placeholder="000000"
                disabled={isLoading}
                autoComplete="off"
                autoFocus
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 cursor-pointer ${
                  isLoading || otp.length !== 6 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-emerald-200 border-t-transparent mr-2"></div>
                )}
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <div className="text-sm text-gray-600 mb-3 sm:mb-4">
              {timeLeft > 0 ? (
                <span className="text-amber-600 font-medium">
                  Code expires in {formatTime(timeLeft)}
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  Code has expired
                </span>
              )}
            </div>
            
            <button
              onClick={handleResendOTP}
              disabled={!canResend || isResending}
              className={`text-sm font-medium transition-colors duration-200 flex items-center justify-center ${
                canResend && !isResending
                  ? 'text-emerald-600 hover:text-emerald-500 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              {isResending && (
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-emerald-200 border-t-transparent mr-2"></div>
              )}
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <div className="mt-6">
            <div className="flex justify-center">
              <span className="text-sm text-gray-600">
                Wrong email?{' '}
                <button
                  onClick={() => router.push('/pages/register')}
                  className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors duration-200"
                >
                  Go back
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
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
      <VerifyOTPContent />
    </Suspense>
  );
}
