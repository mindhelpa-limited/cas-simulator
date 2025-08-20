import { useState } from 'react';

// Header component for navigation
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // SVG icons for navigation items
  const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );

  const AboutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8v-2h-2" />
      <path d="M22 12a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4z" />
      <path d="M12 16a4 4 0 0 0 4 4" />
    </svg>
  );

  const ContactIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );

  const PricingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.34 12 11 20.73 6.34" />
      <line x1="12" y1="22" x2="12" y2="11" />
      <path d="M7 11.2V16a2 2 0 0 0 1 1.73l3 1.74" />
      <path d="M17 11.2V16a2 2 0 0 1-1 1.73l-3 1.74" />
    </svg>
  );

  const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
  
  const LoginIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );

  const navItems = [
    { name: 'Home', path: '/', icon: <HomeIcon /> },
    { name: 'About Us', path: '/about', icon: <AboutIcon /> },
    { name: 'Contact Us', path: '/contact us', icon: <ContactIcon /> },
    { name: 'Pricing', path: '/pricing', icon: <PricingIcon /> },
    { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { name: 'Login', path: '/login', icon: <LoginIcon /> },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo or App Name */}
          <div className="flex-shrink-0">
            <a href="/" className="text-2xl font-bold text-gray-800">
              My App
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors duration-200"
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
