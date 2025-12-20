import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bus, Clock, Shield, Ticket } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-hero-gradient text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Travel Comfortably, Arrive Safely
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Book your bus tickets online and enjoy a hassle-free journey to your destination. Affordable prices, comfortable seats, and reliable service.
            </p>
            <Link to="/book">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-strong animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <Ticket className="mr-2 h-5 w-5" />
                Book Tickets Now
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose BusGo?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're committed to making your travel experience smooth and enjoyable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Bus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Modern Fleet</h3>
                <p className="text-muted-foreground">
                  Travel in comfort with our well-maintained, modern buses equipped with all amenities
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">On-Time Service</h3>
                <p className="text-muted-foreground">
                  We value your time. Our buses depart and arrive on schedule, ensuring you reach on time
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
                <p className="text-muted-foreground">
                  Your safety is our priority. Professional drivers and regular safety checks ensure a secure journey
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book your tickets now and experience the difference. Quick, easy, and affordable bus travel.
          </p>
          <Link to="/book">
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-strong">
              Book Your Tickets
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
