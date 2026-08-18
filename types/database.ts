// Escrito à mão para corresponder exatamente a
// supabase/migrations/00001_init_schema.sql — NÃO é o output oficial do
// Supabase CLI. Assim que o projeto estiver linkado, regenere com:
//
//   supabase gen types typescript --linked > types/database.ts
//
// Atenção ao regenerar: as colunas abaixo que usam union de string
// (ex.: gift_lists.type, reservations.status) são CHECK constraints em
// `text`, não ENUM nativo do Postgres — o gerador oficial do Supabase vai
// tipá-las como `string` solto, perdendo esse refinamento. Se isso
// incomodar, ou mantenha esses unions com um `as` nos pontos de leitura,
// ou converta as colunas para `CREATE TYPE ... AS ENUM` no banco (fora de
// escopo do MVP por ora).

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
export type GiftListType = 'physical' | 'quota'
export type ContactType = 'whatsapp' | 'email'
export type FulfillmentMethod = 'physical' | 'pix'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'
export type EventAdminRole = 'owner' | 'editor'
export type RsvpStatus = 'pending' | 'confirmed' | 'declined'

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          slug: string
          name: string
          event_date: string | null
          description: string | null
          pix_key: string | null
          pix_key_type: PixKeyType | null
          pix_owner_name: string | null
          pix_qr_code_url: string | null
          image_url: string | null
          hero_label: string
          instagram_url: string | null
          facebook_url: string | null
          youtube_url: string | null
          whatsapp_url: string | null
          allow_rsvp: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          event_date?: string | null
          description?: string | null
          pix_key?: string | null
          pix_key_type?: PixKeyType | null
          pix_owner_name?: string | null
          pix_qr_code_url?: string | null
          image_url?: string | null
          hero_label?: string
          instagram_url?: string | null
          facebook_url?: string | null
          youtube_url?: string | null
          whatsapp_url?: string | null
          allow_rsvp?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
        Relationships: []
      }
      event_occasions: {
        Row: {
          id: string
          event_id: string
          gift_list_id: string | null
          slug: string
          name: string
          occasion_date: string | null
          occasion_time: string | null
          location_name: string | null
          address: string | null
          google_maps_url: string | null
          description: string | null
          image_url: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          gift_list_id?: string | null
          slug: string
          name: string
          occasion_date?: string | null
          occasion_time?: string | null
          location_name?: string | null
          address?: string | null
          google_maps_url?: string | null
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['event_occasions']['Insert']>
        Relationships: [
          { foreignKeyName: 'event_occasions_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
          { foreignKeyName: 'event_occasions_gift_list_id_fkey'; columns: ['gift_list_id']; referencedRelation: 'gift_lists'; referencedColumns: ['id'] },
        ]
      }
      admin_profiles: {
        Row: { id: string; full_name: string | null; created_at: string }
        Insert: { id: string; full_name?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['admin_profiles']['Insert']>
        Relationships: []
      }
      event_admins: {
        Row: { event_id: string; admin_id: string; role: EventAdminRole; created_at: string }
        Insert: { event_id: string; admin_id: string; role?: EventAdminRole; created_at?: string }
        Update: Partial<Database['public']['Tables']['event_admins']['Insert']>
        Relationships: [
          { foreignKeyName: 'event_admins_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
        ]
      }
      gift_lists: {
        Row: {
          id: string
          event_id: string
          slug: string
          type: GiftListType
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          slug: string
          type: GiftListType
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['gift_lists']['Insert']>
        Relationships: [
          { foreignKeyName: 'gift_lists_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
        ]
      }
      gift_items: {
        Row: {
          id: string
          list_id: string
          event_id: string
          name: string
          description: string | null
          image_url: string | null
          unit_price: number | null
          quantity_total: number
          quantity_reserved: number
          quantity_available: number
          is_active: boolean
          purchase_url: string | null
          created_at: string
          updated_at: string
        }
        // event_id é preenchido pela trigger set_gift_item_event_id — nunca
        // enviado pelo cliente (nem tem GRANT pra isso). quantity_reserved e
        // quantity_available nunca são graváveis pelo cliente.
        Insert: {
          id?: string
          list_id: string
          name: string
          description?: string | null
          image_url?: string | null
          unit_price?: number | null
          quantity_total: number
          is_active?: boolean
          purchase_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['gift_items']['Insert'], 'list_id'>>
        Relationships: [
          { foreignKeyName: 'gift_items_list_id_fkey'; columns: ['list_id']; referencedRelation: 'gift_lists'; referencedColumns: ['id'] },
          { foreignKeyName: 'gift_items_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
        ]
      }
      guests: {
        Row: {
          id: string
          event_id: string
          name: string
          contact: string
          contact_type: ContactType
          // NULL = nunca foi convidado de RSVP (ex.: só se identificou pra
          // reservar presente). Preenchido só via create_invitation.
          max_party_size: number | null
          created_at: string
        }
        // Escrita real só acontece via RPC (identify_guest ou
        // create_invitation) — este Insert existe só para completude de
        // tipo, não representa um caminho liberado por GRANT.
        Insert: {
          id?: string
          event_id: string
          name: string
          contact: string
          contact_type: ContactType
          max_party_size?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['guests']['Insert']>
        Relationships: [
          { foreignKeyName: 'guests_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
        ]
      }
      invitations: {
        Row: {
          id: string
          guest_id: string
          event_id: string
          token_hash: string
          created_at: string
          last_accessed_at: string | null
        }
        // Escrita real só via RPC (create_invitation/regenerate_invitation).
        Insert: {
          id?: string
          guest_id: string
          event_id: string
          token_hash: string
          created_at?: string
          last_accessed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>
        Relationships: [
          { foreignKeyName: 'invitations_guest_id_fkey'; columns: ['guest_id']; referencedRelation: 'guests'; referencedColumns: ['id'] },
          { foreignKeyName: 'invitations_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
        ]
      }
      rsvp_responses: {
        Row: {
          id: string
          guest_id: string
          event_id: string
          status: RsvpStatus
          party_size: number | null
          notes: string | null
          responded_at: string | null
          created_at: string
          updated_at: string
        }
        // Escrita real só via RPC (create_invitation cria a linha 'pending';
        // submit_rsvp é quem atualiza status/party_size/notes).
        Insert: {
          id?: string
          guest_id: string
          event_id: string
          status?: RsvpStatus
          party_size?: number | null
          notes?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['rsvp_responses']['Insert']>
        Relationships: [
          { foreignKeyName: 'rsvp_responses_guest_id_fkey'; columns: ['guest_id']; referencedRelation: 'guests'; referencedColumns: ['id'] },
          { foreignKeyName: 'rsvp_responses_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
        ]
      }
      reservations: {
        Row: {
          id: string
          item_id: string
          event_id: string
          guest_id: string
          quantity: number
          fulfillment_method: FulfillmentMethod
          declared_amount: number | null
          status: ReservationStatus
          confirmed_at: string | null
          confirmed_by: string | null
          cancelled_at: string | null
          notes: string | null
          created_at: string
        }
        // Idem: escrita real só via create_reservation/confirm_reservation/
        // cancel_reservation (RPCs). Nenhum GRANT direto de insert/update.
        Insert: {
          id?: string
          item_id: string
          event_id: string
          guest_id: string
          quantity: number
          fulfillment_method: FulfillmentMethod
          declared_amount?: number | null
          status?: ReservationStatus
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reservations']['Insert']>
        Relationships: [
          { foreignKeyName: 'reservations_item_id_fkey'; columns: ['item_id']; referencedRelation: 'gift_items'; referencedColumns: ['id'] },
          { foreignKeyName: 'reservations_guest_id_fkey'; columns: ['guest_id']; referencedRelation: 'guests'; referencedColumns: ['id'] },
        ]
      }
    }
    Views: {
      gift_items_public: {
        Row: {
          id: string
          list_id: string
          event_id: string
          name: string
          description: string | null
          image_url: string | null
          unit_price: number | null
          quantity_available: number
          is_active: boolean
          purchase_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      identify_guest: {
        Args: {
          p_event_slug: string
          p_name: string
          p_contact: string
          p_contact_type: ContactType
        }
        Returns: Database['public']['Tables']['guests']['Row']
      }
      create_reservation: {
        Args: {
          p_item_id: string
          p_guest_id: string
          p_quantity: number
          p_fulfillment_method: FulfillmentMethod
        }
        Returns: Database['public']['Tables']['reservations']['Row']
      }
      confirm_reservation: {
        Args: { p_reservation_id: string }
        Returns: Database['public']['Tables']['reservations']['Row']
      }
      cancel_reservation: {
        Args: { p_reservation_id: string }
        Returns: Database['public']['Tables']['reservations']['Row']
      }
      create_invitation: {
        Args: {
          p_name: string
          p_contact: string
          p_contact_type: ContactType
          p_max_party_size: number
          p_token_hash: string
        }
        // Função é returns table(...) (set-returning) no Postgres — o wire
        // format do PostgREST é sempre um array; tipado como array aqui de
        // propósito pra .maybeSingle() (chamado no client) inferir o unwrap
        // corretamente (ver PostgrestTransformBuilder.maybeSingle<T>()).
        // out_/prefixo: nomes de coluna de saída não podem colidir com
        // guest_id/invitation_id usados dentro do corpo da função (ver
        // comentário na migration 00006 — "column reference is ambiguous").
        Returns: { out_guest_id: string; out_invitation_id: string }[]
      }
      regenerate_invitation: {
        Args: { p_guest_id: string; p_token_hash: string }
        Returns: Database['public']['Tables']['invitations']['Row']
      }
      resolve_invitation: {
        Args: { p_token_hash: string }
        // Idem create_invitation: returns table(...), wire format é array,
        // sempre chamada com .maybeSingle() no client.
        Returns: {
          guest_id: string
          guest_name: string
          event_id: string
          max_party_size: number
          status: RsvpStatus
          party_size: number | null
          notes: string | null
        }[]
      }
      submit_rsvp: {
        Args: {
          p_token_hash: string
          p_status: 'confirmed' | 'declined'
          p_party_size: number | null
          p_notes: string | null
        }
        Returns: Database['public']['Tables']['rsvp_responses']['Row']
      }
    }
    Enums: Record<string, never>
  }
}
