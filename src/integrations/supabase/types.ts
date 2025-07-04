export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Connection: {
        Row: {
          city: string | null
          country: string | null
          createdAt: string
          id: string
          latitude: number
          location: string | null
          longitude: number
          name: string
          notes: string | null
          relationship: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          createdAt?: string
          id: string
          latitude: number
          location?: string | null
          longitude: number
          name: string
          notes?: string | null
          relationship?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          city?: string | null
          country?: string | null
          createdAt?: string
          id?: string
          latitude?: number
          location?: string | null
          longitude?: number
          name?: string
          notes?: string | null
          relationship?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Connection_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          contact_number: string
          created_at: string
          id: string
          name: string
          trip_id: string
          type: string
        }
        Insert: {
          contact_number: string
          created_at?: string
          id?: string
          name: string
          trip_id: string
          type: string
        }
        Update: {
          contact_number?: string
          created_at?: string
          id?: string
          name?: string
          trip_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invitations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["invitation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_role_requirements: {
        Row: {
          created_at: string
          event_id: string
          id: string
          quantity: number
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          quantity?: number
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          quantity?: number
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "event_role_requirements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          current_participants: number | null
          date: string
          description: string | null
          end_date: string | null
          id: string
          last_edited_by: string | null
          location: string | null
          max_participants: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_participants?: number | null
          date: string
          description?: string | null
          end_date?: string | null
          id?: string
          last_edited_by?: string | null
          location?: string | null
          max_participants?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_participants?: number | null
          date?: string
          description?: string | null
          end_date?: string | null
          id?: string
          last_edited_by?: string | null
          location?: string | null
          max_participants?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gear: {
        Row: {
          available: number
          condition: string
          created_at: string | null
          id: string
          last_edited_by: string | null
          last_maintenance: string | null
          name: string
          notes: string | null
          photo_url: string | null
          quantity: number
          type: string
          updated_at: string | null
          uploaded_at: string | null
        }
        Insert: {
          available?: number
          condition?: string
          created_at?: string | null
          id?: string
          last_edited_by?: string | null
          last_maintenance?: string | null
          name: string
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          type: string
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Update: {
          available?: number
          condition?: string
          created_at?: string | null
          id?: string
          last_edited_by?: string | null
          last_maintenance?: string | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          type?: string
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Relationships: []
      }
      gear_events: {
        Row: {
          created_at: string | null
          event_id: string | null
          gear_id: string | null
          id: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          gear_id?: string | null
          id?: string
          quantity?: number
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          gear_id?: string | null
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "gear_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gear_events_gear_id_fkey"
            columns: ["gear_id"]
            isOneToOne: false
            referencedRelation: "gear"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_items: {
        Row: {
          activity: string | null
          created_at: string
          day: number
          id: string
          location: string | null
          time: string | null
          trip_id: string
        }
        Insert: {
          activity?: string | null
          created_at?: string
          day: number
          id?: string
          location?: string | null
          time?: string | null
          trip_id: string
        }
        Update: {
          activity?: string | null
          created_at?: string
          day?: number
          id?: string
          location?: string | null
          time?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          content_id: string
          created_at: string
          description: string | null
          id: string
          title: string | null
          type: string
          updated_at: string
          url: string
          user_id: string | null
        }
        Insert: {
          content_id: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string | null
          type: string
          updated_at?: string
          url: string
          user_id?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string | null
          type?: string
          updated_at?: string
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_documents: {
        Row: {
          created_at: string
          file_path: string
          id: string
          name: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          name: string
          trip_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          name?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_gear_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          gear_id: string | null
          id: string
          status: string
          trip_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          gear_id?: string | null
          id?: string
          status?: string
          trip_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          gear_id?: string | null
          id?: string
          status?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_gear_items_gear_id_fkey"
            columns: ["gear_id"]
            isOneToOne: false
            referencedRelation: "gear"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_gear_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_participants: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          role?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          email: string
          id: string
        }
        Insert: {
          createdAt?: string
          email: string
          id: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_past_trips_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          date: string
          end_date: string
          location: string
          gear_total: number
          gear_packed: number
          participant_count: number
        }[]
      }
      get_upcoming_trips_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          date: string
          end_date: string
          location: string
          gear_total: number
          gear_packed: number
          participant_count: number
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "President"
        | "Vice-President"
        | "Honorary Secretary"
        | "Honorary Assistant Secretary"
        | "Honorary Treasurer"
        | "Honorary Assistant Treasurer"
        | "Training Head (General)"
        | "Training Head (Land)"
        | "Training Head (Water)"
        | "Training Head (Welfare)"
        | "Quartermaster"
        | "Assistant Quarter Master"
        | "Publicity Head"
        | "First Assistant Publicity Head"
        | "Second Assistant Publicity Head"
        | "Member"
      invitation_status: "pending" | "accepted" | "declined"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "President",
        "Vice-President",
        "Honorary Secretary",
        "Honorary Assistant Secretary",
        "Honorary Treasurer",
        "Honorary Assistant Treasurer",
        "Training Head (General)",
        "Training Head (Land)",
        "Training Head (Water)",
        "Training Head (Welfare)",
        "Quartermaster",
        "Assistant Quarter Master",
        "Publicity Head",
        "First Assistant Publicity Head",
        "Second Assistant Publicity Head",
        "Member",
      ],
      invitation_status: ["pending", "accepted", "declined"],
    },
  },
} as const
