'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Globe, Shield, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Privacy() {
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "hi" : "en"));
  };

  const content = {
    en: {
      title: "Privacy Policy - Ride Bus",
      description: "Read our privacy policy to understand how Ride Bus handles your personal information. Committed to data protection and transparency for premium bus travel in Bihar.",
      lastUpdated: "Last updated",
      collect: "1. Information We Collect",
      collectText: "We collect information that you provide directly to us, including:",
      collectList: [
        "Name, email address, and phone number",
        "Payment information (processed securely by our payment partners)",
        "Travel preferences and booking history",
        "Communication preferences",
        "Device and usage information"
      ],
      use: "2. How We Use Your Information",
      useText: "We use the information we collect to:",
      useList: [
        "Process your bookings and provide our services",
        "Send you booking confirmations and updates",
        "Respond to your inquiries and provide customer support",
        "Improve our services and develop new features",
        "Send you promotional communications (with your consent)",
        "Comply with legal obligations"
      ],
      sharing: "3. Information Sharing",
      sharingText: "We may share your information with:",
      sharingList: [
        "Service providers who assist in our operations (payment processors, hosting services)",
        "Business partners for legitimate purposes",
        "Law enforcement when required by law",
        "Other parties with your consent"
      ],
      sharingNote: "We do not sell your personal information to third parties.",
      security: "4. Data Security",
      securityText: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.",
      rights: "5. Your Rights",
      rightsText: "You have the right to:",
      rightsList: [
        "Access your personal information",
        "Correct inaccurate information",
        "Request deletion of your information",
        "Object to processing of your information",
        "Request data portability",
        "Withdraw consent for marketing communications"
      ],
      cookies: "6. Cookies and Tracking",
      cookiesText: "We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookies through your browser settings.",
      children: "7. Children's Privacy",
      childrenText: "Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.",
      retention: "8. Data Retention",
      retentionText: "We retain your personal information for as long as necessary to provide our services and comply with legal obligations. When no longer needed, we will securely delete or anonymize your information.",
      transfers: "9. International Transfers",
      transfersText: "Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.",
      changes: "10. Changes to This Policy",
      changesText: "We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our website and updating the \"Last updated\" date.",
      contact: "11. Contact Us",
      contactText: "If you have questions about this Privacy Policy or our data practices, please contact us at:",
      contactInfo: "Email: support@ridebus.in\nPhone: +91 8084362156\nAddress: Patna, Bihar, India",
      trustMessage: "Your Privacy Matters · Data Protected · Transparent Practices",
      tableOfContents: "Table of Contents",
      backToTop: "Back to Top",
    },
    hi: {
      title: "गोपनीयता नीति - राइड बस",
      description: "राइड बस आपकी व्यक्तिगत जानकारी कैसे हैंडल करता है, यह समझने के लिए हमारी गोपनीयता नीति पढ़ें। बिहार में प्रीमियम बस यात्रा के लिए डेटा सुरक्षा और पारदर्शिता के लिए प्रतिबद्ध।",
      lastUpdated: "अंतिम अपडेट",
      collect: "1. हम कौन सी जानकारी एकत्र करते हैं",
      collectText: "हम आपके द्वारा सीधे प्रदान की गई जानकारी एकत्र करते हैं, जिसमें शामिल हैं:",
      collectList: [
        "नाम, ईमेल पता और फोन नंबर",
        "भुगतान जानकारी (हमारे भुगतान भागीदारों द्वारा सुरक्षित रूप से संसाधित)",
        "यात्रा प्राथमिकताएं और बुकिंग इतिहास",
        "संचार प्राथमिकताएं",
        "डिवाइस और उपयोग जानकारी"
      ],
      use: "2. हम आपकी जानकारी का उपयोग कैसे करते हैं",
      useText: "हम एकत्रित जानकारी का उपयोग निम्नलिखित के लिए करते हैं:",
      useList: [
        "आपकी बुकिंग्स संसाधित करना और सेवाएं प्रदान करना",
        "आपको बुकिंग पुष्टिकरण और अपडेट भेजना",
        "आपकी पूछताछ का जवाब देना और ग्राहक सहायता प्रदान करना",
        "हमारी सेवाओं को सुधारना और नई सुविधाएं विकसित करना",
        "आपकी सहमति से प्रचार संचार भेजना",
        "कानूनी दायित्वों का पालन करना"
      ],
      sharing: "3. जानकारी साझाकरण",
      sharingText: "हम आपकी जानकारी निम्नलिखित के साथ साझा कर सकते हैं:",
      sharingList: [
        "हमारे संचालन में सहायता करने वाले सेवा प्रदाता (भुगतान प्रोसेसर, होस्टिंग सेवाएं)",
        "वैध उद्देश्यों के लिए व्यापार भागीदार",
        "कानून द्वारा आवश्यक होने पर कानून प्रवर्तन",
        "आपकी सहमति से अन्य पक्ष"
      ],
      sharingNote: "हम आपकी व्यक्तिगत जानकारी तीसरे पक्षों को नहीं बेचते।",
      security: "4. डेटा सुरक्षा",
      securityText: "हम आपकी व्यक्तिगत जानकारी को अनधिकृत पहुंच, परिवर्तन, प्रकटीकरण या विनाश से बचाने के लिए उचित तकनीकी और संगठनात्मक उपाय लागू करते हैं। हालांकि, इंटरनेट पर कोई भी संचरण विधि 100% सुरक्षित नहीं है।",
      rights: "5. आपके अधिकार",
      rightsText: "आपके पास निम्नलिखित अधिकार हैं:",
      rightsList: [
        "अपनी व्यक्तिगत जानकारी तक पहुंच",
        "गलत जानकारी सुधारना",
        "अपनी जानकारी हटाने का अनुरोध",
        "आपकी जानकारी के प्रसंस्करण पर आपत्ति",
        "डेटा पोर्टेबिलिटी का अनुरोध",
        "मार्केटिंग संचार के लिए सहमति वापस लेना"
      ],
      cookies: "6. कुकीज़ और ट्रैकिंग",
      cookiesText: "हम आपके अनुभव को बेहतर बनाने, उपयोग का विश्लेषण करने और हमारे मार्केटिंग प्रयासों में सहायता के लिए कुकीज़ और समान ट्रैकिंग तकनीकों का उपयोग करते हैं। आप अपने ब्राउज़र सेटिंग्स के माध्यम से कुकीज़ नियंत्रित कर सकते हैं।",
      children: "7. बच्चों की गोपनीयता",
      childrenText: "हमारी सेवाएं 13 वर्ष से कम उम्र के बच्चों के लिए नहीं हैं। हम जानबूझकर 13 वर्ष से कम उम्र के बच्चों से व्यक्तिगत जानकारी एकत्र नहीं करते। यदि हमें पता चलता है कि हमने ऐसी जानकारी एकत्र की है, तो हम इसे तुरंत हटा देंगे।",
      retention: "8. डेटा प्रतिधारण",
      retentionText: "हम आपकी व्यक्तिगत जानकारी को हमारी सेवाएं प्रदान करने और कानूनी दायित्वों का पालन करने के लिए आवश्यक समय तक रखते हैं। जब आवश्यकता नहीं रहती, तो हम आपकी जानकारी को सुरक्षित रूप से हटा देंगे या गुमनाम कर देंगे।",
      transfers: "9. अंतर्राष्ट्रीय स्थानांतरण",
      transfersText: "आपकी जानकारी आपके निवास देश के अलावा अन्य देशों में स्थानांतरित और संसाधित की जा सकती है। हम ऐसे स्थानांतरण के लिए उचित सुरक्षा उपाय सुनिश्चित करते हैं।",
      changes: "10. इस नीति में परिवर्तन",
      changesText: "हम समय-समय पर इस गोपनीयता नीति को अपडेट कर सकते हैं। हम महत्वपूर्ण परिवर्तनों की सूचना वेबसाइट पर नई नीति पोस्ट करके और \"अंतिम अपडेट\" तिथि को अपडेट करके देंगे।",
      contact: "11. हमसे संपर्क करें",
      contactText: "इस गोपनीयता नीति या हमारे डेटा प्रथाओं के बारे में प्रश्न हैं, तो कृपया हमसे संपर्क करें:",
      contactInfo: "ईमेल: support@ridebus.in\nफोन: +91 8084362156\nपता: पटना, बिहार, भारत",
      trustMessage: "आपकी गोपनीयता महत्वपूर्ण है · डेटा सुरक्षित · पारदर्शी प्रथाएं",
      tableOfContents: "विषय सूची",
      backToTop: "ऊपर जाएं",
    }
  }[language];

  const sections = [
    { key: "collect", label: content.collect },
    { key: "use", label: content.use },
    { key: "sharing", label: content.sharing },
    { key: "security", label: content.security },
    { key: "rights", label: content.rights },
    { key: "cookies", label: content.cookies },
    { key: "children", label: content.children },
    { key: "retention", label: content.retention },
    { key: "transfers", label: content.transfers },
    { key: "changes", label: content.changes },
    { key: "contact", label: content.contact },
  ];

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
        <meta name="keywords" content="ride bus privacy policy, data protection bus booking, premium bus travel privacy Bihar, personal information handling, cookies policy" />
        <meta property="og:title" content={content.title} />
        <meta property="og:description" content={content.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ridebus.in/privacy" />
        <link rel="canonical" href="https://ridebus.in/privacy" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Privacy Policy - Ride Bus",
            "description": content.description,
            "url": "https://ridebus.in/privacy",
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
            <header className="flex items-center justify-between mb-8" aria-labelledby="privacy-heading">
              <h1 id="privacy-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                Privacy Policy
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
                      {content[`${section.key}Note`] && (
                        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-6 italic">
                          {content[`${section.key}Note`]}
                        </p>
                      )}
                      {section.key === "contact" && content.contactInfo && (
                        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-6 whitespace-pre-line">
                          {content.contactInfo}
                        </p>
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