import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bus, Clock, Shield, Ticket, Award, MapPin, Users, IndianRupee } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white py-24 md:py-40 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAyYy0yLjIxIDAtNCAxLjc5LTQgNHMxLjc5IDQgNCA0IDQtMS43OSA0LTQtMS43OS00LTQtNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Brand Logo/Name */}
            <div className="mb-8 animate-in fade-in slide-in-from-top duration-1000">
              <h1 className="text-5xl md:text-7xl font-black mb-3 tracking-tight">
                RIDE <span className="text-green-400">BUS</span>
              </h1>
              <p className="text-2xl md:text-3xl font-semibold text-green-300 mb-2">
                हर सफर, हर Budget के लिए
              </p>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Premium Travel, Affordable Prices
            </h2>
            <p className="text-lg md:text-xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              Experience comfortable and safe bus journeys across Bihar. Book your tickets online and travel with confidence on our modern fleet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <Link to="/book">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <Ticket className="mr-2 h-6 w-6" />
                  Book Tickets Now
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-slate-900 font-semibold px-8 py-6 text-lg transition-all duration-300">
                  View Routes
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Quick Routes Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800">Popular Routes</h2>
            <p className="text-slate-600 text-lg">Direct connections to major cities</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { from: "Siwan", to: "Raxaul", icon: "🚌" },
              { from: "Siwan", to: "Motihari", icon: "🚌" },
              { from: "Raxaul", to: "Gopalganj", icon: "🚌" },
              { from: "Motihari", to: "Gopalganj", icon: "🚌" }
            ].map((route, idx) => (
              <Card key={idx} className="border-2 border-slate-200 hover:border-green-400 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{route.icon}</div>
                  <p className="font-semibold text-slate-800 text-lg mb-1">{route.from}</p>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-px w-8 bg-slate-300"></div>
                    <MapPin className="h-4 w-4 text-green-500" />
                    <div className="h-px w-8 bg-slate-300"></div>
                  </div>
                  <p className="font-semibold text-slate-800 text-lg">{route.to}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-800">Why Choose Ride Bus?</h2>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto">
              We're a B2B2C company delivering premium bus services at prices that fit every budget
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 border-slate-100 hover:border-green-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Bus className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Modern Fleet</h3>
                <p className="text-slate-600 leading-relaxed">
                  Travel in comfort with our well-maintained, modern buses equipped with comfortable seating, AC, and essential amenities
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100 hover:border-blue-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">On-Time Service</h3>
                <p className="text-slate-600 leading-relaxed">
                  We value your time. Our buses depart and arrive on schedule, ensuring you reach your destination as planned
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100 hover:border-purple-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Safe & Secure</h3>
                <p className="text-slate-600 leading-relaxed">
                  Your safety is our top priority. Professional drivers, regular maintenance, and safety checks ensure a secure journey
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100 hover:border-orange-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <IndianRupee className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Affordable Pricing</h3>
                <p className="text-slate-600 leading-relaxed">
                  Premium service doesn't mean premium prices. We offer competitive rates that fit every budget without compromising quality
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100 hover:border-red-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Customer First</h3>
                <p className="text-slate-600 leading-relaxed">
                  Our dedicated support team is always ready to assist you. Your comfort and satisfaction are what drive us forward
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100 hover:border-teal-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Trusted Service</h3>
                <p className="text-slate-600 leading-relaxed">
                  Join thousands of satisfied customers who trust Ride Bus for their daily commute and long-distance travel needs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-green-500 to-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black mb-2">500+</div>
              <div className="text-sm md:text-base opacity-90">Daily Trips</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black mb-2">10K+</div>
              <div className="text-sm md:text-base opacity-90">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black mb-2">50+</div>
              <div className="text-sm md:text-base opacity-90">Modern Buses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black mb-2">24/7</div>
              <div className="text-sm md:text-base opacity-90">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 py-20 md:py-28 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAyYy0yLjIxIDAtNCAxLjc5LTQgNHMxLjc5IDQgNCA0IDQtMS43OSA0LTQtMS43OS00LTQtNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto opacity-90 leading-relaxed">
            Book your tickets now and experience premium travel at affordable prices. Quick, easy, and reliable bus service across Bihar.
          </p>
          <Link to="/book">
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold px-10 py-7 text-xl shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105">
              <Ticket className="mr-3 h-6 w-6" />
              Book Your Tickets
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
} 