'use client';

import React, { useState } from 'react';

// A simple, responsive header component with navigation.
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-80 backdrop-filter backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <a href="/">
            <img src="/logocas.png" alt="CAS Prep Logo" className="w-[150px] h-[60px] object-contain" />
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-10">
          <a href="/" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300">
            Home
          </a>
          <a href="/about" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300">
            About Us
          </a>
          <a href="/pricing" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300">
            Pricing
          </a>
          <a href="/contact-us" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300">
            Contact Us
          </a>
          <a href="/dashboard" className="px-6 py-3 rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 shadow-md">
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
          <nav className="flex flex-col items-center py-6 space-y-6">
            <a href="/" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>
              Home
            </a>
            <a href="/about" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>
              About Us
            </a>
            <a href="/pricing" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>
              Pricing
            </a>
            <a href="/contact-us" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>
              Contact Us
            </a>
            <a href="/dashboard" className="w-full mx-8 px-6 py-3 text-center rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 shadow-md" onClick={() => setIsMenuOpen(false)}>
              Sign In
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

// A simple, elegant footer component.
const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 text-gray-300 py-6">
      <div className="container mx-auto text-center text-sm">
        <p>All Rights Reserved. CASCSUCCESS © 2025</p>
      </div>
    </footer>
  );
};

// The main AboutPage component, now with a Header and Footer.
const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header />
      <main className="flex flex-col items-center justify-center flex-1 pt-32 pb-16 px-4 sm:px-8 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 animate-fade-in-up">
          About Our Platform
        </h1>
        <p className="mt-3 text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed animate-fade-in-up delay-200">
          Welcome to **CAS Prep**, your premier destination for preparing for the CAS assessment. We are dedicated to providing the most effective and comprehensive practice tools.
        </p>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-10 text-left max-w-4xl">
          <div className="p-8 border border-gray-100 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-white animate-fade-in-left">
            <h2 className="text-2xl font-semibold text-indigo-600 mb-2">Practice for Success</h2>
            <p className="text-gray-600 mt-2">
              Our platform offers a wide range of practice tests and mock assessments meticulously designed to simulate the real CAS exam experience. With unlimited practice opportunities, you can hone your skills and build confidence.
            </p>
          </div>

          <div className="p-8 border border-gray-100 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-white animate-fade-in-right">
            <h2 className="text-2xl font-semibold text-purple-600 mb-2">Unlimited Learning</h2>
            <p className="text-gray-600 mt-2">
              Practice as much as you need, whenever you want. Our flexible platform ensures you have the resources to prepare at your own pace, mastering every concept required for the assessment.
            </p>
          </div>
        </div>

        <p className="mt-16 text-lg md:text-xl text-gray-600 animate-fade-in-up delay-800">
          Join us and take the first step towards a successful career!
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
