import { Link } from "react-router-dom";
import { Bus, Phone, Mail, MapPinned, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white dark:bg-slate-950 py-12" aria-label="Footer">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-8 sm:mb-10">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <Bus className="h-8 w-8 sm:h-9 sm:w-9 text-green-500" aria-hidden="true" />
              <span className="text-xl sm:text-2xl font-semibold">RIDE BUS</span>
            </div>
            <p className="text-slate-300 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Premium bus travel across Bihar — comfort, safety, and reliability in every journey.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-4 sm:mb-5">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-3 text-slate-300 dark:text-slate-400 text-sm sm:text-base">
              <li><Link to="/" className="hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:outline-none" aria-label="Home">Home</Link></li>
              <li><Link to="/about" className="hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:outline-none" aria-label="About Us">About Us</Link></li>
              <li><Link to="/services" className="hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:outline-none" aria-label="Services">Services</Link></li>
              <li><Link to="/book" className="hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:outline-none" aria-label="Book Tickets">Book Tickets</Link></li>
              <li><Link to="/contact" className="hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:outline-none" aria-label="Contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-4 sm:mb-5">Support</h3>
            <ul className="space-y-2 sm:space-y-3 text-slate-300 dark:text-slate-400 text-sm sm:text-base">
              <li><Link to="/my-bookings" className="hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:outline-none" aria-label="My Bookings">My Bookings</Link></li>
              <li><Link to="/contact" className="hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:outline-none" aria-label="Help Center">Help Center</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-4 sm:mb-5">Legal</h3>
            <ul className="space-y-2 sm:space-y-3 text-slate-300 dark:text-slate-400 text-sm sm:text-base">
              <li><Link to="/terms" className="hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:outline-none" aria-label="Terms & Conditions">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:outline-none" aria-label="Privacy Policy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 dark:border-slate-700 pt-6 sm:pt-8 text-center text-slate-400 dark:text-slate-500 text-sm">
          <p>&copy; 2025 Ride Bus. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};