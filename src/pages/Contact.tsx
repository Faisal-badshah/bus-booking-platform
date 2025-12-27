'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Loader2, Globe, Shield, Facebook, Instagram } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000),
});

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const { toast } = useToast();

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "hi" : "en"));
  };

  const content = {
    en: {
      title: "Contact Us - Ride Bus",
      description: "Get in touch with Ride Bus for any queries or support.",
      contactUs: "Contact Us",
      haveQuestions: "Have questions? We're here to help!",
      getInTouch: "Get in Touch",
      reachOut: "Reach out to us through any of these channels",
      phone: "Phone",
      callUs: "Call us directly",
      email: "Email",
      emailUs: "Send us an email",
      office: "Our Office",
      visitUs: "Visit our office in Patna",
      businessHours: "Business Hours",
      mondayFriday: "Monday - Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      sendMessage: "Send us a Message",
      fillForm: "Fill out the form and we'll get back to you soon",
      name: "Name",
      emailLabel: "Email",
      message: "Message",
      sending: "Sending...",
      sendMessageButton: "Send Message",
      messageSent: "Message sent!",
      thankYou: "Thank you for contacting us. We'll get back to you soon.",
      validationError: "Validation Error",
      error: "Error",
      failedToSend: "Failed to send message. Please try again.",
      trustMessage: "Secure Communication · Quick Response · 24/7 Support",
      followUs: "Follow Us",
    },
    hi: {
      title: "हमसे संपर्क करें - राइड बस",
      description: "किसी भी प्रश्न या समर्थन के लिए राइड बस से संपर्क करें।",
      contactUs: "हमसे संपर्क करें",
      haveQuestions: "प्रश्न हैं? हम मदद के लिए यहां हैं!",
      getInTouch: "संपर्क में रहें",
      reachOut: "इनमें से किसी भी चैनल के माध्यम से हमसे संपर्क करें",
      phone: "फोन",
      callUs: "हमें सीधे कॉल करें",
      email: "ईमेल",
      emailUs: "हमें ईमेल भेजें",
      office: "हमारा कार्यालय",
      visitUs: "पटना में हमारे कार्यालय का दौरा करें",
      businessHours: "व्यवसायिक घंटे",
      mondayFriday: "सोमवार - शुक्रवार",
      saturday: "शनिवार",
      sunday: "रविवार",
      sendMessage: "हमें संदेश भेजें",
      fillForm: "फॉर्म भरें और हम जल्द ही आपसे संपर्क करेंगे",
      name: "नाम",
      emailLabel: "ईमेल",
      message: "संदेश",
      sending: "भेजा जा रहा है...",
      sendMessageButton: "संदेश भेजें",
      messageSent: "संदेश भेजा गया!",
      thankYou: "हमसे संपर्क करने के लिए धन्यवाद। हम जल्द ही आपसे संपर्क करेंगे।",
      validationError: "मान्यकरण त्रुटि",
      error: "त्रुटि",
      failedToSend: "संदेश भेजने में विफल। कृपया पुन: प्रयास करें।",
      trustMessage: "सुरक्षित संचार · त्वरित प्रतिक्रिया · 24/7 समर्थन",
      followUs: "हमसे जुड़ें",
    }
  }[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = contactSchema.parse({ name, email, message });
      setLoading(true);

      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: content.messageSent,
        description: content.thankYou,
      });

      setName("");
      setEmail("");
      setMessage("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: content.validationError,
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: content.error,
          description: content.failedToSend,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Office location from Google Maps link: Patna, Bihar (approx coordinates)
  const officePosition: [number, number] = [25.5941, 85.1376];

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
            className="max-w-5xl mx-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">{content.contactUs}</h1>
              <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle Language">
                <Globe className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-lg sm:text-xl text-muted-foreground text-center mb-8">{content.haveQuestions}</p>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground flex items-center gap-2 mb-12 justify-center"
            >
              <Shield className="h-4 w-4 text-green-600" />
              {content.trustMessage}
            </motion.p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left: Contact Info + Map + Social */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                {/* Contact Cards */}
                <div className="space-y-6">
                  <Card className="shadow-xl border-none">
                    <CardHeader>
                      <CardTitle className="text-xl">{content.getInTouch}</CardTitle>
                      <CardDescription className="text-base">{content.reachOut}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center shadow-md">
                          <Phone className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{content.phone}</p>
                          <a href="tel:+918084362156" className="text-green-600 hover:underline text-base">+91 8084362156</a>
                          <p className="text-sm text-muted-foreground">{content.callUs}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center shadow-md">
                          <Mail className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{content.email}</p>
                          <a href="mailto:support@ridebus.in" className="text-green-600 hover:underline text-base">support@ridebus.in</a>
                          <p className="text-sm text-muted-foreground">{content.emailUs}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center shadow-md">
                          <MapPin className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{content.office}</p>
                          <p className="text-base text-muted-foreground">Patna, Bihar, India</p>
                          <p className="text-sm text-muted-foreground">{content.visitUs}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Interactive Map */}
                  <Card className="shadow-xl border-none overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-xl">Find Us</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-64 md:h-80 rounded-b-xl overflow-hidden">
                        <MapContainer center={officePosition} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={officePosition}>
                            <Popup>
                              <div className="text-center">
                                <p className="font-bold">Ride Bus Office</p>
                                <p className="text-sm">Patna, Bihar</p>
                              </div>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                      <div className="p-4 bg-muted/50">
                        <a
                          href="https://maps.app.goo.gl/f2e5YxmEAaocTtFKA"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline text-sm font-medium"
                        >
                          Open in Google Maps →
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Media */}
                  <Card className="shadow-xl border-none">
                    <CardHeader>
                      <CardTitle className="text-xl">{content.followUs}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-6">
                        <a
                          href="https://www.facebook.com/share/17gD4idaty/"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Facebook"
                          className="text-blue-600 hover:text-blue-700 transition"
                        >
                          <Facebook className="h-10 w-10" />
                        </a>
                        <a
                          href="https://www.instagram.com/_ridebus_"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                          className="text-pink-600 hover:text-pink-700 transition"
                        >
                          <Instagram className="h-10 w-10" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* Right: Contact Form */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="shadow-2xl border-none h-fit">
                  <CardHeader>
                    <CardTitle className="text-xl">{content.sendMessage}</CardTitle>
                    <CardDescription className="text-base">{content.fillForm}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base">{content.name}</Label>
                        <Input
                          id="name"
                          placeholder={language === "en" ? "Your name" : "आपका नाम"}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base">{content.emailLabel}</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={language === "en" ? "your@email.com" : "आपका@ईमेल.com"}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-base">{content.message}</Label>
                        <Textarea
                          id="message"
                          placeholder={language === "en" ? "How can we help you?" : "हम आपकी कैसे मदद कर सकते हैं?"}
                          rows={8}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                          className="text-base"
                        />
                      </div>

                      <Button type="submit" className="w-full h-12 text-lg font-medium bg-green-600 hover:bg-green-700" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {loading ? content.sending : content.sendMessageButton}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}