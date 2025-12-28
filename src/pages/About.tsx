'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Bus, Users, Award, MapPin, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useLanguage } from '../context/LanguageContext';

export default function About() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "About Ride Bus - Premium Bus Travel in Bihar",
      description: "Discover our story and commitment to safe, comfortable bus journeys across Bihar.",
      aboutRideBus: "About Ride Bus",
      trustedPartner: "Your trusted partner in comfortable and affordable bus travel",
      ourStory: "Our Story",
      storyText1: "Founded in 2020, Ride Bus has grown to become one of the leading bus service providers in Bihar. We started with a simple mission: to make bus travel comfortable, affordable, and accessible to everyone.",
      storyText2: "Today, we operate a modern fleet of buses connecting major cities and towns, serving thousands of satisfied customers every day. Our commitment to excellence and customer satisfaction drives everything we do.",
      modernFleet: "Modern Fleet",
      fleetText: "We maintain a fleet of well-equipped, comfortable buses with regular maintenance and safety checks.",
      expertTeam: "Expert Team",
      teamText: "Our professional drivers and support staff are trained to provide you with the best travel experience.",
      awardWinning: "Award Winning",
      awardText: "Recognized for excellence in customer service and reliability by industry leaders.",
      wideNetwork: "Wide Network",
      networkText: "Connecting major cities and towns with multiple daily departures to suit your schedule.",
      ourMission: "Our Mission",
      missionText: "To provide safe, comfortable, and affordable bus transportation services while maintaining the highest standards of customer service and environmental responsibility.",
      ourVision: "Our Vision",
      visionText: "To be the most trusted and preferred bus service provider, setting new standards in the transportation industry through innovation, reliability, and customer-centric approach.",
      trustMessage: "Trusted by Thousands · Safe Journeys · Premium Service",
    },
    hi: {
      title: "राइड बस के बारे में - बिहार में प्रीमियम बस यात्रा",
      description: "हमारी कहानी और बिहार में सुरक्षित, आरामदायक बस यात्राओं के प्रति हमारी प्रतिबद्धता जानें।",
      aboutRideBus: "राइड बस के बारे में",
      trustedPartner: "आरामदायक और किफायती बस यात्रा में आपका विश्वसनीय साथी",
      ourStory: "हमारी कहानी",
      storyText1: "2020 में स्थापित, राइड बस बिहार में प्रमुख बस सेवा प्रदाताओं में से एक बन गया है। हमने एक सरल मिशन के साथ शुरुआत की: बस यात्रा को हर किसी के लिए आरामदायक, किफायती और सुलभ बनाना।",
      storyText2: "आज, हम प्रमुख शहरों और कस्बों को जोड़ने वाली आधुनिक बसों का बेड़ा संचालित करते हैं, जो हर दिन हजारों संतुष्ट ग्राहकों की सेवा करते हैं। उत्कृष्टता और ग्राहक संतुष्टि के प्रति हमारी प्रतिबद्धता सब कुछ चलाती है जो हम करते हैं।",
      modernFleet: "आधुनिक बेड़ा",
      fleetText: "हम नियमित रखरखाव और सुरक्षा जांच के साथ सुसज्जित, आरामदायक बसों का बेड़ा बनाए रखते हैं।",
      expertTeam: "विशेषज्ञ टीम",
      teamText: "हमारे पेशेवर ड्राइवर और सहायता स्टाफ आपको सर्वोत्तम यात्रा अनुभव प्रदान करने के लिए प्रशिक्षित हैं।",
      awardWinning: "पुरस्कार विजेता",
      awardText: "उद्योग नेताओं द्वारा ग्राहक सेवा और विश्वसनीयता में उत्कृष्टता के लिए मान्यता प्राप्त।",
      wideNetwork: "विस्तृत नेटवर्क",
      networkText: "आपके शेड्यूल के अनुरूप कई दैनिक प्रस्थान के साथ प्रमुख शहरों और कस्बों को जोड़ना।",
      ourMission: "हमारा मिशन",
      missionText: "उच्चतम मानकों की ग्राहक सेवा और पर्यावरणीय जिम्मेदारी बनाए रखते हुए सुरक्षित, आरामदायक और किफायती बस परिवहन सेवाएं प्रदान करना।",
      ourVision: "हमारा विजन",
      visionText: "नवाचार, विश्वसनीयता और ग्राहक-केंद्रित दृष्टिकोण के माध्यम से परिवहन उद्योग में नए मानक स्थापित करते हुए सबसे विश्वसनीय और पसंदीदा बस सेवा प्रदाता बनना।",
      trustMessage: "हजारों का भरोसा · सुरक्षित यात्राएं · प्रीमियम सेवा",
    }
  }[language];

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
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-center text-foreground">{content.aboutRideBus}</h1>
            <p className="text-lg sm:text-xl text-muted-foreground text-center mb-12">{content.trustedPartner}</p>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground flex items-center gap-2 mb-12 justify-center"
            >
              <Shield className="h-4 w-4 text-green-600" />
              {content.trustMessage}
            </motion.p>

            <div className="space-y-16">
              {/* Our Story */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="shadow-xl border-none">
                  <CardContent className="pt-6 space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-semibold mb-4">{content.ourStory}</h2>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{content.storyText1}</p>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{content.storyText2}</p>
                  </CardContent>
                </Card>
              </motion.section>

              {/* Features Grid */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-8 text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                        <Bus className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{content.modernFleet}</h3>
                      <p className="text-muted-foreground leading-relaxed">{content.fleetText}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-8 text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                        <Users className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{content.expertTeam}</h3>
                      <p className="text-muted-foreground leading-relaxed">{content.teamText}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-8 text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                        <Award className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{content.awardWinning}</h3>
                      <p className="text-muted-foreground leading-relaxed">{content.awardText}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-8 text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                        <MapPin className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{content.wideNetwork}</h3>
                      <p className="text-muted-foreground leading-relaxed">{content.networkText}</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.section>

              {/* Mission & Vision */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="shadow-xl border-none">
                  <CardContent className="pt-6 space-y-8">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-semibold mb-4">{content.ourMission}</h2>
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{content.missionText}</p>
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-semibold mb-4">{content.ourVision}</h2>
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{content.visionText}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.section>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}