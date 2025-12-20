import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Armchair } from "lucide-react";
import { useState, useEffect } from "react";

export interface PassengerData {
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
}

interface MultiPassengerFormProps {
  seatNumbers: number[];
  onSubmit: (passengers: PassengerData[]) => void;
  onBack: () => void;
  userProfile?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

export function MultiPassengerForm({ seatNumbers, onSubmit, onBack, userProfile }: MultiPassengerFormProps) {
  const [passengers, setPassengers] = useState<PassengerData[]>(
    seatNumbers.map((_, index) => ({
      passenger_name: index === 0 && userProfile?.full_name ? userProfile.full_name : "",
      passenger_email: index === 0 && userProfile?.email ? userProfile.email : "",
      passenger_phone: index === 0 && userProfile?.phone ? userProfile.phone : "",
    }))
  );

  const [errors, setErrors] = useState<{ [key: number]: { [field: string]: string } }>({});

  useEffect(() => {
    // Update passengers array when seat numbers change
    setPassengers(seatNumbers.map((_, index) => ({
      passenger_name: index === 0 && userProfile?.full_name ? userProfile.full_name : passengers[index]?.passenger_name || "",
      passenger_email: index === 0 && userProfile?.email ? userProfile.email : passengers[index]?.passenger_email || "",
      passenger_phone: index === 0 && userProfile?.phone ? userProfile.phone : passengers[index]?.passenger_phone || "",
    })));
  }, [seatNumbers.length]);

  const handleChange = (index: number, field: keyof PassengerData, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);

    // Clear error for this field
    if (errors[index]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      if (Object.keys(newErrors[index]).length === 0) {
        delete newErrors[index];
      }
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: number]: { [field: string]: string } } = {};
    
    passengers.forEach((p, index) => {
      const passengerErrors: { [field: string]: string } = {};
      
      if (!p.passenger_name.trim()) {
        passengerErrors.passenger_name = "Name is required";
      }
      
      if (!p.passenger_email.trim()) {
        passengerErrors.passenger_email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.passenger_email)) {
        passengerErrors.passenger_email = "Invalid email format";
      }
      
      if (!p.passenger_phone.trim()) {
        passengerErrors.passenger_phone = "Phone is required";
      } else if (!/^\+?[\d\s\-()]+$/.test(p.passenger_phone)) {
        passengerErrors.passenger_phone = "Invalid phone format";
      }

      if (Object.keys(passengerErrors).length > 0) {
        newErrors[index] = passengerErrors;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(passengers);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Passenger Details</h2>
        <p className="text-muted-foreground">Enter details for each passenger (one per seat)</p>
      </div>

      <div className="grid gap-6">
        {seatNumbers.map((seatNumber, index) => (
          <Card key={seatNumber} className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Armchair className="h-5 w-5 text-primary" />
                  Seat {seatNumber}
                </CardTitle>
                {index === 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Primary Passenger
                  </span>
                )}
              </div>
              <CardDescription>
                {index === 0 ? "Your details (auto-filled)" : `Passenger ${index + 1} details`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`name-${index}`} className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name *
                </Label>
                <Input
                  id={`name-${index}`}
                  placeholder="Enter full name"
                  value={passengers[index]?.passenger_name || ""}
                  onChange={(e) => handleChange(index, "passenger_name", e.target.value)}
                  className={errors[index]?.passenger_name ? "border-destructive" : ""}
                />
                {errors[index]?.passenger_name && (
                  <p className="text-sm text-destructive">{errors[index].passenger_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`email-${index}`} className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email *
                </Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  placeholder="passenger@example.com"
                  value={passengers[index]?.passenger_email || ""}
                  onChange={(e) => handleChange(index, "passenger_email", e.target.value)}
                  className={errors[index]?.passenger_email ? "border-destructive" : ""}
                />
                {errors[index]?.passenger_email && (
                  <p className="text-sm text-destructive">{errors[index].passenger_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`phone-${index}`} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone *
                </Label>
                <Input
                  id={`phone-${index}`}
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={passengers[index]?.passenger_phone || ""}
                  onChange={(e) => handleChange(index, "passenger_phone", e.target.value)}
                  className={errors[index]?.passenger_phone ? "border-destructive" : ""}
                />
                {errors[index]?.passenger_phone && (
                  <p className="text-sm text-destructive">{errors[index].passenger_phone}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Seat Selection
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          Continue to Summary
        </Button>
      </div>
    </div>
  );
}
