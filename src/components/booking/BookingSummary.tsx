import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, User, Phone, Mail, Armchair, CreditCard } from "lucide-react";

interface PassengerInfo {
  name: string;
  email: string;
  phone: string;
  seatNumber: number;
}

interface BookingSummaryProps {
  tripDetails: {
    routeName: string;
    fromStop: string;
    toStop: string;
    tripDate: string;
    departureTime: string;
    arrivalTime: string;
    busName: string;
  };
  passengers: PassengerInfo[];
  farePerSeat: number;
  onConfirm: () => void;
  onBack: () => void;
  loading?: boolean;
  bookingMode?: string;
}

export function BookingSummary({
  tripDetails,
  passengers,
  farePerSeat,
  onConfirm,
  onBack,
  loading = false,
  bookingMode = "offline"
}: BookingSummaryProps) {
  // Safe fare calculation - prevent NaN
  const safeFare = Number(farePerSeat) || 0;
  const totalFare = safeFare * passengers.length;
  const seatNumbers = passengers.map(p => p.seatNumber).sort((a, b) => a - b);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Booking Summary</CardTitle>
              <CardDescription>
                Review your booking for {passengers.length} passenger{passengers.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Booking Mode</div>
              <div className="text-sm font-semibold capitalize">{bookingMode}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Journey Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Journey Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Route</p>
                <p className="font-semibold">{tripDetails.routeName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Bus</p>
                <p className="font-semibold">{tripDetails.busName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-semibold">{tripDetails.fromStop}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">To</p>
                <p className="font-semibold">{tripDetails.toStop}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Date
                </p>
                <p className="font-semibold">{new Date(tripDetails.tripDate).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Time
                </p>
                <p className="font-semibold">{tripDetails.departureTime} - {tripDetails.arrivalTime}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Passenger Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Passenger Details ({passengers.length})
            </h3>
            <div className="space-y-3">
              {passengers.map((passenger, index) => (
                <div key={index} className="bg-muted/50 p-4 rounded-lg space-y-2 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">Passenger {index + 1}</span>
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                      <Armchair className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold text-primary">Seat {passenger.seatNumber}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{passenger.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{passenger.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{passenger.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Seat & Fare */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Fare Breakdown
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span>Selected Seats</span>
                <span className="font-semibold">{seatNumbers.join(", ")}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span>Fare per Seat</span>
                <span>₹{safeFare}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Number of Seats</span>
                <span>× {passengers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm">₹{totalFare}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxes & Fees</span>
                <span className="text-sm text-muted-foreground">₹0</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total Amount</span>
                <span className="text-primary">₹{totalFare}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onBack} disabled={loading} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={onConfirm} 
              disabled={loading || safeFare <= 0} 
              className="flex-1"
            >
              {loading 
                ? "Processing..." 
                : bookingMode === "offline"
                  ? "Confirm Booking (Pay on Bus)" 
                  : "Proceed to Payment"}
            </Button>
          </div>
          {safeFare <= 0 && (
            <p className="text-sm text-destructive text-center mt-2">
              Invalid fare. Please go back and try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
