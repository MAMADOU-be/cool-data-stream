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
      alerts: {
        Row: {
          chambre_id: string | null
          created_at: string
          etat: Database["public"]["Enums"]["alert_state"]
          id: string
          is_read: boolean
          message: string
          seuil: number | null
          type: string
          user_id: string
          valeur: number | null
        }
        Insert: {
          chambre_id?: string | null
          created_at?: string
          etat?: Database["public"]["Enums"]["alert_state"]
          id?: string
          is_read?: boolean
          message: string
          seuil?: number | null
          type: string
          user_id: string
          valeur?: number | null
        }
        Update: {
          chambre_id?: string | null
          created_at?: string
          etat?: Database["public"]["Enums"]["alert_state"]
          id?: string
          is_read?: boolean
          message?: string
          seuil?: number | null
          type?: string
          user_id?: string
          valeur?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_chambre_id_fkey"
            columns: ["chambre_id"]
            isOneToOne: false
            referencedRelation: "chambres_froides"
            referencedColumns: ["id"]
          },
        ]
      }
      batteries: {
        Row: {
          id: string
          last_update: string
          percentage: number
          user_id: string
          voltage: number
        }
        Insert: {
          id?: string
          last_update?: string
          percentage: number
          user_id: string
          voltage: number
        }
        Update: {
          id?: string
          last_update?: string
          percentage?: number
          user_id?: string
          voltage?: number
        }
        Relationships: []
      }
      batteries_solaires: {
        Row: {
          capacite_kwh: number
          chambre_id: string
          id: string
          last_update: string
          pourcentage: number
          voltage: number
        }
        Insert: {
          capacite_kwh?: number
          chambre_id: string
          id?: string
          last_update?: string
          pourcentage?: number
          voltage?: number
        }
        Update: {
          capacite_kwh?: number
          chambre_id?: string
          id?: string
          last_update?: string
          pourcentage?: number
          voltage?: number
        }
        Relationships: [
          {
            foreignKeyName: "batteries_solaires_chambre_id_fkey"
            columns: ["chambre_id"]
            isOneToOne: false
            referencedRelation: "chambres_froides"
            referencedColumns: ["id"]
          },
        ]
      }
      capteurs: {
        Row: {
          actif: boolean
          chambre_id: string
          created_at: string
          emplacement: string
          id: string
          type: Database["public"]["Enums"]["capteur_type"]
        }
        Insert: {
          actif?: boolean
          chambre_id: string
          created_at?: string
          emplacement: string
          id?: string
          type: Database["public"]["Enums"]["capteur_type"]
        }
        Update: {
          actif?: boolean
          chambre_id?: string
          created_at?: string
          emplacement?: string
          id?: string
          type?: Database["public"]["Enums"]["capteur_type"]
        }
        Relationships: [
          {
            foreignKeyName: "capteurs_chambre_id_fkey"
            columns: ["chambre_id"]
            isOneToOne: false
            referencedRelation: "chambres_froides"
            referencedColumns: ["id"]
          },
        ]
      }
      chambres_froides: {
        Row: {
          created_at: string
          id: string
          localisation: string
          nom: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          localisation: string
          nom: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          localisation?: string
          nom?: string
          updated_at?: string
        }
        Relationships: []
      }
      groupes_froids: {
        Row: {
          chambre_id: string
          consommation_w: number
          etat: boolean
          id: string
          last_update: string
          nom: string
          reference: string
        }
        Insert: {
          chambre_id: string
          consommation_w?: number
          etat?: boolean
          id?: string
          last_update?: string
          nom: string
          reference?: string
        }
        Update: {
          chambre_id?: string
          consommation_w?: number
          etat?: boolean
          id?: string
          last_update?: string
          nom?: string
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "groupes_froids_chambre_id_fkey"
            columns: ["chambre_id"]
            isOneToOne: false
            referencedRelation: "chambres_froides"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          id: string
          temperature: number
          timestamp: string
          user_id: string
          voltage: number
        }
        Insert: {
          id?: string
          temperature: number
          timestamp?: string
          user_id: string
          voltage: number
        }
        Update: {
          id?: string
          temperature?: number
          timestamp?: string
          user_id?: string
          voltage?: number
        }
        Relationships: []
      }
      mesures: {
        Row: {
          capteur_id: string
          chambre_id: string
          id: string
          timestamp: string
          type: Database["public"]["Enums"]["capteur_type"]
          valeur: number
        }
        Insert: {
          capteur_id: string
          chambre_id: string
          id?: string
          timestamp?: string
          type: Database["public"]["Enums"]["capteur_type"]
          valeur: number
        }
        Update: {
          capteur_id?: string
          chambre_id?: string
          id?: string
          timestamp?: string
          type?: Database["public"]["Enums"]["capteur_type"]
          valeur?: number
        }
        Relationships: [
          {
            foreignKeyName: "mesures_capteur_id_fkey"
            columns: ["capteur_id"]
            isOneToOne: false
            referencedRelation: "capteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mesures_chambre_id_fkey"
            columns: ["chambre_id"]
            isOneToOne: false
            referencedRelation: "chambres_froides"
            referencedColumns: ["id"]
          },
        ]
      }
      panneaux_solaires: {
        Row: {
          chambre_id: string
          id: string
          last_update: string
          nom: string
          production_w: number
        }
        Insert: {
          chambre_id: string
          id?: string
          last_update?: string
          nom: string
          production_w?: number
        }
        Update: {
          chambre_id?: string
          id?: string
          last_update?: string
          nom?: string
          production_w?: number
        }
        Relationships: [
          {
            foreignKeyName: "panneaux_solaires_chambre_id_fkey"
            columns: ["chambre_id"]
            isOneToOne: false
            referencedRelation: "chambres_froides"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_state: "creee" | "active" | "lue" | "resolue"
      app_role: "admin" | "user" | "operateur" | "agriculteur"
      capteur_type: "temperature" | "humidite" | "porte"
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
      alert_state: ["creee", "active", "lue", "resolue"],
      app_role: ["admin", "user", "operateur", "agriculteur"],
      capteur_type: ["temperature", "humidite", "porte"],
    },
  },
} as const
