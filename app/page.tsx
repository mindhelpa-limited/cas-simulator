'use client';

import { useState } from 'react';
import Image from 'next/image';

// A simple, responsive header component with navigation.
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-80 backdrop-filter backdrop-blur-md shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <a href="/">
            <Image
              src="/logocas.png"
              alt="CAS Prep Logo"
              width={150}
              height={60}
              className="object-contain"
            />
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-8 md:flex">
          <a
            href="/"
            className="font-medium text-gray-600 transition-colors duration-300 hover:text-indigo-600"
          >
            Home
          </a>
          <a
            href="/about"
            className="font-medium text-gray-600 transition-colors duration-300 hover:text-indigo-600"
          >
            About Us
          </a>
          <a
            href="/pricing"
            className="font-medium text-gray-600 transition-colors duration-300 hover:text-indigo-600"
          >
            Pricing
          </a>
          <a
            href="/contact-us"
            className="font-medium text-gray-600 transition-colors duration-300 hover:text-indigo-600"
          >
            Contact Us
          </a>
          <a
            href="/dashboard"
            className="rounded-full bg-indigo-600 px-5 py-2 font-semibold text-white shadow-md transition-colors duration-300 hover:bg-indigo-700"
          >
            Sign In
          </a>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="focus:outline-none text-gray-600 hover:text-indigo-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16m-16 6h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white bg-opacity-90 backdrop-blur-md backdrop-filter">
          <nav className="flex flex-col items-center space-y-4 py-4">
            <a
              href="/"
              className="font-medium text-gray-600 transition-colors duration-300 hover:text-indigo-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="/about"
              className="font-medium text-gray-600 transition-colors duration-300 hover:text-indigo-600"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </a>
            <a
              href="/pricing"
              className="font-medium text-gray-600 transition-colors duration-300 hover:text-indigo-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="/contact-us"
              className="font-medium text-gray-600 transition-colors duration-300 hover:text-indigo-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact Us
            </a>
            <a
              href="/dashboard"
              className="w-full rounded-full bg-indigo-600 px-5 py-2 text-center font-semibold text-white shadow-md transition-colors duration-300 hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
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
  // A simple placeholder for animation logic.
};

const HomePage = () => {
  useAnimateOnScroll();

  return (
    <div className="min-h-screen overflow-hidden bg-gray-50 font-sans text-gray-900">
      {/* This is the main container for the homepage. */}
      <Header />
      {/* Hero Section - The First Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-24 text-center">
        <div className="absolute inset-0 z-0 animate-gradient-slow-pulse opacity-40">
          <div className="h-full w-full animate-pulse-bg bg-gradient-to-br from-purple-200 via-indigo-200 to-sky-200"></div>
        </div>
        <div className="relative z-10 mx-auto max-w-4xl">
          <h1 className="animate-fade-in-up text-5xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
            Master Your CAS Exam with{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Simulated Role-Play
            </span>
          </h1>
          <p className="animate-fade-in-up delay-200 mt-6 text-lg text-gray-600 md:text-xl">
            Practice for the CAS exam with realistic role-play scenarios,
            instant feedback, and a structured mock test environment.
          </p>
          <div className="animate-fade-in-up delay-400 mt-10 flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <a
              href="/dashboard"
              className="w-full transform rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-indigo-700 sm:w-auto"
            >
              Start Practicing Today
            </a>
            <a
              href="/pricing"
              className="w-full transform rounded-full border border-indigo-200 bg-white px-8 py-3 font-semibold text-indigo-600 shadow-md transition-transform duration-300 hover:scale-105 hover:bg-gray-100 sm:w-auto"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
      {/* What We Offer Section - The Second Section */}
      <section id="features" className="bg-gray-50 px-4 py-20 text-gray-900">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl font-bold">What We Offer</h2>
          <p className="mt-4 text-lg">
            Our platform is designed to give you the most comprehensive and
            effective preparation for your exam.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="animate-fade-in-down rounded-xl border border-transparent bg-white p-8 shadow-lg transition-all duration-300 hover:border-indigo-400 hover:shadow-2xl">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold">Practice Mode</h3>
              <p className="mt-4">
                Unlimited practice sessions with a wide range of simulated
                scenarios. Get instant, detailed feedback on your performance to
                improve your skills.
              </p>
            </div>
            <div className="animate-fade-in-down delay-200 rounded-xl border border-transparent bg-white p-8 shadow-lg transition-all duration-300 hover:border-purple-400 hover:shadow-2xl">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold">Live Mode (Mock Exam)</h3>
              <p className="mt-4">
                Experience a full-length, 12-station mock exam. Our AI-powered
                scoring provides an objective assessment of your performance in
                a timed environment.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Exam Timings Section - The Third Section */}
      <section className="bg-gray-100 px-4 py-20 text-gray-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold">Exam Structure Breakdown</h2>
          <p className="mt-4 text-lg">
            Prepare for the exact timing and format of the CAS exam with our
            detailed simulation.
          </p>
          <div className="mt-12">
            <div className="animate-fade-in-up rounded-xl bg-white p-8 shadow-lg">
              <h3 className="mb-6 text-2xl font-bold">Morning Circuit</h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-center space-x-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0 text-indigo-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>11 mins 10 secs per station</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0 text-indigo-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V5H6.5A2.5 2.5 0 0 0 4 7.5v12z" />
                    <path d="M9 10h1" />
                    <path d="M9 13h1" />
                  </svg>
                  <span>8 stations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0 text-indigo-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Total Circuit Time: 89 mins 10 secs</span>
                </li>
              </ul>
              <div className="my-8 h-px bg-gray-200"></div>
              <h3 className="mb-6 text-2xl font-bold">Afternoon Circuit</h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-center space-x-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0 text-indigo-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>8 mins 40 secs per station</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0 text-indigo-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V5H6.5A2.5 2.5 0 0 0 4 7.5v12z" />
                    <path d="M9 10h1" />
                    <path d="M9 13h1" />
                  </svg>
                  <span>8 stations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0 text-indigo-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Total Circuit Time: 69 mins 20 secs</span>
                </li>
              </ul>
              <div className="my-8 h-px bg-gray-200"></div>
              <p className="text-xl font-semibold">
                Total Exam Time: 188 mins 30 secs (3 hrs 10 mins)
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Pricing Section - The Fourth Section */}
      <section className="bg-gray-50 px-4 py-20 text-gray-900">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl font-bold">Our Flexible Pricing</h2>
          <p className="mt-4 text-lg">
            Choose the plan that fits your study needs and start preparing for
            success.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="animate-fade-in-left rounded-xl bg-white p-8 shadow-lg">
              <h3 className="text-2xl font-bold">Practice Mode</h3>
              <p className="mt-2">Unlimited practice with instant feedback</p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <span className="text-xl font-semibold">£150</span>
                  <span className="text-gray-500"> / 3 months</span>
                  <a
                    href="/pricing"
                    className="transform rounded-full bg-indigo-600 px-6 py-2 font-semibold text-white transition-colors hover:scale-105 hover:bg-indigo-700"
                  >
                    Buy
                  </a>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <span className="text-xl font-semibold">£250</span>
                  <span className="text-gray-500"> / 6 months</span>
                  <a
                    href="/pricing"
                    className="transform rounded-full bg-indigo-600 px-6 py-2 font-semibold text-white transition-colors hover:scale-105 hover:bg-indigo-700"
                  >
                    Buy
                  </a>
                </div>
              </div>
            </div>
            <div className="animate-fade-in-right rounded-xl bg-white p-8 shadow-lg">
              <h3 className="text-2xl font-bold">Live Mode (Mock Exam)</h3>
              <p className="mt-2">
                16 stations • 188 mins 30 secs (3 hrs 10 mins)
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <span className="text-xl font-semibold">£150</span>
                  <span className="text-gray-500"> / 1 month</span>
                  <a
                    href="/pricing"
                    className="transform rounded-full bg-purple-600 px-6 py-2 font-semibold text-white transition-colors hover:scale-105 hover:bg-purple-700"
                  >
                    Buy
                  </a>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <span className="text-xl font-semibold">£300</span>
                  <span className="text-gray-500"> / 3 months</span>
                  <a
                    href="/pricing"
                    className="transform rounded-full bg-purple-600 px-6 py-2 font-semibold text-white transition-colors hover:scale-105 hover:bg-purple-700"
                  >
                    Buy
                  </a>
                </div>
                <div className="flex items-center justify-between py-4">
                  <span className="text-xl font-semibold">£500</span>
                  <span className="text-gray-500"> / 6 months</span>
                  <a
                    href="/pricing"
                    className="transform rounded-full bg-purple-600 px-6 py-2 font-semibold text-white transition-colors hover:scale-105 hover:bg-purple-700"
                  >
                    Buy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Final CTA Section - The Fifth Section */}
      <section className="bg-gray-900 px-4 py-20 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold">Ready to Pass Your Exam?</h2>
          <p className="mt-4 text-lg">
            Join thousands of successful candidates who used our platform to
            achieve their goals.
          </p>
          <div className="animate-scale-in mt-10">
            <a
              href="/dashboard"
              className="transform rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-10 py-4 text-lg font-bold text-white shadow-xl transition-transform hover:scale-105"
            >
              Get Started Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;