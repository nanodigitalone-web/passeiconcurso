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
      battles: {
        Row: {
          categoria_id: string
          challenger_done: boolean
          challenger_id: string
          challenger_score: number | null
          concurso_id: string
          created_at: string
          id: string
          opponent_done: boolean
          opponent_id: string
          opponent_score: number | null
          question_ids: Json
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          categoria_id: string
          challenger_done?: boolean
          challenger_id: string
          challenger_score?: number | null
          concurso_id: string
          created_at?: string
          id?: string
          opponent_done?: boolean
          opponent_id: string
          opponent_score?: number | null
          question_ids: Json
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          categoria_id?: string
          challenger_done?: boolean
          challenger_id?: string
          challenger_score?: number | null
          concurso_id?: string
          created_at?: string
          id?: string
          opponent_done?: boolean
          opponent_id?: string
          opponent_score?: number | null
          question_ids?: Json
          status?: string
          updated_at?: string
          winner_id?: string | null
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
      coin_topup_requests: {
        Row: {
          amount_aoa: number
          comprovativo_url: string
          created_at: string
          email: string | null
          id: string
          moedas: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_aoa: number
          comprovativo_url: string
          created_at?: string
          email?: string | null
          id?: string
          moedas: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_aoa?: number
          comprovativo_url?: string
          created_at?: string
          email?: string | null
          id?: string
          moedas?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          descricao: string | null
          id: string
          meta: Json | null
          tipo: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          descricao?: string | null
          id?: string
          meta?: Json | null
          tipo: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          descricao?: string | null
          id?: string
          meta?: Json | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      cursos_preparatorios: {
        Row: {
          ativo: boolean
          concurso_id: string
          contacto: string | null
          created_at: string
          descricao: string | null
          id: string
          link_externo: string | null
          logo_url: string | null
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          concurso_id: string
          contacto?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          link_externo?: string | null
          logo_url?: string | null
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          concurso_id?: string
          contacto?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          link_externo?: string | null
          logo_url?: string | null
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
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
      points_log: {
        Row: {
          created_at: string
          delta: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
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
          friend_code: string | null
          hidden: boolean
          iban: string | null
          id: string
          last_seen: string | null
          moedas: number
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
          friend_code?: string | null
          hidden?: boolean
          iban?: string | null
          id: string
          last_seen?: string | null
          moedas?: number
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
          friend_code?: string | null
          hidden?: boolean
          iban?: string | null
          id?: string
          last_seen?: string | null
          moedas?: number
          nome?: string
          pontos?: number
          streak?: number
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_notified_at: string | null
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_notified_at?: string | null
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_notified_at?: string | null
          p256dh?: string
          updated_at?: string
          user_id?: string
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
      withdrawal_requests: {
        Row: {
          aoa: number
          created_at: string
          email: string | null
          iban: string
          id: string
          moedas: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aoa: number
          created_at?: string
          email?: string | null
          iban: string
          id?: string
          moedas: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aoa?: number
          created_at?: string
          email?: string | null
          iban?: string
          id?: string
          moedas?: number
          status?: string
          updated_at?: string
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
      add_friend_by_code: { Args: { _code: string }; Returns: Json }
      add_points: { Args: { _delta: number }; Returns: undefined }
      admin_credit_coins: {
        Args: { _amount: number; _desc: string; _user: string }
        Returns: Json
      }
      admin_generate_codes: {
        Args: { _cat: string; _conc: string; _count: number }
        Returns: number
      }
      coin_access_cost: { Args: { _conc: string }; Returns: number }
      coin_grant_access: {
        Args: { _cat: string; _conc: string; _user: string }
        Returns: undefined
      }
      convert_points_to_coins: { Args: { _points: number }; Returns: Json }
      gen_friend_code: { Args: never; Returns: string }
      get_battles: {
        Args: never
        Returns: {
          categoria_id: string
          challenger_done: boolean
          challenger_id: string
          challenger_score: number
          concurso_id: string
          created_at: string
          id: string
          opponent_avatar: string
          opponent_done: boolean
          opponent_id: string
          opponent_nome: string
          opponent_score: number
          question_ids: Json
          status: string
          winner_id: string
        }[]
      }
      get_friends: {
        Args: never
        Returns: {
          avatar_url: string
          categoria_nome: string
          direction: string
          friend_id: string
          friendship_id: string
          nome: string
          pontos: number
          status: string
        }[]
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
      get_weekly_ranking: {
        Args: never
        Returns: {
          avatar_url: string
          categoria_nome: string
          id: string
          nome: string
          pontos: number
        }[]
      }
      gift_access_with_coins: {
        Args: { _cat: string; _conc: string; _to: string }
        Returns: Json
      }
      gift_coins: { Args: { _amount: number; _to: string }; Returns: Json }
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
      purchase_access_with_coins: {
        Args: { _cat: string; _conc: string }
        Returns: Json
      }
      request_withdrawal: {
        Args: { _iban: string; _moedas: number }
        Returns: Json
      }
      respond_friend_request: {
        Args: { _accept: boolean; _id: string }
        Returns: Json
      }
      search_users: {
        Args: { _q: string }
        Returns: {
          avatar_url: string
          categoria_nome: string
          friend_code: string
          id: string
          nome: string
        }[]
      }
      send_friend_request: { Args: { _to: string }; Returns: Json }
      submit_battle_result: {
        Args: { _battle: string; _score: number }
        Returns: Json
      }
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
