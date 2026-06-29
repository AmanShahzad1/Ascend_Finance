'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/pages/home');
    }
  }, [isAuthenticated, router]);

  // Auto-focus the get started button when component mounts
  useEffect(() => {
    const getStartedButton = document.getElementById('get-started-button');
    if (getStartedButton) {
      getStartedButton.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      router.push('/pages/register');
    }
  };

  return (
    <>
      <Head>
        <title>AscenD Finance - Master your money. Liberate your life.</title>
        <meta name="description" content="The best personal finance management app. Track expenses, manage money wisely, and achieve financial freedom." />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-black flex flex-col items-center justify-center p-4 pt-16 md:pt-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10 px-4 sm:px-6 lg:px-8">
          {/* Logo/App Name */}
          <div className="mb-6 sm:mb-8 md:mb-12">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 mb-3 sm:mb-4 md:mb-6 tracking-tight drop-shadow-2xl leading-tight">
              <span className="font-light">Ascen</span><span className="font-bold">D</span> <span className="font-light">Finance</span> <span className="text-xs align-super text-amber-400">STAGING</span>
            </h1>
            <div className="w-20 xs:w-24 sm:w-32 h-1 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 mx-auto rounded-full shadow-lg"></div>
          </div>

          {/* Tagline */}
          <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl text-amber-50 mb-4 sm:mb-6 md:mb-8 max-w-4xl mx-auto font-light tracking-wide leading-tight px-2">
            Master your money. <span className="text-amber-200 font-semibold">Liberate your life.</span>
          </p>

          {/* Subtitle */}
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-emerald-100 mb-8 sm:mb-12 md:mb-16 max-w-5xl mx-auto leading-relaxed font-light px-2">
            The world&apos;s most intelligent personal finance management platform. 
            Transform your relationship with money through our revolutionary four-category system 
            and AI-powered insights.
          </p>

          {/* Four Category Circles - Professional Hollow Design */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12 md:mb-16">
            <div className="group flex flex-col items-center">
              <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-2 xs:border-3 md:border-4 border-yellow-500 bg-transparent shadow-2xl hover:shadow-yellow-500/25 transition-all duration-500 transform group-hover:scale-110 group-hover:-translate-y-2 flex items-center justify-center">
                <div className="w-10 h-10 xs:w-14 xs:h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 rounded-full border-2 border-yellow-300 bg-transparent"></div>
              </div>
              <div className="mt-3 xs:mt-4 md:mt-6 text-center">
                <h3 className="font-bold text-amber-200 text-xs xs:text-sm sm:text-base md:text-xl mb-1 md:mb-2">Necessity</h3>
                <p className="text-emerald-200 text-xs sm:text-sm font-medium">Essential expenses</p>
              </div>
            </div>
            <div className="group flex flex-col items-center">
              <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-2 xs:border-3 md:border-4 border-green-500 bg-transparent shadow-2xl hover:shadow-green-500/25 transition-all duration-500 transform group-hover:scale-110 group-hover:-translate-y-2 flex items-center justify-center">
                <div className="w-10 h-10 xs:w-14 xs:h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 rounded-full border-2 border-green-300 bg-transparent"></div>
              </div>
              <div className="mt-3 xs:mt-4 md:mt-6 text-center">
                <h3 className="font-bold text-amber-200 text-xs xs:text-sm sm:text-base md:text-xl mb-1 md:mb-2">Investment</h3>
                <p className="text-emerald-200 text-xs sm:text-sm font-medium">Value-adding expenses</p>
              </div>
            </div>
            <div className="group flex flex-col items-center">
              <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-2 xs:border-3 md:border-4 border-red-500 bg-transparent shadow-2xl hover:shadow-red-500/25 transition-all duration-500 transform group-hover:scale-110 group-hover:-translate-y-2 flex items-center justify-center">
                <div className="w-10 h-10 xs:w-14 xs:h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 rounded-full border-2 border-red-300 bg-transparent"></div>
              </div>
              <div className="mt-3 xs:mt-4 md:mt-6 text-center">
                <h3 className="font-bold text-amber-200 text-xs xs:text-sm sm:text-base md:text-xl mb-1 md:mb-2">Status</h3>
                <p className="text-emerald-200 text-xs sm:text-sm font-medium">Luxury & indulgence</p>
              </div>
            </div>
            <div className="group flex flex-col items-center">
              <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-2 xs:border-3 md:border-4 border-blue-500 bg-transparent shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform group-hover:scale-110 group-hover:-translate-y-2 flex items-center justify-center">
                <div className="w-10 h-10 xs:w-14 xs:h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 rounded-full border-2 border-blue-300 bg-transparent"></div>
              </div>
              <div className="mt-3 xs:mt-4 md:mt-6 text-center">
                <h3 className="font-bold text-amber-200 text-xs xs:text-sm sm:text-base md:text-xl mb-1 md:mb-2">Savings</h3>
                <p className="text-emerald-200 text-xs sm:text-sm font-medium">Money set aside</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons - Professional Design */}
          <div className="flex flex-col sm:flex-row gap-3 xs:gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 md:mb-20 px-2 xs:px-4">
            <Link
              id="get-started-button"
              href="/pages/register"
              tabIndex={0}
              role="button"
              aria-label="Get Started with AscenD Finance"
              onKeyDown={handleKeyDown}
              onClick={() => router.push('/pages/register')}
              className="group relative inline-flex items-center justify-center px-6 xs:px-8 sm:px-10 md:px-12 py-3 xs:py-4 sm:py-5 text-base xs:text-lg sm:text-xl font-bold text-emerald-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 rounded-2xl shadow-2xl hover:shadow-amber-400/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 w-full sm:w-auto sm:min-w-[180px] xs:sm:min-w-[200px] md:min-w-[240px] overflow-hidden ios-touch-optimize"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
            <Link
              href="/pages/login"
              className="group relative inline-flex items-center justify-center px-6 xs:px-8 sm:px-10 md:px-12 py-3 xs:py-4 sm:py-5 text-base xs:text-lg sm:text-xl font-bold text-amber-200 bg-transparent border-2 border-amber-200 rounded-2xl shadow-xl hover:shadow-amber-200/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 w-full sm:w-auto sm:min-w-[180px] xs:sm:min-w-[200px] md:min-w-[240px] backdrop-blur-sm hover:bg-amber-200/10 ios-touch-optimize"
            >
              <span className="relative z-10">Sign In</span>
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}