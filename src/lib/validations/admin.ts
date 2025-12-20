import { z } from "zod";

export const busSchema = z.object({
  name: z.string().min(1, "Bus name is required").max(100, "Bus name must be less than 100 characters"),
  seat_count: z.number().int("Seat count must be a whole number").min(10, "Minimum 10 seats required").max(100, "Maximum 100 seats allowed"),
});

export const tripSchema = z.object({
  bus_id: z.string().uuid("Invalid bus selection"),
  route_id: z.string().uuid("Invalid route selection"),
  departure_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  arrival_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  recurrence_type: z.enum(["fixed", "daily", "weekly", "custom"], {
    errorMap: () => ({ message: "Invalid recurrence type" })
  }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format"),
  max_booking_days_ahead: z.number().int("Must be a whole number").min(1, "Minimum 1 day").max(365, "Maximum 365 days"),
  recurrence_days: z.array(z.number().int().min(0).max(6)).optional(),
  owner_reserved_seats: z.array(z.string()).optional(),
  status: z.enum(["active", "disabled"]).optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: "End date must be after or equal to start date", path: ["end_date"] }
).refine(
  (data) => {
    if (data.recurrence_type === "weekly" || data.recurrence_type === "custom") {
      return data.recurrence_days && data.recurrence_days.length > 0;
    }
    return true;
  },
  { message: "Recurrence days required for weekly/custom", path: ["recurrence_days"] }
);

export const bookingStatusSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "cancellation_requested", "pending"], {
    errorMap: () => ({ message: "Invalid status" })
  }),
});

export const cancellationActionSchema = z.object({
  action: z.enum(["approve", "reject"], {
    errorMap: () => ({ message: "Invalid action" })
  }),
});

export type BusFormData = z.infer<typeof busSchema>;
export type TripFormData = z.infer<typeof tripSchema>;
export type BookingStatusData = z.infer<typeof bookingStatusSchema>;
export type CancellationActionData = z.infer<typeof cancellationActionSchema>;
