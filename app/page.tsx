'use client';

import { useState } from 'react';

// A simple, responsive header component with navigation.
// This component has been moved here to fix the import error.
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-80 backdrop-filter backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo or Site Title */}
        <div className="flex-shrink-0">
          <a href="/" className="text-2xl font-bold text-gray-900 transition-colors duration-300 hover:text-indigo-600">
            CAS Prep
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300">
            Features
          </a>
          <a href="#pricing" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300">
            Pricing
          </a>
          <a href="/dashboard" className="px-5 py-2 rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 shadow-md">
            Sign In
          </a>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 hover:text-indigo-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-16 6h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white bg-opacity-90 backdrop-filter backdrop-blur-md">
          <nav className="flex flex-col items-center py-4 space-y-4">
            <a href="#features" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>
              Features
            </a>
            <a href="#pricing" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>
              Pricing
            </a>
            <a href="/dashboard" className="w-full px-5 py-2 text-center rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 shadow-md" onClick={() => setIsMenuOpen(false)}>
              Sign In
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

// Define a simple, custom hook for handling scroll-based animations if needed
const useAnimateOnScroll = () => {
  // A simple placeholder for animation logic. In a real app, you would use
  // a library like 'Framer Motion' or the 'Intersection Observer API'.
  // For this self-contained example, we'll just apply classes directly.
};

const HomePage = () => {
  useAnimateOnScroll();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* This is the main container for the homepage.
        It has a light gray background and hides any overflow.
      */}

      {/* Add the Header component here */}
      <Header />

      {/* Hero Section - The First Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-24 min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        {/* Animated background gradient */}
        <div className="absolute inset-0 z-0 opacity-40 animate-gradient-slow-pulse">
          <div className="w-full h-full bg-gradient-to-br from-purple-200 via-indigo-200 to-sky-200 animate-pulse-bg"></div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight animate-fade-in-up">
            Master Your CAS Exam with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Simulated Role-Play</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 animate-fade-in-up delay-200">
            Practice for the CAS exam with realistic role-play scenarios, instant feedback, and a structured mock test environment.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up delay-400">
            <a href="/dashboard" className="w-full sm:w-auto px-8 py-3 rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-transform transform hover:scale-105 shadow-lg">
              Start Practicing Today
            </a>
            <a href="#features" className="w-full sm:w-auto px-8 py-3 rounded-full font-semibold text-indigo-600 bg-white border border-indigo-200 hover:bg-gray-100 transition-transform transform hover:scale-105 shadow-md">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* What We Offer Section - The Second Section */}
      <section id="features" className="py-20 px-4 bg-gray-50 text-gray-900">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl font-bold">What We Offer</h2>
          <p className="mt-4 text-lg">
            Our platform is designed to give you the most comprehensive and effective preparation for your exam.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Practice Mode Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-2xl hover:border-indigo-400 border border-transparent animate-fade-in-down">
              <div className="flex justify-center items-center h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M16.2 16.2a10 10 0 1 0-1.8 1.8" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold">Practice Mode</h3>
              <p className="mt-4">
                Unlimited practice sessions with a wide range of simulated scenarios. Get instant, detailed feedback on your performance to improve your skills.
              </p>
            </div>
            {/* Live Mode (Mock Exam) Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-2xl hover:border-purple-400 border border-transparent animate-fade-in-down delay-200">
              <div className="flex justify-center items-center h-16 w-16 bg-purple-100 text-purple-600 rounded-full mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M16.2 16.2a10 10 0 1 0-1.8 1.8" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold">Live Mode (Mock Exam)</h3>
              <p className="mt-4">
                Experience a full-length, 12-station mock exam. Our AI-powered scoring provides an objective assessment of your performance in a timed environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Timings Section - The Third Section */}
      <section className="py-20 px-4 bg-gray-100 text-gray-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold">Exam Structure Breakdown</h2>
          <p className="mt-4 text-lg">
            Prepare for the exact timing and format of the CAS exam with our detailed simulation.
          </p>
          <div className="mt-12">
            <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in-up">
              <h3 className="text-2xl font-bold mb-6">Morning Circuit</h3>
              <ul className="text-left space-y-3">
                <li className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="12" x2="12" y2="16" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                  <span>11 mins 10 secs per station</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span>8 stations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="12" x2="12" y2="16" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                  <span>Total Circuit Time: 89 mins 10 secs</span>
                </li>
              </ul>
              <div className="h-px bg-gray-200 my-8"></div>
              <h3 className="text-2xl font-bold mb-6">Afternoon Circuit</h3>
              <ul className="text-left space-y-3">
                <li className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="12" x2="12" y2="16" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                  <span>8 mins 40 secs per station</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span>8 stations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="12" x2="12" y2="16" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                  <span>Total Circuit Time: 69 mins 20 secs</span>
                </li>
              </ul>
              <div className="h-px bg-gray-200 my-8"></div>
              <p className="text-xl font-semibold">Total Exam Time: 188 mins 30 secs (3 hrs 10 mins)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - The Fourth Section */}
      <section className="py-20 px-4 bg-gray-50 text-gray-900">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl font-bold">Our Flexible Pricing</h2>
          <p className="mt-4 text-lg">
            Choose the plan that fits your study needs and start preparing for success.
          </p>
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Practice Mode Pricing Table */}
            <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in-left">
              <h3 className="text-2xl font-bold">Practice Mode</h3>
              <p className="mt-2">Unlimited practice with instant feedback</p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <span className="text-xl font-semibold">£150</span>
                  <span className="text-gray-500"> / 3 months</span>
                  <button className="px-6 py-2 rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors transform hover:scale-105">Buy</button>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <span className="text-xl font-semibold">£250</span>
                  <span className="text-gray-500"> / 6 months</span>
                  <button className="px-6 py-2 rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors transform hover:scale-105">Buy</button>
                </div>
              </div>
            </div>
            {/* Live Mode Pricing Table */}
            <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in-right">
              <h3 className="text-2xl font-bold">Live Mode (Mock Exam)</h3>
              <p className="mt-2">12 stations • 2 hours • AI scoring</p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <span className="text-xl font-semibold">£150</span>
                  <span className="text-gray-500"> / 1 month</span>
                  <button className="px-6 py-2 rounded-full font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors transform hover:scale-105">Buy</button>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <span className="text-xl font-semibold">£300</span>
                  <span className="text-gray-500"> / 3 months</span>
                  <button className="px-6 py-2 rounded-full font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors transform hover:scale-105">Buy</button>
                </div>
                <div className="flex items-center justify-between py-4">
                  <span className="text-xl font-semibold">£500</span>
                  <span className="text-gray-500"> / 6 months</span>
                  <button className="px-6 py-2 rounded-full font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors transform hover:scale-105">Buy</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - The Fifth Section */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold">Ready to Pass Your Exam?</h2>
          <p className="mt-4 text-lg">
            Join thousands of successful candidates who used our platform to achieve their goals.
          </p>
          <div className="mt-10 animate-scale-in">
            <a href="/dashboard" className="px-10 py-4 rounded-full font-bold text-lg text-white bg-gradient-to-r from-indigo-500 to-purple-600 transition-transform transform hover:scale-105 shadow-xl">
              Get Started Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
