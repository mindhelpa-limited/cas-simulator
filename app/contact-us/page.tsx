"use client";

import React, { useState } from "react";
import { Phone, Mail, MapPin, Twitter, Linkedin, Facebook } from "lucide-react";

// --- Reusable Components ---

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-80 backdrop-filter backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <a href="/">
            <img
              src="/logocas.png"
              alt="CAS Prep Logo"
              className="w-[150px] h-[60px] object-contain"
            />
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-10">
          <a href="/" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300">Home</a>
          <a href="/about" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300">About Us</a>
          <a href="/pricing" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300">Pricing</a>
          <a href="/contact-us" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors duration-300">Contact Us</a>
          <a href="/dashboard" className="px-6 py-3 rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 shadow-md">Sign In</a>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-600 hover:text-indigo-600 focus:outline-none"
            aria-label="Toggle menu"
          >
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
            <a href="/" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Home</a>
            <a href="/about" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>About Us</a>
            <a href="/pricing" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a href="/contact-us" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Contact Us</a>
            <a href="/dashboard" className="w-full mx-8 px-6 py-3 text-center rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 shadow-md" onClick={() => setIsMenuOpen(false)}>Sign In</a>
          </nav>
        </div>
      )}
    </header>
  );
};

const Footer = () => (
  <footer className="bg-[#121821] text-gray-400 py-10">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
      <div className="flex justify-center space-x-6 mb-4">
        <a href="#" className="hover:text-white transition duration-200" aria-label="Facebook">
          <Facebook className="h-6 w-6" />
        </a>
        <a href="#" className="hover:text-white transition duration-200" aria-label="Twitter / X">
          <Twitter className="h-6 w-6" />
        </a>
        <a href="#" className="hover:text-white transition duration-200" aria-label="LinkedIn">
          <Linkedin className="h-6 w-6" />
        </a>
      </div>
      <p className="text-sm">&copy; {new Date().getFullYear()} CareerEdu. All rights reserved.</p>
    </div>
  </footer>
);

// --- Main Page Component ---
export default function App() {
  const [name, setName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Contact details
  const phoneDisplay = "+44 786 9467 057";
  const phoneHref = "+447869467057";
  const contactEmail = "info@cascsuccess.com";
  const addressLine1 = "1st Floor, North Westgate House,";
  const addressLine2 = "Harlow Essex, CM20 1YS";
  const mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=North+Westgate+House,+Harlow,+CM20+1YS";

  // ✅ Typed submit handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${userEmail}\n\nMessage:\n${message}`
    )}`;

    window.location.href = mailtoUrl;

    setName("");
    setUserEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="bg-gray-50 font-sans text-gray-900 min-h-screen flex flex-col">
      <Header />

      {/* Main Content Section */}
      <main className="flex-grow pt-24">
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Get in Touch
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                We're here to help you succeed. Fill out the form or use our direct contact info below.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Contact Information Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-6">
                {/* Email Card */}
                <div className="rounded-xl p-8 text-white shadow-xl bg-gradient-to-br from-violet-600 to-indigo-700">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/20 mb-4">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Write Us</h2>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="block mt-2 text-lg font-medium opacity-90 hover:opacity-100 hover:underline transition"
                  >
                    {contactEmail}
                  </a>
                </div>

                {/* Phone Card */}
                <div className="rounded-xl p-8 text-white shadow-xl bg-gray-900">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/10 mb-4">
                    <Phone className="h-8 w-8 text-gray-200" />
                  </div>
                  <h2 className="text-2xl font-bold">Call Us</h2>
                  <a
                    href={`tel:${phoneHref}`}
                    className="block mt-2 text-lg font-medium opacity-90 hover:opacity-100 hover:underline transition"
                  >
                    {phoneDisplay}
                  </a>
                </div>

                {/* Address Card */}
                <div className="rounded-xl p-8 text-white shadow-xl bg-gray-900">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/10 mb-4">
                    <MapPin className="h-8 w-8 text-gray-200" />
                  </div>
                  <h2 className="text-2xl font-bold">Main Office</h2>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block mt-2 text-lg font-medium opacity-90 hover:opacity-100 hover:underline transition"
                  >
                    {addressLine1} <br /> {addressLine2}
                  </a>
                </div>
              </div>

              {/* Contact Form */}
              <div className="rounded-xl bg-white p-8 shadow-xl">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-violet-500 focus:ring-violet-500 transition duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={userEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserEmail(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-violet-500 focus:ring-violet-500 transition duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={subject}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-violet-500 focus:ring-violet-500 transition duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4} // number, not string
                      value={message}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-violet-500 focus:ring-violet-500 transition duration-200"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-lg bg-violet-600 text-white font-semibold text-lg shadow-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition duration-200"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
