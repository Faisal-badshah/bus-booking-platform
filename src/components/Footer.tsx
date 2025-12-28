'use client';

import { Link } from "react-router-dom";
import { 
  Bus, 
  Phone, 
  Mail, 
  MapPinned, 
  Facebook, 
  Instagram,
  Shield 
} from "lucide-react";
import { useLanguage } from '../context/LanguageContext';

export const Footer = () => {
  const { language } = useLanguage();

  const content = {
    en: {
      brandDesc: "Premium bus travel across Bihar — comfort, safety, and reliability in every journey.",
      quickLinks: "Quick Links",
      support: "Support",
      getInTouch: "Get in Touch",
      followUs: "Follow Us",
      phone: "+91 8084362156",
      email: "support@ridebus.in",
      address: "Patna, Bihar, India",
      trustMessage: "Trusted by Thousands · Safe & Reliable · Premium Service",
      copyright: "© 2025 Ride Bus. All rights reserved.",
    },
    hi: {
      brandDesc: "बिहार में प्रीमियम बस यात्रा — हर सफर में आराम, सुरक्षा और विश्वसनीयता।",
      quickLinks: "त्वरित लिंक",
      support: "समर्थन",
      getInTouch: "हमसे संपर्क करें",
      followUs: "हमसे जुड़ें",
      phone: "+91 8084362156",
      email: "support@ridebus.in",
      address: "पटना, बिहार, भारत",
      trustMessage: "हजारों का भरोसा · सुरक्षित और विश्वसनीय · प्रीमियम सेवा",
      copyright: "© 2025 राइड बस। सभी अधिकार सुरक्षित।",
    }
  }[language];

  return (
    <footer className="bg-slate-900 text-white py-12 mt-auto" aria-labelledby="footer-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="footer-heading" className="sr-only">Footer</h2>
        
        {/* Trust Banner */}
        <div className="text-center mb-10">
          <p className="text-sm flex items-center justify-center gap-2 text-slate-300">
            <Shield className="h-4 w-4 text-green-500" aria-hidden="true" />
            {content.trustMessage}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
          {/* Brand & Description */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Bus className="h-10 w-10 text-green-500" aria-hidden="true" />
              <span className="text-2xl sm:text-3xl font-bold">
                RIDE <span className="text-green-500">BUS</span>
              </span>
            </div>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-sm">
              {content.brandDesc}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-5">{content.quickLinks}</h3>
            <ul className="space-y-3 text-sm sm:text-base">
              <li><Link to="/" className="text-slate-300 hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded">Home</Link></li>
              <li><Link to="/about" className="text-slate-300 hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded">About Us</Link></li>
              <li><Link to="/services" className="text-slate-300 hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded">Services</Link></li>
              <li><Link to="/book" className="text-slate-300 hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded">Book Tickets</Link></li>
              <li><Link to="/contact" className="text-slate-300 hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-5">{content.support}</h3>
            <ul className="space-y-3 text-sm sm:text-base">
              <li><Link to="/my-bookings" className="text-slate-300 hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded">My Bookings</Link></li>
              <li><Link to="/contact" className="text-slate-300 hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded">Help Center</Link></li>
              <li><Link to="/terms" className="text-slate-300 hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-slate-300 hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-5">{content.getInTouch}</h3>
              <ul className="space-y-4 text-sm sm:text-base text-slate-300">
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <a href="tel:+918084362156" className="hover:text-green-400 transition">{content.phone}</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <a href="mailto:support@ridebus.in" className="hover:text-green-400 transition">{content.email}</a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPinned className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span>{content.address}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-5">{content.followUs}</h3>
              <div className="flex gap-5">
                <a 
                  href="https://www.facebook.com/share/17gD4idaty/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Facebook" 
                  className="hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded-full"
                >
                  <Facebook className="h-8 w-8" />
                </a>
                <a 
                  href="https://www.instagram.com/_ridebus_" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Instagram" 
                  className="hover:text-green-400 transition focus-visible:ring-2 focus-visible:ring-green-400 rounded-full"
                >
                  <Instagram className="h-8 w-8" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
          <p>{content.copyright}</p>
        </div>
      </div>
    </footer>
  );
};