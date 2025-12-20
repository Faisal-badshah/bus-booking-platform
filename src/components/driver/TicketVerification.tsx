import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, User } from "lucide-react";

interface VerificationResult {
  success: boolean;
  booking_id?: string;
  passenger_name?: string;
  seat_number?: string;
  status?: string;
  already_boarded?: boolean;
  message?: string;
}

interface TicketVerificationProps {
  result: VerificationResult | null;
  onMarkBoarded: () => void;
  onClear: () => void;
  isMarking?: boolean;
}

export const TicketVerification = ({
  result,
  onMarkBoarded,
  onClear,
  isMarking = false,
}: TicketVerificationProps) => {
  if (!result) return null;

  const getStatusColor = () => {
    if (!result.success) return "destructive";
    if (result.already_boarded) return "secondary";
    return "default";
  };

  const getStatusIcon = () => {
    if (!result.success) return <XCircle className="h-5 w-5" />;
    if (result.already_boarded) return <AlertCircle className="h-5 w-5" />;
    return <CheckCircle2 className="h-5 w-5" />;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Verification Result
          </CardTitle>
          <Badge variant={getStatusColor()}>
            {result.already_boarded
              ? "Already Boarded"
              : result.success
              ? "Valid"
              : "Invalid"}
          </Badge>
        </div>
        <CardDescription>
          {result.message || "Ticket verification completed"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.success && result.passenger_name && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Passenger</p>
                <p className="font-semibold">{result.passenger_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Seat Number</p>
                <p className="font-semibold">{result.seat_number}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{result.status}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {result.success && !result.already_boarded && (
            <Button
              onClick={onMarkBoarded}
              disabled={isMarking}
              className="flex-1"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isMarking ? "Marking..." : "Mark as Boarded"}
            </Button>
          )}
          <Button onClick={onClear} variant="outline" className="flex-1">
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
