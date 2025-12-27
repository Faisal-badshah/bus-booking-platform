import { Link } from "react-router-dom";
import { Bus, Phone, Mail, MapPinned, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-12 mt-auto" aria-labelledby="footer-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="footer-heading" className="sr-only">Footer</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
          {/* Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Bus className="h-9 w-9 text-green-500" aria-hidden="true" />
              <span className="text-2xl font-semibold">
                RIDE <span className="text-green-500">BUS</span>
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
              Premium bus travel across Bihar — comfort, safety, and reliability in every journey.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-5">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-slate-300 hover:text-green-400 transition">Home</Link></li>
              <li><Link to="/about" className="text-slate-300 hover:text-green-400 transition">About Us</Link></li>
              <li><Link to="/services" className="text-slate-300 hover:text-green-400 transition">Services</Link></li>
              <li><Link to="/book" className="text-slate-300 hover:text-green-400 transition">Book Tickets</Link></li>
              <li><Link to="/contact" className="text-slate-300 hover:text-green-400 transition">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-5">Support</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/my-bookings" className="text-slate-300 hover:text-green-400 transition">My Bookings</Link></li>
              <li><Link to="/contact" className="text-slate-300 hover:text-green-400 transition">Help Center</Link></li>
              <li><Link to="/terms" className="text-slate-300 hover:text-green-400 transition">Terms</Link></li>
              <li><Link to="/privacy" className="text-slate-300 hover:text-green-400 transition">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-5">Get in Touch</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-green-500" aria-hidden="true" />
                  +91 98765 43210
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-green-500" aria-hidden="true" />
                  support@ridebus.in
                </li>
                <li className="flex items-center gap-3">
                  <MapPinned className="h-4 w-4 text-green-500" aria-hidden="true" />
                  Patna, Bihar, India
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a href="https://facebook.com/ridebus" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-green-400 transition">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="https://twitter.com/ridebus" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-green-400 transition">
                  <Twitter className="h-6 w-6" />
                </a>
                <a href="https://instagram.com/ridebus" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-green-400 transition">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="https://youtube.com/ridebus" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-green-400 transition">
                  <Youtube className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
          <p>© 2025 RIDE BUS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};