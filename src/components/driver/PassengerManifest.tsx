import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, Users } from "lucide-react";

interface Passenger {
  booking_id: string;
  passenger_name: string;
  seat_number: number;
  passenger_phone: string;
  status: string;
  boarded?: boolean;
}

interface PassengerManifestProps {
  passengers: Passenger[];
}

export const PassengerManifest = ({ passengers }: PassengerManifestProps) => {
  const [filter, setFilter] = useState<"all" | "pending" | "boarded">("all");

  const filteredPassengers = useMemo(() => {
    if (filter === "all") return passengers;
    if (filter === "pending") return passengers.filter((p) => !p.boarded);
    return passengers.filter((p) => p.boarded);
  }, [passengers, filter]);

  const stats = useMemo(() => {
    const total = passengers.length;
    const boarded = passengers.filter((p) => p.boarded).length;
    const pending = total - boarded;
    return { total, boarded, pending };
  }, [passengers]);

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(0, -4).replace(/./g, "*") + phone.slice(-4);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Passenger Manifest
        </CardTitle>
        <CardDescription>Today's passenger list and boarding status</CardDescription>
        <div className="grid grid-cols-3 gap-3 pt-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Boarded</p>
            <p className="text-2xl font-bold text-green-600">{stats.boarded}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="boarded">Boarded ({stats.boarded})</TabsTrigger>
          </TabsList>
          <TabsContent value={filter} className="mt-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPassengers.length > 0 ? (
                    filteredPassengers.map((passenger) => (
                      <TableRow key={passenger.booking_id}>
                        <TableCell className="font-medium">
                          {passenger.passenger_name}
                        </TableCell>
                        <TableCell>{passenger.seat_number}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {maskPhone(passenger.passenger_phone)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={passenger.boarded ? "default" : "secondary"}
                            className="flex items-center gap-1 w-fit"
                          >
                            {passenger.boarded ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Boarded
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" />
                                Pending
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No passengers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
