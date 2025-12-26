'use client';

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bus,
  Clock,
  Shield,
  Ticket,
  Award,
  MapPin,
  Users,
  IndianRupee,
  Menu,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Star,
  Phone,
  Mail,
  MapPinned,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <>
      {/* Navigation Header - Clean & Premium */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <nav className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-4">
              <Bus className="h-10 w-10 text-green-600" aria-hidden="true" />
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                RIDE <span className="text-green-600">BUS</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-12">
              <Link to="/" className="text-slate-600 hover:text-green-600 font-medium transition-colors">
                Home
              </Link>
              <Link to="/about" className="text-slate-600 hover:text-green-600 font-medium transition-colors">
                About
              </Link>
              <Link to="/services" className="text-slate-600 hover:text-green-600 font-medium transition-colors">
                Services
              </Link>
              <Link to="/book" className="text-slate-600 hover:text-green-600 font-medium transition-colors">
                Book Tickets
              </Link>
              <Link to="/contact" className="text-slate-600 hover:text-green-600 font-medium transition-colors">
                Contact
              </Link>
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-5">
              <Button variant="ghost" size="sm" className="font-medium">
                Login
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white font-medium" size="sm">
                Sign Up
              </Button>
            </div>

            {/* Mobile Menu */}
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="pt-24 bg-gray-50">
        {/* Hero Section - Premium & Elegant */}
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-40 lg:py-52 overflow-hidden">
          {/* Subtle Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAyYy0yLjIxIDAtNCAxLjc5LTQgNHMxLjc5IDQgNCA0IDQtMS43OSA0LTQtMS43OS00LTQtNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA0Ii8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="container mx-auto px-6 relative z-10"
          >
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
                RIDE <span className="text-green-400">BUS</span>
              </h1>
              <p className="text-2xl sm:text-3xl md:text-4xl font-light text-green-300 mb-8 tracking-wide">
                हर सफर, हर Budget के लिए
              </p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-semibold mb-8">
                Premium Travel, Affordable Prices
              </p>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90 leading-relaxed mb-16">
                Experience comfortable, safe, and reliable bus journeys across Bihar with our modern fleet and exceptional service.
              </p>

              {/* Single Prominent CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <Link to="/book">
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-14 py-8 text-2xl font-semibold rounded-2xl shadow-2xl hover:shadow-green-600/30 transition-all duration-300 hover:-translate-y-1"
                  >
                    <Ticket className="mr-4 h-8 w-8" />
                    Book Tickets Now
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-50 to-transparent" />
        </section>

        {/* Popular Routes - Subtle & Clean */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="py-24 bg-white"
        >
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-800 mb-16">
              Popular Routes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              {[
                { from: "Siwan", to: "Raxaul" },
                { from: "Siwan", to: "Motihari" },
                { from: "Raxaul", to: "Gopalganj" },
                { from: "Motihari", to: "Gopalganj" },
              ].map((route, idx) => (
                <div key={idx} className="text-center group">
                  <div className="text-6xl mb-6 text-gray-200 group-hover:text-green-600 transition-colors duration-500">
                    🚌
                  </div>
                  <p className="text-2xl font-semibold text-slate-800 mb-3">{route.from}</p>
                  <div className="flex items-center justify-center my-4 opacity-60">
                    <div className="h-px w-20 bg-gray-300"></div>
                    <MapPin className="h-5 w-5 text-green-600 mx-4" />
                    <div className="h-px w-20 bg-gray-300"></div>
                  </div>
                  <p className="text-2xl font-semibold text-slate-800">{route.to}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Features - Elegant Grid */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-28 bg-gray-50"
        >
          <div className="container mx-auto px-6">
            <div className="text-center mb-20 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6">
                Why Choose Ride Bus?
              </h2>
              <p className="text-xl text-slate-600">
                Premium service crafted with care for every passenger
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
              {[
                { icon: Bus, color: "from-green-500 to-emerald-600", title: "Modern Fleet", desc: "Well-maintained luxury buses with AC, comfortable seating, and onboard amenities." },
                { icon: Clock, color: "from-blue-500 to-indigo-600", title: "On-Time Service", desc: "Reliable schedules ensuring you reach your destination as planned." },
                { icon: Shield, color: "from-purple-500 to-pink-600", title: "Safe & Secure", desc: "Professional drivers and rigorous safety standards for peace of mind." },
                { icon: IndianRupee, color: "from-orange-500 to-red-600", title: "Affordable Pricing", desc: "Premium experience at prices designed for every budget." },
                { icon: Users, color: "from-teal-500 to-cyan-600", title: "Customer First", desc: "Dedicated support team available to assist you at every step." },
                { icon: Award, color: "from-amber-500 to-yellow-600", title: "Trusted Excellence", desc: "Serving thousands of satisfied travelers across Bihar." },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-white border-0 shadow-lg hover:shadow-2xl transition-shadow duration-500 rounded-3xl h-full">
                    <CardContent className="p-10 text-center">
                      <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl`}>
                        <feature.icon className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">{feature.title}</h3>
                      <p className="text-slate-600 leading-relaxed text-lg">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Testimonials - Subtle & Trust-Building */}
        <section className="py-28 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-800 mb-16">
              Passenger Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
              {[
                { name: "Rajesh Kumar", location: "Patna", text: "Exceptional service. Clean, comfortable, and always on time. Ride Bus is my only choice for travel in Bihar." },
                { name: "Priya Singh", location: "Siwan", text: "Smooth booking process and excellent customer support. The journey felt premium yet affordable." },
                { name: "Amit Patel", location: "Motihari", text: "Safe, reliable, and professional. I trust Ride Bus for all my family trips." },
              ].map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-xl transition-shadow h-full">
                    <CardContent className="p-10">
                      <div className="flex justify-center mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-6 w-6 text-yellow-500 fill-current" />
                        ))}
                      </div>
                      <p className="text-slate-700 text-lg italic leading-relaxed mb-8">"{t.text}"</p>
                      <div className="text-center">
                        <p className="font-semibold text-slate-900 text-lg">{t.name}</p>
                        <p className="text-slate-500">{t.location}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

       {/* Stats Section - Honest & Relatable */}
<section className="py-24 bg-gradient-to-r from-green-600 to-blue-700 text-white">
  <div className="container mx-auto px-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 max-w-5xl mx-auto text-center">
      <div>
        <div className="text-5xl md:text-6xl font-bold mb-4">20+</div>
        <p className="text-xl opacity-90">Daily Trips</p>
      </div>
      <div>
        <div className="text-5xl md:text-6xl font-bold mb-4">1K+</div>
        <p className="text-xl opacity-90">Happy Passengers</p>
      </div>
      <div>
        <div className="text-5xl md:text-6xl font-bold mb-4">8</div>
        <p className="text-xl opacity-90">Modern Buses</p>
      </div>
      <div>
        <div className="text-5xl md:text-6xl font-bold mb-4">24/7</div>
        <p className="text-xl opacity-90">Support</p>
      </div>
    </div>
  </div>
</section>

        {/* Final CTA - Focused & Premium */}
        <section className="py-32 bg-gradient-to-br from-slate-900 to-blue-950 text-white">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="container mx-auto px-6 text-center"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              Begin Your Journey with Confidence
            </h2>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-90">
              Book your ticket today and experience travel redefined.
            </p>
            <Link to="/book">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-16 py-9 text-2xl font-semibold rounded-3xl shadow-2xl hover:shadow-green-600/40 transition-all duration-500 hover:-translate-y-1"
              >
                <Ticket className="mr-4 h-8 w-8" />
                Book Your Ticket
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Footer - Clean & Professional */}
        <footer className="bg-slate-900 text-white py-16">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <Bus className="h-10 w-10 text-green-500" />
                  <span className="text-3xl font-bold">RIDE BUS</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Premium bus travel across Bihar — comfort, safety, and reliability in every journey.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-6">Quick Links</h3>
                <ul className="space-y-3 text-slate-400">
                  <li><Link to="/" className="hover:text-green-400 transition">Home</Link></li>
                  <li><Link to="/about" className="hover:text-green-400 transition">About Us</Link></li>
                  <li><Link to="/services" className="hover:text-green-400 transition">Services</Link></li>
                  <li><Link to="/book" className="hover:text-green-400 transition">Book Tickets</Link></li>
                  <li><Link to="/contact" className="hover:text-green-400 transition">Contact</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-6">Contact</h3>
                <ul className="space-y-4 text-slate-400">
                  <li className="flex items-center gap-3"><Phone className="h-5 w-5" /> +91 98765 43210</li>
                  <li className="flex items-center gap-3"><Mail className="h-5 w-5" /> support@ridebus.in</li>
                  <li className="flex items-center gap-3"><MapPinned className="h-5 w-5" /> Patna, Bihar, India</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-6">Follow Us</h3>
                <div className="flex gap-5">
                  <a href="#" aria-label="Facebook" className="hover:text-green-400 transition"><Facebook className="h-7 w-7" /></a>
                  <a href="#" aria-label="Twitter" className="hover:text-green-400 transition"><Twitter className="h-7 w-7" /></a>
                  <a href="#" aria-label="Instagram" className="hover:text-green-400 transition"><Instagram className="h-7 w-7" /></a>
                  <a href="#" aria-label="YouTube" className="hover:text-green-400 transition"><Youtube className="h-7 w-7" /></a>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
              <p>&copy; 2025 Ride Bus. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}