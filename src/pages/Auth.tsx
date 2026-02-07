'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Loader2, Globe, Shield, Mail, Lock, User , Bus } from "lucide-react";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "hi" : "en"));
  };

  const content = {
    en: {
      title: "Welcome - Ride Bus",
      description: "Sign in or create an account to book your premium bus tickets.",
      welcome: "Welcome to Ride Bus",
      descriptionText: "Premium travel across Bihar — safe, comfortable, and reliable.",
      login: "Login",
      signUp: "Sign Up",
      fullName: "Full Name",
      email: "Email",
      password: "Password",
      loggingIn: "Logging in...",
      loginButton: "Login",
      creatingAccount: "Creating account...",
      signUpButton: "Sign Up",
      accountCreated: "Account created!",
      welcomeMessage: "Welcome to Ride Bus. You can now book your tickets.",
      welcomeBack: "Welcome back!",
      loginSuccess: "You've successfully logged in.",
      validationError: "Validation Error",
      signUpFailed: "Sign up failed",
      loginFailed: "Login failed",
      pleaseTryAgain: "Please try again",
      trustMessage: "Secure Authentication · Your Data Protected · Trusted by Thousands",
    },
    hi: {
      title: "स्वागत है - राइड बस",
      description: "अपनी प्रीमियम बस टिकट बुक करने के लिए साइन इन करें या नया अकाउंट बनाएं।",
      welcome: "राइड बस में आपका स्वागत है",
      descriptionText: "बिहार में प्रीमियम यात्रा — सुरक्षित, आरामदायक और विश्वसनीय।",
      login: "लॉगिन",
      signUp: "साइन अप",
      fullName: "पूरा नाम",
      email: "ईमेल",
      password: "पासवर्ड",
      loggingIn: "लॉगिन हो रहा है...",
      loginButton: "लॉगिन",
      creatingAccount: "अकाउंट बनाया जा रहा है...",
      signUpButton: "साइन अप",
      accountCreated: "अकाउंट बन गया!",
      welcomeMessage: "राइड बस में स्वागत है। अब आप टिकट बुक कर सकते हैं।",
      welcomeBack: "पुनः स्वागत है!",
      loginSuccess: "आप सफलतापूर्वक लॉगिन हो गए हैं।",
      validationError: "मान्यकरण त्रुटि",
      signUpFailed: "साइन अप विफल",
      loginFailed: "लॉगिन विफल",
      pleaseTryAgain: "कृपया पुनः प्रयास करें",
      trustMessage: "सुरक्षित प्रमाणीकरण · आपका डेटा सुरक्षित · हजारों का भरोसा",
    }
  }[language];

  useEffect(() => {
    const handleMagicLink = async () => {
      const hash = window.location.hash;

      if (hash.includes("access_token") || hash.includes("code")) {
        await supabase.auth.exchangeCodeForSession(window.location.href);
        navigate("/", { replace: true });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/");
    };

    handleMagicLink();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = signUpSchema.parse({ email, password, fullName });
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: validated.fullName,
          },
        },
      });

      if (error) throw error;

<<<<<<< HEAD
      if (data.user) {
        toast({
          title: content.accountCreated,
          description: content.welcomeMessage,
        });
        navigate("/");
      }
=======
      if (data.user && !data.session) {
  // Email confirmation required
  toast({
    title: "Verification email sent",
    description: "Please check your inbox and verify your email before logging in.",
  });

  navigate("/check-email");
 // or later we will make /check-email
}

if (data.session) {
  // Auto-login case (if email confirmation disabled)
  toast({
    title: "Welcome!",
    description: "Account created and logged in.",
  });

  navigate("/");
}

>>>>>>> aded3a7 (fix from phase 1 to 4 to improve sign up)
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
          title: content.signUpFailed,
          description: error.message || content.pleaseTryAgain,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = loginSchema.parse({ email, password });
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
  if (error.message.includes("Email not confirmed")) {
    toast({
      variant: "destructive",
      title: "Email not verified",
      description: "Please check your inbox and verify your email first.",
    });
    return;
  }

  throw error;
}


      if (data.user) {
        toast({
          title: content.welcomeBack,
          description: content.loginSuccess,
        });
        navigate("/");
      }
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
          title: content.loginFailed,
          description: error.message || content.pleaseTryAgain,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-none bg-white dark:bg-slate-900">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <Bus className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">{content.welcome}</CardTitle>
              <CardDescription className="text-base">{content.descriptionText}</CardDescription>
              <Button variant="ghost" size="icon" onClick={toggleLanguage} className="absolute top-4 right-4">
                <Globe className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login">{content.login}</TabsTrigger>
                  <TabsTrigger value="signup">{content.signUp}</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {content.email}
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-base flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {content.password}
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      {loading ? content.loggingIn : content.loginButton}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-6">
                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {content.fullName}
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {content.email}
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-base flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {content.password}
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      {loading ? content.creatingAccount : content.signUpButton}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 text-center"
              >
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  {content.trustMessage}
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}