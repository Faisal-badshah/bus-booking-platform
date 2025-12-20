import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign } from "lucide-react";

export default function Services() {
  const routes = [
    {
      name: "Route 1: City A - City B",
      from: "City A",
      to: "City B",
      duration: "4 hours",
      frequency: "Every 2 hours",
      price: "$25",
      features: ["WiFi", "AC", "Reclining Seats", "USB Charging"],
    },
    {
      name: "Route 2: City B - City C",
      from: "City B",
      to: "City C",
      duration: "4 hours",
      frequency: "Every 3 hours",
      price: "$30",
      features: ["WiFi", "AC", "Reclining Seats", "USB Charging", "Snacks"],
    },
    {
      name: "Route 3: City A - City C",
      from: "City A",
      to: "City C",
      duration: "8 hours",
      frequency: "Daily",
      price: "$45",
      features: ["WiFi", "AC", "Full Recline", "USB Charging", "Meals", "Rest Stops"],
    },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">Our Services</h1>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Explore our routes, timings, and fares. We offer comfortable bus services connecting major cities 
            with modern amenities and affordable prices.
          </p>

          {/* Routes Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-8">Available Routes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes.map((route, index) => (
                <Card key={index} className="border-border hover:shadow-soft transition-all">
                  <CardHeader>
                    <CardTitle className="text-xl">{route.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4" />
                      {route.from} → {route.to}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {route.duration}
                        </div>
                        <div className="flex items-center gap-1 text-lg font-bold text-primary">
                          <DollarSign className="h-5 w-5" />
                          {route.price.replace('$', '')}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Frequency: {route.frequency}</p>
                        <div className="flex flex-wrap gap-2">
                          {route.features.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Amenities Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Onboard Amenities</CardTitle>
              <CardDescription>Enjoy these features on all our buses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Comfortable Seating</h3>
                    <p className="text-sm text-muted-foreground">
                      Spacious, reclining seats with ample legroom for a relaxed journey
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Climate Control</h3>
                    <p className="text-sm text-muted-foreground">
                      Fully air-conditioned buses maintain comfortable temperatures
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Entertainment</h3>
                    <p className="text-sm text-muted-foreground">
                      Free WiFi and charging ports to keep you connected
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Safety First</h3>
                    <p className="text-sm text-muted-foreground">
                      Professional drivers and regular vehicle maintenance
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Luggage Space</h3>
                    <p className="text-sm text-muted-foreground">
                      Generous storage space for your belongings
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Rest Stops</h3>
                    <p className="text-sm text-muted-foreground">
                      Scheduled breaks on longer routes for your convenience
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
