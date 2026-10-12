import React, { useState } from 'react';

interface NavigationProps {
  onScrollToTop?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onScrollToTop }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Home');

  const navLinks = [
    { name: 'Home', href: '#top' },
    { name: 'Destinations', href: '#destinations' },
    { name: 'Experiences', href: '#experiences' },
    { name: 'About', href: '#about' },
  ];

  const handleLinkClick = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    setActiveItem(name);
    if (name === 'Home') {
      if (onScrollToTop) {
        onScrollToTop();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveItem('Home');
    if (onScrollToTop) {
      onScrollToTop();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-5 left-0 right-0 z-[100] flex justify-center px-4 sm:px-6 pointer-events-none transition-all duration-300">
      {/* Floating Glassmorphism Pill */}
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto w-full max-w-4xl relative flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-full bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/15 shadow-[0_16px_36px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300"
      >
        {/* Brand Logo */}
        <a
          href="#top"
          onClick={handleLogoClick}
          className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-full py-0.5 px-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          title="FOUND Namibia"
        >
          <img
            src="/found%20logo%20white@2x.png"
            alt="FOUND Namibia"
            className="h-8 sm:h-9 md:h-10 w-auto object-contain"
          />
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = activeItem === link.name;
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.name)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                  isActive
                    ? 'text-white bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] font-semibold'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.name}
              </a>
            );
          })}
        </div>

        {/* Right CTA / Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* Plan Your Trip CTA */}
          <a
            href="#plan"
            onClick={(e) => {
              e.preventDefault();
              setActiveItem('Plan');
            }}
            className="group relative inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#FAF7F2] text-[#121214] text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>Plan Your Trip</span>
            <svg
              className="w-3.5 h-3.5 text-neutral-800 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {mobileMenuOpen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer / Expanded Glass Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden pointer-events-auto absolute top-16 left-4 right-4 max-w-sm mx-auto rounded-2xl bg-[#0d0d10]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_40px_rgba(0,0,0,0.85)] p-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.name)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all ${
                activeItem === link.name
                  ? 'text-white bg-white/15 font-semibold'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.name}
            </a>
          ))}
          <div className="pt-2 border-t border-white/10 mt-1">
            <a
              href="#plan"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#FAF7F2] text-[#121214] text-xs font-semibold tracking-wider uppercase hover:bg-white transition-all text-center"
            >
              <span>Plan Your Trip</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
