export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      boarding_logs: {
        Row: {
          boarded_at: string | null
          booking_id: string
          id: string
          metadata: Json | null
          trip_id: string
          verification_method: string
          verified_by: string | null
        }
        Insert: {
          boarded_at?: string | null
          booking_id: string
          id?: string
          metadata?: Json | null
          trip_id: string
          verification_method: string
          verified_by?: string | null
        }
        Update: {
          boarded_at?: string | null
          booking_id?: string
          id?: string
          metadata?: Json | null
          trip_id?: string
          verification_method?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boarding_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_logs: {
        Row: {
          booking_group_id: string | null
          booking_id: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          booking_group_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          booking_group_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string | null
          booking_group_id: string | null
          cancellation_requested: boolean | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string | null
          from_index: number
          id: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          payment_reference: string | null
          refund_amount: number | null
          seat_number: number
          seat_numbers: string[]
          status: string
          ticket_url: string | null
          to_index: number
          total_amount: number
          trip_id: string
          user_id: string
        }
        Insert: {
          booking_date?: string | null
          booking_group_id?: string | null
          cancellation_requested?: boolean | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          from_index: number
          id?: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          payment_reference?: string | null
          refund_amount?: number | null
          seat_number: number
          seat_numbers: string[]
          status?: string
          ticket_url?: string | null
          to_index: number
          total_amount: number
          trip_id: string
          user_id: string
        }
        Update: {
          booking_date?: string | null
          booking_group_id?: string | null
          cancellation_requested?: boolean | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          from_index?: number
          id?: string
          passenger_email?: string
          passenger_name?: string
          passenger_phone?: string
          payment_reference?: string | null
          refund_amount?: number | null
          seat_number?: number
          seat_numbers?: string[]
          status?: string
          ticket_url?: string | null
          to_index?: number
          total_amount?: number
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          created_at: string | null
          id: string
          name: string
          seat_count: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          seat_count?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          seat_count?: number
        }
        Relationships: []
      }
      cancellations: {
        Row: {
          booking_id: string
          id: string
          processed_at: string | null
          reason: string | null
          refund_amount: number
          requested_at: string | null
          status: string
        }
        Insert: {
          booking_id: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          refund_amount: number
          requested_at?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          refund_amount?: number
          requested_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      client_limits: {
        Row: {
          client_id: string
          created_at: string
          gps_enabled: boolean
          gps_trial_end: string
          max_buses: number
          max_seats_per_bus: number
          notes: string | null
          plan_name: string | null
          tracking_enabled: boolean | null
          tracking_trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          gps_enabled?: boolean
          gps_trial_end?: string
          max_buses?: number
          max_seats_per_bus?: number
          notes?: string | null
          plan_name?: string | null
          tracking_enabled?: boolean | null
          tracking_trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          gps_enabled?: boolean
          gps_trial_end?: string
          max_buses?: number
          max_seats_per_bus?: number
          notes?: string | null
          plan_name?: string | null
          tracking_enabled?: boolean | null
          tracking_trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      live_locations: {
        Row: {
          heading: number | null
          id: string
          latitude: number
          longitude: number
          speed: number | null
          staff_id: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          speed?: number | null
          staff_id: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          staff_id?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          booking_group_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          payment_reference: string
          processed_at: string | null
          status: string
        }
        Insert: {
          amount: number
          booking_group_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          payment_reference: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          booking_group_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          payment_reference?: string
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          id: string
          payment_method: string | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      routes: {
        Row: {
          base_price_per_segment: number
          created_at: string | null
          id: string
          name: string
          prices_per_segment: number[] | null
          stops: string[]
        }
        Insert: {
          base_price_per_segment?: number
          created_at?: string | null
          id?: string
          name: string
          prices_per_segment?: number[] | null
          stops: string[]
        }
        Update: {
          base_price_per_segment?: number
          created_at?: string | null
          id?: string
          name?: string
          prices_per_segment?: number[] | null
          stops?: string[]
        }
        Relationships: []
      }
      staff_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_trip_assignments: {
        Row: {
          assignment_date: string
          created_at: string | null
          id: string
          staff_id: string
          trip_id: string
        }
        Insert: {
          assignment_date: string
          created_at?: string | null
          id?: string
          staff_id: string
          trip_id: string
        }
        Update: {
          assignment_date?: string
          created_at?: string | null
          id?: string
          staff_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_trip_assignments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      superadmin_logs: {
        Row: {
          action: string
          client_id: string
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          super_admin_id: string
        }
        Insert: {
          action: string
          client_id: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          super_admin_id: string
        }
        Update: {
          action?: string
          client_id?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          super_admin_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          allow_mock_webhook_simulation: boolean | null
          booking_mode: string
          created_at: string | null
          festival_force_online: boolean | null
          id: string
          max_seats_per_booking: number | null
          online_payment_disable_from: string | null
          online_payment_disable_to: string | null
          online_payment_distance_threshold: number | null
          online_payment_weekends: boolean | null
          updated_at: string | null
          use_real_payment_gateway: boolean | null
        }
        Insert: {
          allow_mock_webhook_simulation?: boolean | null
          booking_mode?: string
          created_at?: string | null
          festival_force_online?: boolean | null
          id?: string
          max_seats_per_booking?: number | null
          online_payment_disable_from?: string | null
          online_payment_disable_to?: string | null
          online_payment_distance_threshold?: number | null
          online_payment_weekends?: boolean | null
          updated_at?: string | null
          use_real_payment_gateway?: boolean | null
        }
        Update: {
          allow_mock_webhook_simulation?: boolean | null
          booking_mode?: string
          created_at?: string | null
          festival_force_online?: boolean | null
          id?: string
          max_seats_per_booking?: number | null
          online_payment_disable_from?: string | null
          online_payment_disable_to?: string | null
          online_payment_distance_threshold?: number | null
          online_payment_weekends?: boolean | null
          updated_at?: string | null
          use_real_payment_gateway?: boolean | null
        }
        Relationships: []
      }
      tracking_subscription: {
        Row: {
          created_at: string | null
          id: string
          is_trial_active: boolean | null
          tracking_enabled: boolean | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_trial_active?: boolean | null
          tracking_enabled?: boolean | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_trial_active?: boolean | null
          tracking_enabled?: boolean | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          arrival_time: string
          available_seats: number
          bus_id: string
          created_at: string | null
          departure_time: string
          end_date: string
          from_city: string
          id: string
          max_booking_days_ahead: number
          owner_reserved_seats: string[] | null
          price: number
          recurrence_days: number[] | null
          recurrence_type: string
          route: string
          route_id: string
          start_date: string
          status: string | null
          to_city: string
          trip_date: string
        }
        Insert: {
          arrival_time: string
          available_seats: number
          bus_id: string
          created_at?: string | null
          departure_time: string
          end_date?: string
          from_city: string
          id?: string
          max_booking_days_ahead?: number
          owner_reserved_seats?: string[] | null
          price: number
          recurrence_days?: number[] | null
          recurrence_type?: string
          route: string
          route_id: string
          start_date?: string
          status?: string | null
          to_city: string
          trip_date: string
        }
        Update: {
          arrival_time?: string
          available_seats?: number
          bus_id?: string
          created_at?: string | null
          departure_time?: string
          end_date?: string
          from_city?: string
          id?: string
          max_booking_days_ahead?: number
          owner_reserved_seats?: string[] | null
          price?: number
          recurrence_days?: number[] | null
          recurrence_type?: string
          route?: string
          route_id?: string
          start_date?: string
          status?: string | null
          to_city?: string
          trip_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      begin_multi_seat_booking:
        | {
            Args: {
              p_booking_group_id: string
              p_fare_per_seat: number
              p_from_index: number
              p_passengers: Json
              p_seat_numbers: number[]
              p_to_index: number
              p_trip_id: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_booking_date: string
              p_booking_group_id: string
              p_fare_per_seat: number
              p_from_index: number
              p_passengers: Json
              p_seat_numbers: number[]
              p_to_index: number
              p_trip_id: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_booking_date: string
              p_from_stop: string
              p_passengers: Json[]
              p_seat_numbers: number[]
              p_to_stop: string
              p_trip_id: string
              p_user_id: string
            }
            Returns: Json
          }
      check_bus_limit: { Args: never; Returns: Json }
      create_bus_with_limit_check: {
        Args: { p_name: string; p_seat_count: number }
        Returns: Json
      }
      get_analytics_cancellation_stats: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_analytics_passenger_stats: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_analytics_revenue_stats: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_analytics_route_stats: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_analytics_tracking_stats: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_analytics_trip_stats: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_fleet_overview: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_booking_expired: {
        Args: { booking_row: Database["public"]["Tables"]["bookings"]["Row"] }
        Returns: boolean
      }
      log_booking_event: {
        Args: {
          p_booking_group_id?: string
          p_booking_id?: string
          p_event_type: string
          p_metadata?: Json
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "staff" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "staff", "super_admin"],
    },
  },
} as const
