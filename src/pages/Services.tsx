'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign, Wifi, AirVent, Armchair, Plug, Coffee, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useLanguage } from '../context/LanguageContext';

export default function Services() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Our Services - Ride Bus",
      description: "Explore premium bus services across Bihar with modern amenities, reliable schedules, and affordable prices.",
      ourServices: "Our Services",
      exploreText: "Explore our routes, timings, and fares. We offer comfortable bus services connecting major cities with modern amenities and affordable prices.",
      availableRoutes: "Available Routes",
      onboardAmenities: "Onboard Amenities",
      amenitiesDesc: "Enjoy these premium features on all our buses",
      comfortableSeating: "Comfortable Seating",
      seatingDesc: "Spacious, reclining seats with ample legroom for a relaxed journey",
      climateControl: "Climate Control",
      climateDesc: "Fully air-conditioned buses maintain comfortable temperatures",
      entertainment: "Entertainment",
      entertainmentDesc: "Free WiFi and charging ports to keep you connected",
      safetyFirst: "Safety First",
      safetyDesc: "Professional drivers and regular vehicle maintenance",
      luggageSpace: "Luggage Space",
      luggageDesc: "Generous storage space for your belongings",
      restStops: "Rest Stops",
      restDesc: "Scheduled breaks on longer routes for your convenience",
      trustMessage: "Premium Comfort · Reliable Service · Trusted Travel",
    },
    hi: {
      title: "हमारी सेवाएं - राइड बस",
      description: "बिहार में आधुनिक सुविधाओं, विश्वसनीय शेड्यूल और किफायती कीमतों के साथ प्रीमियम बस सेवाओं का अन्वेषण करें।",
      ourServices: "हमारी सेवाएं",
      exploreText: "हमारे रूट, समय और किराए देखें। हम प्रमुख शहरों को जोड़ने वाली आरामदायक बस सेवाएं प्रदान करते हैं जिसमें आधुनिक सुविधाएं और किफायती कीमतें हैं।",
      availableRoutes: "उपलब्ध रूट्स",
      onboardAmenities: "ऑनबोर्ड सुविधाएं",
      amenitiesDesc: "हमारी सभी बसों पर इन प्रीमियम सुविधाओं का आनंद लें",
      comfortableSeating: "आरामदायक सीटिंग",
      seatingDesc: "आरामदायक यात्रा के लिए पर्याप्त लेग रूम वाली विशाल, रिक्लाइनिंग सीटें",
      climateControl: "जलवायु नियंत्रण",
      climateDesc: "आरामदायक तापमान बनाए रखने के लिए पूर्ण वातानुकूलित बसें",
      entertainment: "मनोरंजन",
      entertainmentDesc: "कनेक्टेड रहने के लिए मुफ्त वाईफाई और चार्जिंग पोर्ट",
      safetyFirst: "सुरक्षा पहले",
      safetyDesc: "पेशेवर ड्राइवर और नियमित वाहन रखरखाव",
      luggageSpace: "सामान स्थान",
      luggageDesc: "आपके सामान के लिए पर्याप्त भंडारण स्थान",
      restStops: "विश्राम स्टॉप",
      restDesc: "लंबी दूरी के रूट पर आपकी सुविधा के लिए निर्धारित ब्रेक",
      trustMessage: "प्रीमियम आराम · विश्वसनीय सेवा · विश्वसनीय यात्रा",
    }
  }[language];

  const routes = [
    {
      name: language === "en" ? "Route 1: Siwan - Raxaul" : "रूट 1: सिवान - रक्सौल",
      from: language === "en" ? "Siwan" : "सिवान",
      to: language === "en" ? "Raxaul" : "रक्सौल",
      duration: "4-5 hours",
      frequency: language === "en" ? "Multiple daily" : "कई दैनिक",
      price: "₹450",
      features: language === "en" ? ["WiFi", "AC", "Reclining Seats", "USB Charging"] : ["वाईफाई", "एसी", "रिक्लाइनिंग सीटें", "यूएसबी चार्जिंग"],
    },
    {
      name: language === "en" ? "Route 2: Siwan - Motihari" : "रूट 2: सिवान - मोतिहारी",
      from: language === "en" ? "Siwan" : "सिवान",
      to: language === "en" ? "Motihari" : "मोतिहारी",
      duration: "3-4 hours",
      frequency: language === "en" ? "Every 2-3 hours" : "हर 2-3 घंटे में",
      price: "₹350",
      features: language === "en" ? ["WiFi", "AC", "Reclining Seats", "USB Charging"] : ["वाईफाई", "एसी", "रिक्लाइनिंग सीटें", "यूएसबी चार्जिंग"],
    },
    {
      name: language === "en" ? "Route 3: Raxaul - Gopalganj" : "रूट 3: रक्सौल - गोपालगंज",
      from: language === "en" ? "Raxaul" : "रक्सौल",
      to: language === "en" ? "Gopalganj" : "गोपालगंज",
      duration: "5-6 hours",
      frequency: language === "en" ? "Daily services" : "दैनिक सेवाएं",
      price: "₹550",
      features: language === "en" ? ["WiFi", "AC", "Full Recline", "USB Charging", "Snacks"] : ["वाईफाई", "एसी", "पूर्ण रिक्लाइन", "यूएसबी चार्जिंग", "नाश्ता"],
    },
  ];

  const amenities = [
    { icon: Armchair, title: content.comfortableSeating, desc: content.seatingDesc },
    { icon: AirVent, title: content.climateControl, desc: content.climateDesc },
    { icon: Wifi, title: content.entertainment, desc: content.entertainmentDesc },
    { icon: Shield, title: content.safetyFirst, desc: content.safetyDesc },
    { icon: Coffee, title: content.luggageSpace, desc: content.luggageDesc },
    { icon: MapPin, title: content.restStops, desc: content.restDesc },
  ];

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
      </Helmet>

      <div className="min-h-screen py-12 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-center text-foreground">{content.ourServices}</h1>
            <p className="text-lg sm:text-xl text-muted-foreground text-center mb-12 max-w-3xl mx-auto">{content.exploreText}</p>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground flex items-center gap-2 mb-12 justify-center"
            >
              <Shield className="h-4 w-4 text-green-600" />
              {content.trustMessage}
            </motion.p>

            {/* Available Routes */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">{content.availableRoutes}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {routes.map((route, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-xl">{route.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-base">
                          <MapPin className="h-5 w-5" />
                          {route.from} → {route.to}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-5 w-5" />
                            <span>{route.duration}</span>
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {route.price}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-3">{language === "en" ? "Frequency:" : "आवृत्ति:"} {route.frequency}</p>
                          <div className="flex flex-wrap gap-2">
                            {route.features.map((feature, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs px-3 py-1">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Onboard Amenities */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="shadow-2xl border-none bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30">
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl">{content.onboardAmenities}</CardTitle>
                  <CardDescription className="text-base">{content.amenitiesDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {amenities.map((amenity, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-4"
                      >
                        <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                          <amenity.icon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{amenity.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{amenity.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          </motion.div>
        </div>
      </div>
    </>
  );
}