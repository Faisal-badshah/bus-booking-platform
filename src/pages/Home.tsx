'use client';

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bus, Clock, Shield, Ticket, Award, MapPin, Users, IndianRupee, Menu, X, Facebook, Twitter, Instagram, Youtube, Star, Phone, Mail, MapPinned } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <>
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <Bus className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-black text-slate-900">
                RIDE <span className="text-green-600">BUS</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-slate-700 hover:text-green-600 font-medium transition-colors">Home</Link>
              <Link to="/about" className="text-slate-700 hover:text-green-600 font-medium transition-colors">About</Link>
              <Link to="/services" className="text-slate-700 hover:text-green-600 font-medium transition-colors">Services</Link>
              <Link to="/book" className="text-slate-700 hover:text-green-600 font-medium transition-colors">Book Tickets</Link>
              <Link to="/contact" className="text-slate-700 hover:text-green-600 font-medium transition-colors">Contact</Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost">Login</Button>
              <Button className="bg-green-600 hover:bg-green-700">Sign Up</Button>
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </nav>
      </header>

      <div className="pt-20 min-h-screen bg-gray-50">
        {/* Hero Section with Search Bar */}
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-32 md:py-40 lg:py-48 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAyYy0yLjIxIDAtNCAxLjc5LTQgNHMxLjc5IDQgNCA0IDQtMS43OSA0LTQtMS43OS00LTQtNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container mx-auto px-6 relative z-10"
          >
            <div className="max-w-5xl mx-auto text-center mb-16">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4">
                RIDE <span className="text-green-400">BUS</span>
              </h1>
              <p className="text-2xl sm:text-3xl md:text-4xl font-medium text-green-300 mb-8">
                हर सफर, हर Budget के लिए
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Premium Travel, Affordable Prices
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto opacity-90 leading-relaxed">
                Experience comfortable and safe bus journeys across Bihar. Book your tickets online and travel with confidence on our modern fleet.
              </p>
            </div>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-8 -mt-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <Label htmlFor="from" className="text-slate-700 font-medium">From</Label>
                  <Input id="from" placeholder="e.g. Patna" className="mt-2 h-12 border-gray-300" />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="to" className="text-slate-700 font-medium">To</Label>
                  <Input id="to" placeholder="e.g. Siwan" className="mt-2 h-12 border-gray-300" />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="date" className="text-slate-700 font-medium">Travel Date</Label>
                  <Input id="date" type="date" className="mt-2 h-12 border-gray-300" />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold">
                    <Ticket className="mr-2 h-5 w-5" />
                    Search Buses
                  </Button>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
              <Link to="/book">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 px-10 py-7 text-lg rounded-xl shadow-2xl">
                  <Ticket className="mr-3 h-6 w-6" />
                  Book Tickets Now
                </Button>
              </Link>
            </div>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
        </section>

        {/* Popular Routes Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-16 md:py-20 bg-white"
        >
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
                Popular Routes
              </h2>
              <p className="text-slate-600 text-lg md:text-xl">Direct connections to major cities in Bihar</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                { from: "Siwan", to: "Raxaul" },
                { from: "Siwan", to: "Motihari" },
                { from: "Raxaul", to: "Gopalganj" },
                { from: "Motihari", to: "Gopalganj" },
              ].map((route, idx) => (
                <Card key={idx} className="group hover:shadow-2xl hover:border-green-500 border-2 rounded-2xl transition-all duration-500">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">🚌</div>
                    <p className="text-xl font-bold text-slate-800">{route.from}</p>
                    <div className="flex items-center justify-center my-4">
                      <div className="h-px w-12 bg-gray-300"></div>
                      <MapPin className="h-5 w-5 text-green-500 mx-3" />
                      <div className="h-px w-12 bg-gray-300"></div>
                    </div>
                    <p className="text-xl font-bold text-slate-800">{route.to}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Deals & Offers Section */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-bold text-center text-slate-800 mb-12">Exclusive Deals & Offers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { title: "First Ride Free", desc: "Get ₹200 off on your first booking", code: "RIDEFIRST200" },
                { title: "Weekend Special", desc: "Flat 15% off on all weekend trips", code: "WEEKEND15" },
                { title: "Refer & Earn", desc: "Invite friends and earn ₹100 each", code: "REFER100" },
              ].map((deal, idx) => (
                <Card key={idx} className="bg-white hover:shadow-xl transition-all duration-300 border border-green-200">
                  <CardContent className="p-8 text-center">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Ticket className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">{deal.title}</h3>
                    <p className="text-slate-600 mb-4">{deal.desc}</p>
                    <code className="bg-green-600 text-white px-4 py-2 rounded-lg font-mono">{deal.code}</code>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-20 md:py-28 bg-gray-50"
        >
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6">
                Why Choose Ride Bus?
              </h2>
              <p className="text-slate-600 text-lg md:text-xl">
                We're a B2B2C company delivering premium bus services at prices that fit every budget
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
              {[
                { icon: Bus, color: "from-green-500 to-emerald-600", title: "Modern Fleet", desc: "Travel in comfort with our well-maintained, modern buses equipped with comfortable seating, AC, and essential amenities" },
                { icon: Clock, color: "from-blue-500 to-indigo-600", title: "On-Time Service", desc: "We value your time. Our buses depart and arrive on schedule, ensuring you reach your destination as planned" },
                { icon: Shield, color: "from-purple-500 to-pink-600", title: "Safe & Secure", desc: "Your safety is our top priority. Professional drivers, regular maintenance, and safety checks ensure a secure journey" },
                { icon: IndianRupee, color: "from-orange-500 to-red-600", title: "Affordable Pricing", desc: "Premium service doesn't mean premium prices. We offer competitive rates that fit every budget without compromising quality" },
                { icon: Users, color: "from-teal-500 to-cyan-600", title: "Customer First", desc: "Our dedicated support team is always ready to assist you. Your comfort and satisfaction are what drive us forward" },
                { icon: Award, color: "from-amber-500 to-yellow-600", title: "Trusted Service", desc: "Join thousands of satisfied customers who trust Ride Bus for their daily commute and long-distance travel needs" },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-white hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 rounded-3xl h-full">
                    <CardContent className="p-10">
                      <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center mb-8 shadow-lg`}>
                        <feature.icon className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">{feature.title}</h3>
                      <p className="text-slate-600 leading-relaxed text-base md:text-lg">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-800 mb-12">What Our Passengers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { name: "Rajesh Kumar", location: "Patna", rating: 5, text: "Best bus service in Bihar! Clean buses, punctual timing, and very affordable." },
                { name: "Priya Singh", location: "Siwan", rating: 5, text: "Booking is so easy and the staff is very helpful. Highly recommended!" },
                { name: "Amit Patel", location: "Motihari", rating: 5, text: "Safe and comfortable journey every time. Ride Bus never disappoints." },
              ].map((testimonial, idx) => (
                <Card key={idx} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-6 italic">"{testimonial.text}"</p>
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.location}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-blue-700 text-white">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 max-w-5xl mx-auto text-center">
              <div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-black mb-3">500+</div>
                <p className="text-lg md:text-xl opacity-90">Daily Trips</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-black mb-3">10K+</div>
                <p className="text-lg md:text-xl opacity-90">Happy Customers</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-black mb-3">50+</div>
                <p className="text-lg md:text-xl opacity-90">Modern Buses</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-black mb-3">24/7</div>
                <p className="text-lg md:text-xl opacity-90">Support</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative bg-gradient-to-br from-slate-900 to-blue-950 py-24 md:py-32">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
                Book your tickets now and experience premium travel at affordable prices.
              </p>
              <Link to="/book">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 px-12 py-8 text-2xl rounded-2xl shadow-2xl">
                  <Ticket className="mr-4 h-8 w-8" />
                  Book Your Tickets
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-12">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Bus className="h-8 w-8 text-green-500" />
                  <span className="text-2xl font-bold">RIDE BUS</span>
                </div>
                <p className="text-slate-400">Your trusted partner for comfortable and affordable bus travel across Bihar.</p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                <ul className="space-y-2 text-slate-400">
                  <li><Link to="/" className="hover:text-green-400 transition">Home</Link></li>
                  <li><Link to="/about" className="hover:text-green-400 transition">About Us</Link></li>
                  <li><Link to="/services" className="hover:text-green-400 transition">Services</Link></li>
                  <li><Link to="/book" className="hover:text-green-400 transition">Book Tickets</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Contact Us</h3>
                <ul className="space-y-3 text-slate-400">
                  <li className="flex items-center gap-3"><Phone className="h-4 w-4" /> +91 98765 43210</li>
                  <li className="flex items-center gap-3"><Mail className="h-4 w-4" /> support@ridebus.in</li>
                  <li className="flex items-center gap-3"><MapPinned className="h-4 w-4" /> Patna, Bihar, India</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="#" aria-label="Facebook" className="bg-slate-800 p-3 rounded-full hover:bg-green-600 transition"><Facebook className="h-5 w-5" /></a>
                  <a href="#" aria-label="Twitter" className="bg-slate-800 p-3 rounded-full hover:bg-green-600 transition"><Twitter className="h-5 w-5" /></a>
                  <a href="#" aria-label="Instagram" className="bg-slate-800 p-3 rounded-full hover:bg-green-600 transition"><Instagram className="h-5 w-5" /></a>
                  <a href="#" aria-label="Youtube" className="bg-slate-800 p-3 rounded-full hover:bg-green-600 transition"><Youtube className="h-5 w-5" /></a>
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