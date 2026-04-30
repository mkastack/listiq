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
      articles: {
        Row: {
          author_id: string | null
          body: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_ai_generated: boolean
          listing_id: string | null
          published_at: string | null
          read_minutes: number
          slug: string
          source_url: string | null
          status: Database["public"]["Enums"]["article_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_ai_generated?: boolean
          listing_id?: string | null
          published_at?: string | null
          read_minutes?: number
          slug: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_ai_generated?: boolean
          listing_id?: string | null
          published_at?: string | null
          read_minutes?: number
          slug?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          listing_count: number
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          listing_count?: number
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          listing_count?: number
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_views: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          viewer_ip: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          viewer_ip?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          category: string
          city: string | null
          claim_status: Database["public"]["Enums"]["claim_status"]
          claimed_by: string | null
          country: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          gallery_images: string[] | null
          hours_of_operation: Json | null
          id: string
          is_claimed: boolean
          is_featured: boolean
          is_verified: boolean
          keywords: string[] | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string | null
          phone: string | null
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          rating_avg: number
          rating_count: number
          region: string | null
          short_description: string | null
          slug: string
          social_links: Json | null
          status: Database["public"]["Enums"]["listing_status"]
          subcategory: string | null
          updated_at: string
          views_count: number
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          category: string
          city?: string | null
          claim_status?: Database["public"]["Enums"]["claim_status"]
          claimed_by?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          gallery_images?: string[] | null
          hours_of_operation?: Json | null
          id?: string
          is_claimed?: boolean
          is_featured?: boolean
          is_verified?: boolean
          keywords?: string[] | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          rating_avg?: number
          rating_count?: number
          region?: string | null
          short_description?: string | null
          slug: string
          social_links?: Json | null
          status?: Database["public"]["Enums"]["listing_status"]
          subcategory?: string | null
          updated_at?: string
          views_count?: number
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          claim_status?: Database["public"]["Enums"]["claim_status"]
          claimed_by?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          gallery_images?: string[] | null
          hours_of_operation?: Json | null
          id?: string
          is_claimed?: boolean
          is_featured?: boolean
          is_verified?: boolean
          keywords?: string[] | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          rating_avg?: number
          rating_count?: number
          region?: string | null
          short_description?: string | null
          slug?: string
          social_links?: Json | null
          status?: Database["public"]["Enums"]["listing_status"]
          subcategory?: string | null
          updated_at?: string
          views_count?: number
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          plan_expires_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          plan_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          plan_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_verified_purchase: boolean
          listing_id: string
          rating: number
          title: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_verified_purchase?: boolean
          listing_id: string
          rating: number
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_verified_purchase?: boolean
          listing_id?: string
          rating?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_listings: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "business_owner" | "admin"
      article_status: "draft" | "published" | "archived"
      claim_status: "unclaimed" | "pending" | "approved" | "rejected"
      listing_status: "active" | "pending" | "rejected" | "suspended"
      plan_tier: "free" | "starter" | "pro" | "enterprise"
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
      app_role: ["user", "business_owner", "admin"],
      article_status: ["draft", "published", "archived"],
      claim_status: ["unclaimed", "pending", "approved", "rejected"],
      listing_status: ["active", "pending", "rejected", "suspended"],
      plan_tier: ["free", "starter", "pro", "enterprise"],
    },
  },
} as const
