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
  Star,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

export default function Home() {
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
      trustBadges: "Our Commitments",
      badges: [
        { icon: Shield, title: "Safety First", desc: "Rigorous checks and professional staff" },
        { icon: CheckCircle, title: "Verified Service", desc: "Trusted by thousands" },
        { icon: Users, title: "Passenger Care", desc: "Your comfort is our priority" },
      ],
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
      trustBadges: "हमारी प्रतिबद्धताएं",
      badges: [
        { icon: Shield, title: "सुरक्षा पहले", desc: "कठोर जांच और पेशेवर स्टाफ" },
        { icon: CheckCircle, title: "सत्यापित सेवा", desc: "हजारों का भरोसा" },
        { icon: Users, title: "यात्री देखभाल", desc: "आपका आराम हमारी प्राथमिकता" },
      ],
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

      {/* Main Content - Removed custom navbar to avoid override, relying on global Navbar */}
      <div className="bg-white dark:bg-slate-900">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 text-slate-900 dark:text-slate-200 py-32 lg:py-48 overflow-hidden" style={{ backgroundImage: "url('https://assets.volvo.com/is/image/VolvoInformationTechnologyAB/Interior-bus?qlt=82&wid=1920&fit=constrain')", backgroundBlendMode: "soft-light", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="absolute inset-0 bg-white/5 dark:bg-black/5"></div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="container mx-auto px-4 relative z-10"
          >
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-4">
                RIDE <span className="text-green-600 dark:text-green-400">BUS</span>
              </h1>
              <p className="text-xl sm:text-2xl font-light text-slate-700 dark:text-slate-300 mb-6 tracking-wide">
                {content.heroTagline}
              </p>
              <p className="text-lg md:text-xl max-w-2xl mx-auto text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
                {content.heroDesc}
              </p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
              >
                <Link to="/book">
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-8 py-6 text-lg font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Ticket className="mr-2 h-5 w-5" />
                    {content.ctaBook}
                  </Button>
                </Link>
              </motion.div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
                {content.trustMessage}
              </p>
            </div>
          </motion.div>
        </section>

        {/* Trust Badges Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-16 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-center text-slate-800 dark:text-slate-200 mb-12">
              {content.trustBadges}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {content.badges.map((badge, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4, ease: "easeOut" }}
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <badge.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">{badge.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-base">{badge.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Popular Routes */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-24 bg-gray-50 dark:bg-slate-800"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-center text-slate-800 dark:text-slate-200 mb-12">
              {content.popularRoutes}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 max-w-6xl mx-auto">
              {[
                { from: "Siwan", to: "Raxaul" },
                { from: "Siwan", to: "Motihari" },
                { from: "Raxaul", to: "Gopalganj" },
                { from: "Motihari", to: "Gopalganj" },
              ].map((route, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4, ease: "easeOut" }}
                  className="text-center"
                >
                  <div className="text-4xl mb-4 text-green-600 dark:text-green-400">
                    🚌
                  </div>
                  <p className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">{route.from}</p>
                  <div className="flex items-center justify-center my-2 opacity-70">
                    <div className="h-px w-12 bg-gray-200 dark:bg-slate-600"></div>
                    <MapPin className="h-4 w-4 text-green-600 dark:text-green-400 mx-2" />
                    <div className="h-px w-12 bg-gray-200 dark:bg-slate-600"></div>
                  </div>
                  <p className="text-xl font-medium text-slate-800 dark:text-slate-200">{route.to}</p>
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
          className="py-24 bg-white dark:bg-slate-900"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                {content.whyChoose}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {content.whyDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {content.features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4, ease: "easeOut" }}
                >
                  <Card className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg h-full">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-md`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Testimonials */}
        <section className="py-24 bg-gray-50 dark:bg-slate-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-center text-slate-800 dark:text-slate-200 mb-12">
              {content.passengerStories}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {content.testimonials.map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4, ease: "easeOut" }}
                >
                  <Card className="border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300 h-full rounded-lg bg-white dark:bg-slate-900">
                    <CardContent className="p-6">
                      <div className="flex justify-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-base italic leading-relaxed mb-6">"{t.text}"</p>
                      <div className="text-center">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{t.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">{t.location}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 max-w-4xl mx-auto text-center">
              {content.stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4, ease: "easeOut" }}
                >
                  <div className="text-4xl font-semibold mb-2 text-green-600 dark:text-green-400">{stat.value}</div>
                  <p className="text-base text-slate-600 dark:text-slate-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gray-50 dark:bg-slate-800">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="container mx-auto px-4 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
              {content.finalCtaTitle}
            </h2>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
              {content.finalCtaDesc}
            </p>
            <Link to="/book">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-8 py-6 text-lg font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Ticket className="mr-2 h-5 w-5" />
                {content.finalCtaButton}
              </Button>
            </Link>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
              {content.trustMessage}
            </p>
          </motion.div>
        </section>
      </div>
    </>
  );
}