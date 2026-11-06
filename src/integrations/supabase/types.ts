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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string | null
          client_name: string
          client_phone: string
          created_at: string
          duration_min: number
          employee_id: string | null
          id: string
          notes: string
          price_snapshot: string
          salon_id: string
          service: string
          service_id: string | null
          starts_at: string
          status: string
        }
        Insert: {
          client_id?: string | null
          client_name: string
          client_phone?: string
          created_at?: string
          duration_min?: number
          employee_id?: string | null
          id?: string
          notes?: string
          price_snapshot?: string
          salon_id: string
          service?: string
          service_id?: string | null
          starts_at: string
          status?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          duration_min?: number
          employee_id?: string | null
          id?: string
          notes?: string
          price_snapshot?: string
          salon_id?: string
          service?: string
          service_id?: string | null
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "salon_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "salon_services"
            referencedColumns: ["id"]
          },
        ]
      }
      lash_styles: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          address: string | null
          city: string | null
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          nip: string | null
          status: string
        }
        Insert: {
          account_type?: string
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id: string
          nip?: string | null
          status?: string
        }
        Update: {
          account_type?: string
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nip?: string | null
          status?: string
        }
        Relationships: []
      }
      salon_booking_hours: {
        Row: {
          closes_min: number
          enabled: boolean
          opens_min: number
          salon_id: string
          weekday: number
        }
        Insert: {
          closes_min?: number
          enabled?: boolean
          opens_min?: number
          salon_id: string
          weekday: number
        }
        Update: {
          closes_min?: number
          enabled?: boolean
          opens_min?: number
          salon_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "salon_booking_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_employees: {
        Row: {
          avatar_url: string | null
          color: string
          created_at: string
          id: string
          name: string
          phone: string
          role: string
          salon_id: string
        }
        Insert: {
          avatar_url?: string | null
          color?: string
          created_at?: string
          id?: string
          name: string
          phone?: string
          role?: string
          salon_id: string
        }
        Update: {
          avatar_url?: string | null
          color?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          role?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_employees_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_photos: {
        Row: {
          caption: string
          created_at: string
          custom_style: string
          id: string
          salon_id: string
          style_slug: string | null
          url: string
        }
        Insert: {
          caption?: string
          created_at?: string
          custom_style?: string
          id?: string
          salon_id: string
          style_slug?: string | null
          url: string
        }
        Update: {
          caption?: string
          created_at?: string
          custom_style?: string
          id?: string
          salon_id?: string
          style_slug?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_photos_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_services: {
        Row: {
          created_at: string
          description: string
          duration_min: number
          id: string
          name: string
          price: string
          salon_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          duration_min?: number
          id?: string
          name: string
          price?: string
          salon_id: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_min?: number
          id?: string
          name?: string
          price?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          city: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          owner_id: string | null
          portfolio: Json
          price: string
          rating: number
          reviews: number
          stylist: string
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          owner_id?: string | null
          portfolio?: Json
          price?: string
          rating?: number
          reviews?: number
          stylist?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          owner_id?: string | null
          portfolio?: Json
          price?: string
          rating?: number
          reviews?: number
          stylist?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      book_appointment: {
        Args: {
          p_appointment?: string
          p_employee: string
          p_name: string
          p_notes?: string
          p_phone: string
          p_salon: string
          p_service: string
          p_start: string
        }
        Returns: string
      }
      booking_salons: {
        Args: never
        Returns: {
          city: string
          id: string
          image_url: string
          name: string
          stylist: string
        }[]
      }
      booking_slots: {
        Args: {
          p_day: string
          p_employee: string
          p_exclude?: string
          p_salon: string
          p_service: string
        }
        Returns: {
          starts_at: string
        }[]
      }
      cancel_my_appointment: { Args: { p_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_appointments: {
        Args: never
        Returns: {
          city: string
          client_name: string
          client_phone: string
          duration_min: number
          employee_id: string
          employee_name: string
          id: string
          price: string
          salon_id: string
          salon_name: string
          service: string
          service_id: string
          starts_at: string
          status: string
        }[]
      }
      owns_salon: { Args: { _salon_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
