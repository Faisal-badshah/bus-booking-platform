'use client';

import { useState } from "react";
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
  X,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Star,
  Phone,
  Mail,
  MapPinned,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "hi" : "en"));
  };

  const content = {
    en: {
      title: "RIDE BUS - Premium Bus Travel in Bihar",
      description: "Experience comfortable, safe, and reliable bus journeys across Bihar. Book your tickets online with confidence.",
      heroTagline: "Premium Travel, Affordable Prices",
      heroDesc: "Experience comfortable, safe, and reliable bus journeys across Bihar with our modern fleet and exceptional service.",
      ctaBook: "Book Tickets Now",
      popularRoutes: "Popular Routes",
      whyChoose: "Why Choose Ride Bus?",
      whyDesc: "Premium service crafted with care for every passenger",
      features: [
        { icon: Bus, color: "from-green-500 to-emerald-600", title: "Modern Fleet", desc: "Well-maintained luxury buses with AC, comfortable seating, and onboard amenities." },
        { icon: Clock, color: "from-blue-500 to-indigo-600", title: "On-Time Service", desc: "Reliable schedules ensuring you reach your destination as planned." },
        { icon: Shield, color: "from-purple-500 to-pink-600", title: "Safe & Secure", desc: "Professional drivers and rigorous safety standards for peace of mind." },
        { icon: IndianRupee, color: "from-orange-500 to-red-600", title: "Affordable Pricing", desc: "Premium experience at prices designed for every budget." },
        { icon: Users, color: "from-teal-500 to-cyan-600", title: "Customer First", desc: "Dedicated support team available to assist you at every step." },
        { icon: Award, color: "from-amber-500 to-yellow-600", title: "Trusted Excellence", desc: "Serving thousands of satisfied travelers across Bihar." },
      ],
      passengerStories: "Passenger Stories",
      testimonials: [
        { name: "Rajesh Kumar", location: "Patna", text: "Exceptional service. Clean, comfortable, and always on time. Ride Bus is my only choice for travel in Bihar." },
        { name: "Priya Singh", location: "Siwan", text: "Smooth booking process and excellent customer support. The journey felt premium yet affordable." },
        { name: "Amit Patel", location: "Motihari", text: "Safe, reliable, and professional. I trust Ride Bus for all my family trips." },
      ],
      stats: [
        { value: "20+", label: "Daily Trips" },
        { value: "1K+", label: "Happy Passengers" },
        { value: "8", label: "Modern Buses" },
        { value: "24/7", label: "Support" },
      ],
      finalCtaTitle: "Begin Your Journey with Confidence",
      finalCtaDesc: "Book your ticket today and experience travel redefined.",
      finalCtaButton: "Book Your Ticket",
      trustMessage: "Secure Booking · Full Refund Policy · Trusted by Locals",
      footerBrandDesc: "Premium bus travel across Bihar — comfort, safety, and reliability in every journey.",
      footerQuickLinks: "Quick Links",
      footerContact: "Contact",
      footerFollow: "Follow Us",
      footerCopyright: "© 2025 Ride Bus. All rights reserved.",
    },
    hi: {
      title: "राइड बस - बिहार में प्रीमियम बस यात्रा",
      description: "बिहार में आरामदायक, सुरक्षित और विश्वसनीय बस यात्राओं का अनुभव करें। आत्मविश्वास के साथ ऑनलाइन टिकट बुक करें।",
      heroTagline: "प्रीमियम यात्रा, किफायती कीमतें",
      heroDesc: "हमारी आधुनिक फ्लीट और उत्कृष्ट सेवा के साथ बिहार में आरामदायक, सुरक्षित और विश्वसनीय बस यात्राओं का अनुभव करें।",
      ctaBook: "टिकट बुक करें",
      popularRoutes: "लोकप्रिय रूट्स",
      whyChoose: "राइड बस क्यों चुनें?",
      whyDesc: "हर यात्री के लिए देखभाल से तैयार की गई प्रीमियम सेवा",
      features: [
        { icon: Bus, color: "from-green-500 to-emerald-600", title: "आधुनिक फ्लीट", desc: "आरामदायक सीटिंग, एसी और ऑनबोर्ड सुविधाओं वाली अच्छी तरह रखरखाव वाली लक्जरी बसें।" },
        { icon: Clock, color: "from-blue-500 to-indigo-600", title: "समय पर सेवा", desc: "विश्वसनीय शेड्यूल जो सुनिश्चित करता है कि आप अपने गंतव्य पर योजनानुसार पहुंचें।" },
        { icon: Shield, color: "from-purple-500 to-pink-600", title: "सुरक्षित और सुरक्षित", desc: "शांति के लिए पेशेवर ड्राइवर और कठोर सुरक्षा मानक।" },
        { icon: IndianRupee, color: "from-orange-500 to-red-600", title: "किफायती मूल्य", desc: "हर बजट के लिए डिज़ाइन की गई कीमतों पर प्रीमियम अनुभव।" },
        { icon: Users, color: "from-teal-500 to-cyan-600", title: "ग्राहक पहले", desc: "हर कदम पर आपकी सहायता के लिए समर्पित टीम।" },
        { icon: Award, color: "from-amber-500 to-yellow-600", title: "विश्वसनीय उत्कृष्टता", desc: "बिहार में हजारों संतुष्ट यात्रियों की सेवा।" },
      ],
      passengerStories: "यात्री कहानियां",
      testimonials: [
        { name: "राजेश कुमार", location: "पटना", text: "उत्कृष्ट सेवा। साफ-सुथरी, आरामदायक और हमेशा समय पर। बिहार यात्रा के लिए राइड बस मेरी पहली पसंद है।" },
        { name: "प्रिया सिंह", location: "सिवान", text: "आसान बुकिंग और बेहतरीन सहायता। यात्रा प्रीमियम लगी लेकिन कीमत उचित।" },
        { name: "अमित पटेल", location: "मोतिहारी", text: "सुरक्षित, विश्वसनीय और पेशेवर। परिवार की सभी यात्राओं के लिए राइड बस पर भरोसा।" },
      ],
      stats: [
        { value: "20+", label: "दैनिक यात्राएं" },
        { value: "1K+", label: "खुश यात्री" },
        { value: "8", label: "आधुनिक बसें" },
        { value: "24/7", label: "समर्थन" },
      ],
      finalCtaTitle: "विश्वास के साथ अपनी यात्रा शुरू करें",
      finalCtaDesc: "आज ही टिकट बुक करें और यात्रा को नया आयाम दें।",
      finalCtaButton: "अपना टिकट बुक करें",
      trustMessage: "सुरक्षित बुकिंग · पूरा रिफंड · स्थानीय लोगों का भरोसा",
      footerBrandDesc: "बिहार में प्रीमियम बस यात्रा — हर सफर में आराम, सुरक्षा और विश्वसनीयता।",
      footerQuickLinks: "त्वरित लिंक",
      footerContact: "संपर्क करें",
      footerFollow: "हमसे जुड़ें",
      footerCopyright: "© 2025 राइड बस। सभी अधिकार सुरक्षित।",
    },
  }[language];

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
        <meta name="keywords" content="bus booking Bihar, premium bus travel, safe bus journey Bihar, Ride Bus" />
        <meta property="og:title" content={content.title} />
        <meta property="og:description" content={content.description} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <nav className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-4">
              <Bus className="h-10 w-10 text-green-600" aria-hidden="true" />
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                RIDE <span className="text-green-600">BUS</span>
              </span>
            </Link>

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

            <div className="hidden md:flex items-center gap-5">
              <Button variant="ghost" size="sm" className="font-medium">
                Login
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white font-medium" size="sm">
                Sign Up
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle Language">
                <Globe className="h-5 w-5" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      <motion.div
        initial={false}
        animate={isMobileMenuOpen ? "open" : "closed"}
        variants={{
          open: { x: 0 },
          closed: { x: "100%" },
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 right-0 h-full w-3/4 bg-white z-50 md:hidden overflow-y-auto"
      >
        <div className="p-6">
          <Button variant="ghost" size="icon" className="mb-8" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close Menu">
            <X className="h-6 w-6" />
          </Button>
          <nav className="flex flex-col gap-6">
            <Link to="/" className="text-slate-600 hover:text-green-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/about" className="text-slate-600 hover:text-green-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              About
            </Link>
            <Link to="/services" className="text-slate-600 hover:text-green-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              Services
            </Link>
            <Link to="/book" className="text-slate-600 hover:text-green-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              Book Tickets
            </Link>
            <Link to="/contact" className="text-slate-600 hover:text-green-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>
            <Button variant="ghost" className="font-medium">
              Login
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-medium">
              Sign Up
            </Button>
            <Button variant="ghost" onClick={toggleLanguage} className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {language === "en" ? "हिंदी" : "English"}
            </Button>
          </nav>
        </div>
      </motion.div>

      {/* Overlay for Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="pt-24 bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-40 lg:py-52 overflow-hidden" style={{ backgroundImage: "url('https://assets.volvo.com/is/image/VolvoInformationTechnologyAB/Interior-bus?qlt=82&wid=1920&fit=constrain')", backgroundBlendMode: "multiply", backgroundSize: "cover" }}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2sy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAyYy0yLjIxIDAtNCAxLjc5LTQgNHMxLjc5IDQgNCA0IDQtMS43OSA0LTQtMS43OS00LTQtNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA0Ii8+PC9nPjwvc3ZnPg==')] opacity-10"></div>

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
                {content.heroTagline}
              </p>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90 leading-relaxed mb-16">
                {content.heroDesc}
              </p>

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
                    {content.ctaBook}
                  </Button>
                </Link>
              </motion.div>
              <p className="mt-6 text-sm opacity-70">
                {content.trustMessage}
              </p>
            </div>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-50 to-transparent" />
        </section>

        {/* Popular Routes */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="py-32 bg-white"
        >
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-800 mb-16">
              {content.popularRoutes}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 max-w-7xl mx-auto">
              {[
                { from: "Siwan", to: "Raxaul" },
                { from: "Siwan", to: "Motihari" },
                { from: "Raxaul", to: "Gopalganj" },
                { from: "Motihari", to: "Gopalganj" },
              ].map((route, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center"
                >
                  <div className="text-6xl mb-6 text-green-600">
                    🚌
                  </div>
                  <p className="text-2xl font-semibold text-slate-800 mb-3">{route.from}</p>
                  <div className="flex items-center justify-center my-4 opacity-80">
                    <div className="h-px w-20 bg-gray-300"></div>
                    <MapPin className="h-5 w-5 text-green-600 mx-4" />
                    <div className="h-px w-20 bg-gray-300"></div>
                  </div>
                  <p className="text-2xl font-semibold text-slate-800">{route.to}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-32 bg-gray-50"
        >
          <div className="container mx-auto px-6">
            <div className="text-center mb-20 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6">
                {content.whyChoose}
              </h2>
              <p className="text-xl text-slate-600">
                {content.whyDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
              {content.features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-3xl h-full">
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

        {/* Testimonials */}
        <section className="py-32 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-800 mb-16">
              {content.passengerStories}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
              {content.testimonials.map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-xl transition-shadow duration-300 h-full">
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

        {/* Stats */}
        <section className="py-28 bg-gradient-to-r from-green-600 to-blue-700 text-white">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 max-w-5xl mx-auto text-center">
              {content.stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="text-5xl md:text-6xl font-bold mb-4">{stat.value}</div>
                  <p className="text-xl opacity-90">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-gradient-to-br from-slate-900 to-blue-950 text-white">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="container mx-auto px-6 text-center"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              {content.finalCtaTitle}
            </h2>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-90">
              {content.finalCtaDesc}
            </p>
            <Link to="/book">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-16 py-9 text-2xl font-semibold rounded-3xl shadow-2xl hover:shadow-green-600/40 transition-all duration-500 hover:-translate-y-1"
              >
                <Ticket className="mr-4 h-8 w-8" />
                {content.finalCtaButton}
              </Button>
            </Link>
            <p className="mt-6 text-sm opacity-70">
              {content.trustMessage}
            </p>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-16">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <Bus className="h-10 w-10 text-green-500" />
                  <span className="text-3xl font-bold">RIDE BUS</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {content.footerBrandDesc}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-6">{content.footerQuickLinks}</h3>
                <ul className="space-y-3 text-slate-400">
                  <li><Link to="/" className="hover:text-green-400 transition">Home</Link></li>
                  <li><Link to="/about" className="hover:text-green-400 transition">About Us</Link></li>
                  <li><Link to="/services" className="hover:text-green-400 transition">Services</Link></li>
                  <li><Link to="/book" className="hover:text-green-400 transition">Book Tickets</Link></li>
                  <li><Link to="/contact" className="hover:text-green-400 transition">Contact</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-6">{content.footerContact}</h3>
                <ul className="space-y-4 text-slate-400">
                  <li className="flex items-center gap-3"><Phone className="h-5 w-5" /> +91 98765 43210</li>
                  <li className="flex items-center gap-3"><Mail className="h-5 w-5" /> support@ridebus.in</li>
                  <li className="flex items-center gap-3"><MapPinned className="h-5 w-5" /> Patna, Bihar, India</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-6">{content.footerFollow}</h3>
                <div className="flex gap-5">
                  <a href="#" aria-label="Facebook" className="hover:text-green-400 transition"><Facebook className="h-7 w-7" /></a>
                  <a href="#" aria-label="Twitter" className="hover:text-green-400 transition"><Twitter className="h-7 w-7" /></a>
                  <a href="#" aria-label="Instagram" className="hover:text-green-400 transition"><Instagram className="h-7 w-7" /></a>
                  <a href="#" aria-label="YouTube" className="hover:text-green-400 transition"><Youtube className="h-7 w-7" /></a>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
              <p>{content.footerCopyright}</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}