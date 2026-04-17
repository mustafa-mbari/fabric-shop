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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          phone: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          phone: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price_per_unit: number
          product_name: string
          quantity: number
          total_price: number | null
        }
        Insert: {
          id?: string
          order_id: string
          price_per_unit: number
          product_name: string
          quantity: number
          total_price?: number | null
        }
        Update: {
          id?: string
          order_id?: string
          price_per_unit?: number
          product_name?: string
          quantity?: number
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_active"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string | null
          customer_name: string | null
          deleted_at: string | null
          delivery_date: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_active"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          quantity: number
          type: Database["public"]["Enums"]["product_type"]
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          quantity?: number
          type: Database["public"]["Enums"]["product_type"]
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          quantity?: number
          type?: Database["public"]["Enums"]["product_type"]
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
        }
        Relationships: []
      }
    }
    Views: {
      customers_active: {
        Row: {
          address: string | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          name: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      orders_active: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          deleted_at: string | null
          delivery_date: string | null
          id: string | null
          notes: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_price: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          delivery_date?: string | null
          id?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_price?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          delivery_date?: string | null
          id?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_active"
            referencedColumns: ["id"]
          },
        ]
      }
      products_active: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string | null
          name: string | null
          quantity: number | null
          type: Database["public"]["Enums"]["product_type"] | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          quantity?: number | null
          type?: Database["public"]["Enums"]["product_type"] | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          quantity?: number | null
          type?: Database["public"]["Enums"]["product_type"] | null
        }
        Relationships: []
      }
      users_active: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          full_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_order_with_items: {
        Args: {
          p_created_by: string
          p_customer_id: string
          p_customer_name: string
          p_delivery_date: string
          p_items: Json
          p_notes: string
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: string
      }
      is_manager: { Args: never; Returns: boolean }
    }
    Enums: {
      debt_type: "WHOLESALE" | "RETAIL"
      order_status: "NEW" | "IN_PROGRESS" | "ON_HOLD" | "READY" | "DELIVERED"
      product_type: "METER" | "UNIT"
      user_role: "worker" | "manager"
      user_status: "pending" | "active" | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      debt_type: ["WHOLESALE", "RETAIL"],
      order_status: ["NEW", "IN_PROGRESS", "ON_HOLD", "READY", "DELIVERED"],
      product_type: ["METER", "UNIT"],
      user_role: ["worker", "manager"],
      user_status: ["pending", "active", "rejected"],
    },
  },
} as const
