import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SeatSelectorProps {
  totalSeats: number;
  availableSeats: number[];
  selectedSeats: number[];
  onSeatsSelect: (seats: number[]) => void;
  maxSeats?: number;
  farePerSeat: number;
}

export function SeatSelector({ totalSeats, availableSeats, selectedSeats, onSeatsSelect, maxSeats = 6, farePerSeat }: SeatSelectorProps) {
  const availableSet = new Set(availableSeats);
  const selectedSet = new Set(selectedSeats);
  
  // Safe fare calculation - prevent NaN
  const safeFare = Number(farePerSeat) || 0;
  const totalFare = safeFare * selectedSeats.length;
  
  const handleSeatClick = (seatNumber: number) => {
    if (!availableSet.has(seatNumber)) return;
    
    if (selectedSet.has(seatNumber)) {
      // Deselect
      onSeatsSelect(selectedSeats.filter(s => s !== seatNumber));
    } else {
      // Select (check max limit)
      if (selectedSeats.length >= maxSeats) {
        return; // Max limit reached
      }
      onSeatsSelect([...selectedSeats, seatNumber].sort((a, b) => a - b));
    }
  };
  
  // Bus layout: 2 seats on left, aisle, 2 seats on right
  const renderSeat = (seatNumber: number) => {
    const isAvailable = availableSet.has(seatNumber);
    const isSelected = selectedSet.has(seatNumber);
    const isBooked = !isAvailable;

    return (
      <button
        key={seatNumber}
        onClick={() => handleSeatClick(seatNumber)}
        disabled={isBooked || (!isSelected && selectedSeats.length >= maxSeats)}
        className={cn(
          "h-12 w-12 rounded-t-lg border-2 flex items-center justify-center text-sm font-semibold transition-all",
          isSelected && "bg-primary text-primary-foreground border-primary scale-105 shadow-lg ring-2 ring-primary/50",
          isAvailable && !isSelected && selectedSeats.length < maxSeats && "bg-card border-border hover:border-primary hover:bg-accent cursor-pointer hover:scale-105",
          isBooked && "bg-muted border-muted-foreground/20 text-muted-foreground cursor-not-allowed opacity-50",
          !isSelected && selectedSeats.length >= maxSeats && isAvailable && "opacity-60 cursor-not-allowed"
        )}
      >
        {seatNumber}
      </button>
    );
  };

  // Create rows of 4 seats (2-2 configuration)
  const rows = Math.ceil(totalSeats / 4);
  
  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex gap-6 justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-card border-2 border-border"></div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary"></div>
          <span className="text-sm">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-muted border-2 border-muted-foreground/20"></div>
          <span className="text-sm">Booked</span>
        </div>
      </div>

      {/* Bus Layout */}
      <Card className="p-6 bg-gradient-to-b from-background to-muted/20">
        <div className="space-y-3">
          {/* Driver indicator */}
          <div className="flex justify-end mb-4">
            <div className="bg-primary/10 border-2 border-primary rounded-lg px-4 py-2 text-sm font-semibold">
              🚗 Driver
            </div>
          </div>

          {/* Seat rows */}
          {Array.from({ length: rows }, (_, rowIndex) => {
            const startSeat = rowIndex * 4 + 1;
            return (
              <div key={rowIndex} className="flex gap-3 justify-center items-center">
                {/* Left side - 2 seats */}
                <div className="flex gap-2">
                  {startSeat <= totalSeats && renderSeat(startSeat)}
                  {startSeat + 1 <= totalSeats && renderSeat(startSeat + 1)}
                </div>
                
                {/* Aisle */}
                <div className="w-8 border-l-2 border-r-2 border-dashed border-muted-foreground/20 h-12"></div>
                
                {/* Right side - 2 seats */}
                <div className="flex gap-2">
                  {startSeat + 2 <= totalSeats && renderSeat(startSeat + 2)}
                  {startSeat + 3 <= totalSeats && renderSeat(startSeat + 3)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Floating Summary */}
      {selectedSeats.length > 0 && (
        <div className="sticky bottom-4 z-10">
          <Card className="backdrop-blur-sm bg-card/95 border-2 border-primary shadow-2xl">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Selected Seats</span>
                  <span className="text-lg font-bold text-primary">{selectedSeats.join(", ")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Passengers</span>
                  <span className="text-lg font-bold">{selectedSeats.length}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-base font-semibold">Total Fare</span>
                  <span className="text-2xl font-bold text-primary">₹{totalFare}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {maxSeats - selectedSeats.length} more seat{maxSeats - selectedSeats.length !== 1 ? 's' : ''} available (max {maxSeats})
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
