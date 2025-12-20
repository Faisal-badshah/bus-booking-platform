import { Card, CardContent } from "@/components/ui/card";
import { Bus, Users, Award, MapPin } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">About BusGo</h1>
          <p className="text-lg text-muted-foreground text-center mb-12">
            Your trusted partner in comfortable and affordable bus travel
          </p>

          <div className="prose prose-lg max-w-none mb-12">
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
                <p className="text-muted-foreground mb-4">
                  Founded in 2020, BusGo has grown to become one of the leading bus service providers in the region. 
                  We started with a simple mission: to make bus travel comfortable, affordable, and accessible to everyone.
                </p>
                <p className="text-muted-foreground">
                  Today, we operate a modern fleet of buses connecting major cities and towns, serving thousands of 
                  satisfied customers every day. Our commitment to excellence and customer satisfaction drives everything we do.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Card className="border-border hover:shadow-soft transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Bus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Modern Fleet</h3>
                  <p className="text-muted-foreground">
                    We maintain a fleet of well-equipped, comfortable buses with regular maintenance and safety checks.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-soft transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Expert Team</h3>
                  <p className="text-muted-foreground">
                    Our professional drivers and support staff are trained to provide you with the best travel experience.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-soft transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Award Winning</h3>
                  <p className="text-muted-foreground">
                    Recognized for excellence in customer service and reliability by industry leaders.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-soft transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <MapPin className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Wide Network</h3>
                  <p className="text-muted-foreground">
                    Connecting major cities and towns with multiple daily departures to suit your schedule.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                <p className="text-muted-foreground mb-4">
                  To provide safe, comfortable, and affordable bus transportation services while maintaining 
                  the highest standards of customer service and environmental responsibility.
                </p>
                <h2 className="text-2xl font-semibold mb-4 mt-6">Our Vision</h2>
                <p className="text-muted-foreground">
                  To be the most trusted and preferred bus service provider, setting new standards in the 
                  transportation industry through innovation, reliability, and customer-centric approach.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
