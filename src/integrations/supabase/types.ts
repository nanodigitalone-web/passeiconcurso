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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_codes: {
        Row: {
          categoria_id: string
          code: string
          concurso_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["access_code_status"]
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          categoria_id: string
          code: string
          concurso_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["access_code_status"]
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          categoria_id?: string
          code?: string
          concurso_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["access_code_status"]
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      category_access: {
        Row: {
          activated_at: string
          categoria_id: string
          code: string | null
          concurso_id: string
          expires_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          categoria_id: string
          code?: string | null
          concurso_id: string
          expires_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          categoria_id?: string
          code?: string | null
          concurso_id?: string
          expires_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          categoria_id: string
          categoria_nome: string | null
          comprovativo_url: string | null
          concurso_id: string
          created_at: string
          email: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["payment_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria_id: string
          categoria_nome?: string | null
          comprovativo_url?: string | null
          concurso_id: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["payment_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria_id?: string
          categoria_nome?: string | null
          comprovativo_url?: string | null
          concurso_id?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["payment_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocked: boolean
          categoria_id: string | null
          categoria_nome: string | null
          concurso_id: string | null
          created_at: string
          email: string | null
          hidden: boolean
          id: string
          last_seen: string | null
          nome: string
          pontos: number
          streak: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocked?: boolean
          categoria_id?: string | null
          categoria_nome?: string | null
          concurso_id?: string | null
          created_at?: string
          email?: string | null
          hidden?: boolean
          id: string
          last_seen?: string | null
          nome?: string
          pontos?: number
          streak?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocked?: boolean
          categoria_id?: string | null
          categoria_nome?: string | null
          concurso_id?: string | null
          created_at?: string
          email?: string | null
          hidden?: boolean
          id?: string
          last_seen?: string | null
          nome?: string
          pontos?: number
          streak?: number
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_access_code: {
        Args: { _cat: string; _code: string; _conc: string }
        Returns: Json
      }
      admin_generate_codes: {
        Args: { _cat: string; _conc: string; _count: number }
        Returns: number
      }
      get_ranking: {
        Args: { _categoria?: string }
        Returns: {
          avatar_url: string
          categoria_nome: string
          id: string
          nome: string
          pontos: number
        }[]
      }
      has_category_access: {
        Args: { _cat: string; _conc: string; _user: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      access_code_status: "available" | "used" | "revoked"
      app_role: "admin" | "user"
      payment_request_status:
        | "pending"
        | "awaiting_review"
        | "approved"
        | "rejected"
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
      access_code_status: ["available", "used", "revoked"],
      app_role: ["admin", "user"],
      payment_request_status: [
        "pending",
        "awaiting_review",
        "approved",
        "rejected",
      ],
    },
  },
} as const
