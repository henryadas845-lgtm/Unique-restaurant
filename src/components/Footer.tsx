import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { normalizeWhatsAppNumber, sanitizeExternalLink } from '../utils/format';

export const Footer: React.FC = () => {
  const { settings } = useRestaurant();
  const restaurantName = settings?.restaurant_name || 'Unique Restaurant';
  const description =
    settings?.description ||
    'Freshly prepared, authentic Nigerian meals made with quality ingredients in Owo Ede, Osogbo, Osun State.';
  const location = settings?.location || 'Owo Ede, Osogbo, Osun State, Nigeria';
  const phone = settings?.phone_number || '+234 906 756 6746';
  const whatsappClean = normalizeWhatsAppNumber(settings?.whatsapp_number || '2349067566746');
  const openingHours = settings?.opening_hours || 'Opening hours editable via Admin Dashboard';

  const instagram = sanitizeExternalLink(settings?.social_instagram);
  const facebook = sanitizeExternalLink(settings?.social_facebook);
  const tiktok = sanitizeExternalLink(settings?.social_tiktok);

  return (
    <footer className="bg-[#111111] text-neutral-300 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <Link
              to="/"
              className="font-display text-2xl font-bold text-white tracking-tight inline-block mb-4"
            >
              {restaurantName}
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
              {description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-neutral-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-neutral-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-neutral-400 hover:text-white transition-colors">
                  Our Menu
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-neutral-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Visit &amp; Contact</h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                <span>{location}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#EA580C] shrink-0" />
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#EA580C] shrink-0" />
                <a
                  href={`https://wa.me/${whatsappClean}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp Orders
                </a>
              </li>
            </ul>
          </div>

          {/* Hours & Social */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Opening Hours</h3>
            <div className="flex items-start gap-2.5 text-sm text-neutral-400 mb-6">
              <Clock className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
              <span>{openingHours}</span>
            </div>

            {(instagram || facebook || tiktok) && (
              <div>
                <h4 className="text-xs font-medium text-neutral-400 mb-2.5">Follow Us</h4>
                <div className="flex items-center gap-4 text-sm">
                  {instagram && (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-300 hover:text-[#EA580C] transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                  {facebook && (
                    <a
                      href={facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-300 hover:text-[#EA580C] transition-colors"
                    >
                      Facebook
                    </a>
                  )}
                  {tiktok && (
                    <a
                      href={tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-300 hover:text-[#EA580C] transition-colors"
                    >
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            &copy; {new Date().getFullYear()} {restaurantName}. All rights reserved.
          </p>
          <p>Owo Ede, Osogbo, Osun State, Nigeria</p>
        </div>
      </div>
    </footer>
  );
};
