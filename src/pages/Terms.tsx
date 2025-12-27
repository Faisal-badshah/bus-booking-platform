'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Globe, Shield, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "hi" : "en"));
  };

  const content = {
    en: {
      title: "Terms & Conditions - Ride Bus",
      description: "Read the terms and conditions governing your use of Ride Bus services. Premium, safe, and reliable bus travel in Bihar.",
      lastUpdated: "Last updated",
      acceptance: "1. Acceptance of Terms",
      acceptanceText: "By accessing and using Ride Bus's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.",
      booking: "2. Booking and Tickets",
      bookingText: "All bookings are subject to availability and confirmation. Once confirmed:",
      bookingList: [
        "You will receive a booking confirmation via email",
        "Tickets are non-transferable",
        "You must present valid identification when boarding",
        "Seat assignments are final unless changed by Ride Bus"
      ],
      cancellation: "3. Cancellation Policy",
      cancellationText: "Cancellations must be requested through your account. Refund terms:",
      cancellationList: [
        "80% refund if cancelled 24 hours before departure",
        "50% refund if cancelled 12-24 hours before departure",
        "No refund if cancelled less than 12 hours before departure",
        "Refunds will be processed within 7-10 business days"
      ],
      passenger: "4. Passenger Responsibilities",
      passengerText: "Passengers are expected to:",
      passengerList: [
        "Arrive at least 15 minutes before departure",
        "Carry valid identification",
        "Follow driver and staff instructions",
        "Respect other passengers and property",
        "Not carry prohibited items (weapons, illegal substances, etc.)"
      ],
      luggage: "5. Luggage Policy",
      luggageText: "Each passenger is allowed one carry-on bag and one checked bag. Additional luggage may incur extra charges. Ride Bus is not responsible for lost or damaged luggage unless due to our negligence.",
      changes: "6. Service Changes",
      changesText: "Ride Bus reserves the right to modify schedules, routes, or cancel services due to circumstances beyond our control (weather, mechanical issues, etc.). In such cases, we will offer alternative arrangements or full refunds.",
      liability: "7. Limitation of Liability",
      liabilityText: "Ride Bus's liability is limited to the ticket price. We are not liable for indirect, consequential, or punitive damages resulting from service delays or cancellations.",
      privacy: "8. Privacy",
      privacyText: "Your use of our services is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.",
      modifications: "9. Modifications to Terms",
      modificationsText: "Ride Bus reserves the right to modify these terms at any time. Changes will be effective immediately upon posting to our website. Continued use of our services constitutes acceptance of modified terms.",
      contact: "10. Contact Information",
      contactText: "For questions about these terms, please contact us at support@ridebus.in or call +91 8084362156.",
      trustMessage: "Transparent Terms · Fair Policies · Your Trust Matters",
      tableOfContents: "Table of Contents",
      backToTop: "Back to Top",
    },
    hi: {
      title: "नियम एवं शर्तें - राइड बस",
      description: "राइड बस सेवाओं के उपयोग को नियंत्रित करने वाले नियम एवं शर्तें पढ़ें। बिहार में प्रीमियम, सुरक्षित और विश्वसनीय बस यात्रा।",
      lastUpdated: "अंतिम अपडेट",
      acceptance: "1. नियमों की स्वीकृति",
      acceptanceText: "राइड बस की सेवाओं का उपयोग करके, आप इन नियमों और प्रावधानों से बंधे होने के लिए सहमत होते हैं। यदि आप इन नियमों से सहमत नहीं हैं, तो कृपया हमारी सेवाओं का उपयोग न करें।",
      booking: "2. बुकिंग और टिकट",
      bookingText: "सभी बुकिंग उपलब्धता और पुष्टि के अधीन हैं। पुष्टि होने के बाद:",
      bookingList: [
        "आपको ईमेल द्वारा बुकिंग पुष्टि प्राप्त होगी",
        "टिकट स्थानांतरणीय नहीं हैं",
        "बोर्डिंग के समय वैध पहचान पत्र प्रस्तुत करना आवश्यक है",
        "सीट आवंटन अंतिम है जब तक राइड बस द्वारा बदला न जाए"
      ],
      cancellation: "3. रद्दीकरण नीति",
      cancellationText: "रद्दीकरण आपके अकाउंट के माध्यम से अनुरोध करना होगा। रिफंड शर्तें:",
      cancellationList: [
        "प्रस्थान से 24 घंटे पहले रद्द करने पर 80% रिफंड",
        "प्रस्थान से 12-24 घंटे पहले रद्द करने पर 50% रिफंड",
        "प्रस्थान से 12 घंटे से कम समय में रद्द करने पर कोई रिफंड नहीं",
        "रिफंड 7-10 कार्य दिवसों में संसाधित किया जाएगा"
      ],
      passenger: "4. यात्री की जिम्मेदारियां",
      passengerText: "यात्रियों से अपेक्षा की जाती है कि वे:",
      passengerList: [
        "प्रस्थान से कम से कम 15 मिनट पहले पहुंचें",
        "वैध पहचान पत्र साथ रखें",
        "ड्राइवर और स्टाफ के निर्देशों का पालन करें",
        "अन्य यात्रियों और संपत्ति का सम्मान करें",
        "निषिद्ध वस्तुएं (हथियार, अवैध पदार्थ आदि) न ले जाएं"
      ],
      luggage: "5. सामान नीति",
      luggageText: "प्रत्येक यात्री को एक हैंड बैग और एक चेकेड बैग की अनुमति है। अतिरिक्त सामान के लिए अतिरिक्त शुल्क लग सकता है। हमारी लापरवाही के अलावा खोए या क्षतिग्रस्त सामान के लिए राइड बस जिम्मेदार नहीं है।",
      changes: "6. सेवा परिवर्तन",
      changesText: "राइड बस को हमारे नियंत्रण से बाहर की परिस्थितियों (मौसम, यांत्रिक समस्याएं आदि) के कारण शेड्यूल, रूट या सेवाएं रद्द करने का अधिकार सुरक्षित है। ऐसे मामलों में हम वैकल्पिक व्यवस्था या पूर्ण रिफंड प्रदान करेंगे।",
      liability: "7. दायित्व की सीमा",
      liabilityText: "राइड बस का दायित्व टिकट मूल्य तक सीमित है। सेवा विलंब या रद्दीकरण से होने वाले अप्रत्यक्ष, परिणामी या दंडात्मक नुकसान के लिए हम जिम्मेदार नहीं हैं।",
      privacy: "8. गोपनीयता",
      privacyText: "हमारी सेवाओं का उपयोग हमारी गोपनीयता नीति द्वारा भी शासित है। कृपया हमारी प्रथाओं को समझने के लिए गोपनीयता नीति की समीक्षा करें।",
      modifications: "9. नियमों में संशोधन",
      modificationsText: "राइड बस को किसी भी समय इन नियमों को संशोधित करने का अधिकार सुरक्षित है। परिवर्तन हमारी वेबसाइट पर पोस्ट करने पर तुरंत प्रभावी होंगे। सेवाओं का निरंतर उपयोग संशोधित नियमों की स्वीकृति माना जाएगा।",
      contact: "10. संपर्क जानकारी",
      contactText: "इन नियमों के बारे में प्रश्नों के लिए कृपया support@ridebus.in पर संपर्क करें या +91 8084362156 पर कॉल करें।",
      trustMessage: "पारदर्शी नियम · निष्पक्ष नीतियां · आपका भरोसा महत्वपूर्ण है",
      tableOfContents: "विषय सूची",
      backToTop: "ऊपर जाएं",
    }
  }[language];

  const sections = [
    { key: "acceptance", label: content.acceptance },
    { key: "booking", label: content.booking },
    { key: "cancellation", label: content.cancellation },
    { key: "passenger", label: content.passenger },
    { key: "luggage", label: content.luggage },
    { key: "changes", label: content.changes },
    { key: "liability", label: content.liability },
    { key: "privacy", label: content.privacy },
    { key: "modifications", label: content.modifications },
    { key: "contact", label: content.contact },
  ];

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
        <meta name="keywords" content="ride bus terms and conditions, bus booking terms Bihar, premium bus travel policy, cancellation policy, passenger rules, ride bus legal" />
        <meta property="og:title" content={content.title} />
        <meta property="og:description" content={content.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ridebus.in/terms" />
        <link rel="canonical" href="https://ridebus.in/terms" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Terms & Conditions - Ride Bus",
            "description": content.description,
            "url": "https://ridebus.in/terms",
            "publisher": {
              "@type": "Organization",
              "name": "Ride Bus"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen py-12 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            {/* Header */}
            <header className="flex items-center justify-between mb-8" aria-labelledby="terms-heading">
              <h1 id="terms-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                Terms & Conditions
              </h1>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleLanguage} 
                aria-label={language === "en" ? "Switch to Hindi" : "Switch to English"}
                className="rounded-full focus-visible:ring-2 focus-visible:ring-green-600"
              >
                <Globe className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{language === "en" ? "हिंदी" : "English"}</span>
              </Button>
            </header>

            <p className="text-sm text-muted-foreground text-center mb-4">
              {content.lastUpdated}: {new Date().toLocaleDateString()}
            </p>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground flex items-center gap-2 mb-12 justify-center"
            >
              <Shield className="h-4 w-4 text-green-600" aria-hidden="true" />
              {content.trustMessage}
            </motion.p>

            {/* Desktop Table of Contents */}
            <div className="hidden lg:block fixed left-8 top-32 w-64 h-[calc(100vh-8rem)] overflow-y-auto">
              <Card className="sticky top-8 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{content.tableOfContents}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav aria-label="Table of contents">
                    <ul className="space-y-2 py-2">
                      {sections.map((section) => (
                        <li key={section.key}>
                          <a 
                            href={`#section-${section.key}`}
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition"
                          >
                            {section.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Table of Contents */}
            <div className="lg:hidden mb-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{content.tableOfContents}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-48">
                    <nav aria-label="Table of contents">
                      <ul className="space-y-1 py-2">
                        {sections.map((section) => (
                          <li key={section.key}>
                            <a 
                              href={`#section-${section.key}`}
                              className="block px-4 py-2 text-sm text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition"
                            >
                              {section.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                       </nav>
                    </ScrollArea>  
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <main className="lg:ml-72">
              <Card className="shadow-xl border-none bg-card">
                <CardContent className="pt-8 space-y-16">
                  {sections.map((section, sectionIdx) => (
                    <motion.section
                      key={section.key}
                      id={`section-${section.key}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: sectionIdx * 0.1 }}
                    >
                      <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-foreground scroll-mt-32">
                        {section.label}
                      </h2>
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                        {content[`${section.key}Text`]}
                      </p>
                      {content[`${section.key}List`] && (
                        <ul className="space-y-4 pl-8">
                          {content[`${section.key}List`].map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-4 text-base sm:text-lg text-muted-foreground">
                              <span className="text-green-600 mt-1.5 flex-shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.section>
                  ))}
                </CardContent>
              </Card>

              {/* Back to Top */}
              <div className="flex justify-center mt-12">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="gap-2"
                >
                  <ChevronUp className="h-5 w-5" />
                  {content.backToTop}
                </Button>
              </div>
            </main>
          </motion.div>
        </div>
      </div>
    </>
  );
}