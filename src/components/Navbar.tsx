import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { sanitizeImageUrl } from '../utils/format';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings } = useRestaurant();
  const restaurantName = settings?.restaurant_name || 'Unique Restaurant';
  const logoUrl = sanitizeImageUrl(settings?.logo_url);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
      isActive
        ? 'text-[#C81E1E] border-[#C81E1E]'
        : 'text-neutral-700 border-transparent hover:text-neutral-950 hover:border-neutral-300'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-3 text-base font-medium rounded-lg transition-colors ${
      isActive
        ? 'text-[#C81E1E] bg-red-50'
        : 'text-neutral-800 hover:bg-neutral-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E1E] rounded"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded object-cover shrink-0"
              />
            ) : null}
            <span className="font-display text-xl font-bold tracking-tight text-[#111111] whitespace-nowrap">
              {restaurantName}
            </span>
          </Link>

          {/* Zone 2: Primary Text Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-7"
          >
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About Us
            </NavLink>
            <NavLink to="/menu" className={navLinkClass}>
              Our Menu
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>
          </nav>

          {/* Zone 3: Primary Action + Subtle Admin Icon */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/menu"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#991B1B] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E1E]"
            >
              Order Now
            </Link>

            <Link
              to="/admin/login"
              aria-label="Admin Dashboard"
              title="Admin Dashboard"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-colors duration-150 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              <LayoutDashboard className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <nav aria-label="Mobile navigation" className="px-4 py-4 space-y-1">
            <NavLink to="/" end className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/about" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
              About Us
            </NavLink>
            <NavLink to="/menu" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
              Our Menu
            </NavLink>
            <NavLink to="/contact" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
              Contact
            </NavLink>
            <div className="pt-3 border-t border-neutral-100">
              <Link
                to="/menu"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full py-3 px-4 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#991B1B] rounded-lg transition-colors"
              >
                Order Now
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
