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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      children: {
        Row: {
          about: string | null
          age: number | null
          allergies: string | null
          avatar_url: string | null
          created_at: string
          full_name: string
          gender: string | null
          id: string
          parent_user_id: string
          phone: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          age?: number | null
          allergies?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name: string
          gender?: string | null
          id?: string
          parent_user_id: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          age?: number | null
          allergies?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          parent_user_id?: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          created_at: string
          driver_user_id: string
          full_name: string
          id: string
          id_image_url: string | null
          license_expiry: string | null
          license_image_url: string | null
          license_number: string
          phone: string | null
          qr_token: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_user_id: string
          full_name: string
          id?: string
          id_image_url?: string | null
          license_expiry?: string | null
          license_image_url?: string | null
          license_number: string
          phone?: string | null
          qr_token?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_user_id?: string
          full_name?: string
          id?: string
          id_image_url?: string | null
          license_expiry?: string | null
          license_image_url?: string | null
          license_number?: string
          phone?: string | null
          qr_token?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      gps_pings: {
        Row: {
          heading: number | null
          id: string
          lat: number
          lng: number
          recorded_at: string
          speed: number | null
          vehicle_id: string
        }
        Insert: {
          heading?: number | null
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          speed?: number | null
          vehicle_id: string
        }
        Update: {
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          speed?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_pings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          mute_until: string | null
          parent_phone: string | null
          parent_user_id: string
          push_enabled: boolean
          radius_meters: number
          ring_enabled: boolean
          ring_volume: number
          sms_enabled: boolean
          student_id: string
          updated_at: string
          vibration_enabled: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          mute_until?: string | null
          parent_phone?: string | null
          parent_user_id: string
          push_enabled?: boolean
          radius_meters?: number
          ring_enabled?: boolean
          ring_volume?: number
          sms_enabled?: boolean
          student_id: string
          updated_at?: string
          vibration_enabled?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          mute_until?: string | null
          parent_phone?: string | null
          parent_user_id?: string
          push_enabled?: boolean
          radius_meters?: number
          ring_enabled?: boolean
          ring_volume?: number
          sms_enabled?: boolean
          student_id?: string
          updated_at?: string
          vibration_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_drivers: {
        Row: {
          added_via: string
          created_at: string
          driver_user_id: string
          id: string
          parent_user_id: string
        }
        Insert: {
          added_via?: string
          created_at?: string
          driver_user_id: string
          id?: string
          parent_user_id: string
        }
        Update: {
          added_via?: string
          created_at?: string
          driver_user_id?: string
          id?: string
          parent_user_id?: string
        }
        Relationships: []
      }
      parent_students: {
        Row: {
          created_at: string
          id: string
          parent_user_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_user_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_user_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          target_user_id?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          created_at: string
          description: string | null
          end_location: string
          id: string
          name: string
          school_id: string | null
          start_location: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_location: string
          id?: string
          name: string
          school_id?: string | null
          start_location: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_location?: string
          id?: string
          name?: string
          school_id?: string | null
          start_location?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          admin_user_id: string
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_user_id: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_user_id?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_log: {
        Row: {
          body: string
          created_at: string
          error: string | null
          id: string
          parent_user_id: string | null
          provider: string
          status: string
          student_id: string | null
          to_phone: string
          vehicle_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          error?: string | null
          id?: string
          parent_user_id?: string | null
          provider?: string
          status?: string
          student_id?: string | null
          to_phone: string
          vehicle_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          error?: string | null
          id?: string
          parent_user_id?: string | null
          provider?: string
          status?: string
          student_id?: string | null
          to_phone?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_phone: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          route_id: string | null
          school_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_phone?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          route_id?: string | null
          school_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_phone?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          route_id?: string | null
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_logs: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          route_id: string | null
          started_at: string | null
          status: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          route_id?: string | null
          started_at?: string | null
          status?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          route_id?: string | null
          started_at?: string | null
          status?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_logs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          driver_name: string
          driver_user_id: string | null
          id: string
          lat: number
          lng: number
          plate_number: string
          school_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_name: string
          driver_user_id?: string | null
          id?: string
          lat?: number
          lng?: number
          plate_number: string
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_name?: string
          driver_user_id?: string | null
          id?: string
          lat?: number
          lng?: number
          plate_number?: string
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_self_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_school_admin: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      link_driver_by_qr: { Args: { _qr_token: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "operator" | "parent" | "driver" | "school"
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
      app_role: ["admin", "operator", "parent", "driver", "school"],
    },
  },
} as const
