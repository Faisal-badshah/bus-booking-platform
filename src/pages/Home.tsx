import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bus, Clock, Shield, Ticket, Award, MapPin, Users, IndianRupee } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 lg:py-36 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-6 sm:mb-8 md:mb-10">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-3 sm:mb-4 tracking-tight leading-tight">
                RIDE <span className="text-green-400">BUS</span>
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-300 tracking-wide">
                हर सफर, हर Budget के लिए
              </p>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              Premium Travel, Affordable Prices
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 md:mb-12 opacity-95 max-w-3xl mx-auto leading-relaxed px-4">
              Experience comfortable and safe bus journeys across Bihar. Book your tickets online and travel with confidence on our modern fleet.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center px-4">
              <Link to="/book" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 text-base sm:text-lg md:text-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <Ticket className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Book Tickets Now
                </Button>
              </Link>
              <Link to="/services" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-slate-900 font-bold px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 text-base sm:text-lg md:text-xl transition-all duration-300">
                  View Routes
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Popular Routes Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-slate-900">
              Popular Routes
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600">
              Direct connections to major cities
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto">
            {[
              { from: "Siwan", to: "Raxaul" },
              { from: "Siwan", to: "Motihari" },
              { from: "Raxaul", to: "Gopalganj" },
              { from: "Motihari", to: "Gopalganj" }
            ].map((route, idx) => (
              <Card key={idx} className="border-2 border-slate-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardContent className="p-5 sm:p-6 md:p-8 text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300">
                    🚌
                  </div>
                  <p className="font-bold text-slate-900 text-lg sm:text-xl md:text-2xl mb-3">
                    {route.from}
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="h-0.5 w-6 sm:w-8 bg-slate-300"></div>
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <div className="h-0.5 w-6 sm:w-8 bg-slate-300"></div>
                  </div>
                  <p className="font-bold text-slate-900 text-lg sm:text-xl md:text-2xl">
                    {route.to}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-28 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5 text-slate-900">
              Why Choose Ride Bus?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
              We're a B2B2C company delivering premium bus services at prices that fit every budget
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 md:gap-8 max-w-7xl mx-auto">
            <Card className="border-2 border-slate-200 hover:border-green-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group bg-white">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Bus className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-slate-900">
                  Modern Fleet
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Travel in comfort with our well-maintained, modern buses equipped with comfortable seating, AC, and essential amenities
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group bg-white">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-slate-900">
                  On-Time Service
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  We value your time. Our buses depart and arrive on schedule, ensuring you reach your destination as planned
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group bg-white">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-slate-900">
                  Safe & Secure
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Your safety is our top priority. Professional drivers, regular maintenance, and safety checks ensure a secure journey
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 hover:border-orange-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group bg-white">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <IndianRupee className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-slate-900">
                  Affordable Pricing
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Premium service doesn't mean premium prices. We offer competitive rates that fit every budget without compromising quality
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 hover:border-red-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group bg-white">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-slate-900">
                  Customer First
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Our dedicated support team is always ready to assist you. Your comfort and satisfaction are what drive us forward
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 hover:border-teal-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group bg-white">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-slate-900">
                  Trusted Service
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Join thousands of satisfied customers who trust Ride Bus for their daily commute and long-distance travel needs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-green-600 via-green-500 to-blue-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 sm:mb-3">
                500+
              </div>
              <div className="text-sm sm:text-base md:text-lg font-medium opacity-95">
                Daily Trips
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 sm:mb-3">
                10K+
              </div>
              <div className="text-sm sm:text-base md:text-lg font-medium opacity-95">
                Happy Customers
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 sm:mb-3">
                50+
              </div>
              <div className="text-sm sm:text-base md:text-lg font-medium opacity-95">
                Modern Buses
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 sm:mb-3">
                24/7
              </div>
              <div className="text-sm sm:text-base md:text-lg font-medium opacity-95">
                Support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-16 sm:py-20 md:py-28 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 sm:mb-6 md:mb-8 leading-tight">
            Ready to Start Your Journey?
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 md:mb-12 max-w-4xl mx-auto opacity-95 leading-relaxed px-4">
            Book your tickets now and experience premium travel at affordable prices. Quick, easy, and reliable bus service across Bihar.
          </p>
          <Link to="/book">
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8 text-lg sm:text-xl md:text-2xl shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105">
              <Ticket className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Book Your Tickets
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}