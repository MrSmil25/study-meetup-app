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
      budgets: {
        Row: {
          allocated_idr: number
          category: string
          created_at: string | null
          division: string | null
          event_id: string | null
          id: string
          notes: string | null
          period: string
          spent_idr: number | null
          status: Database["public"]["Enums"]["budget_status"]
          updated_at: string | null
        }
        Insert: {
          allocated_idr: number
          category: string
          created_at?: string | null
          division?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          period: string
          spent_idr?: number | null
          status?: Database["public"]["Enums"]["budget_status"]
          updated_at?: string | null
        }
        Update: {
          allocated_idr?: number
          category?: string
          created_at?: string | null
          division?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          period?: string
          spent_idr?: number | null
          status?: Database["public"]["Enums"]["budget_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "budgets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          city: string | null
          created_at: string | null
          created_by: string | null
          first_contact_date: string | null
          id: string
          industry: string | null
          last_touch_date: string | null
          logo_url: string | null
          name: string
          notes: string | null
          overall_status: Database["public"]["Enums"]["company_status"]
          owner_division: string | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          first_contact_date?: string | null
          id?: string
          industry?: string | null
          last_touch_date?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          overall_status?: Database["public"]["Enums"]["company_status"]
          owner_division?: string | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          first_contact_date?: string | null
          id?: string
          industry?: string | null
          last_touch_date?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          overall_status?: Database["public"]["Enums"]["company_status"]
          owner_division?: string | null
          type?: Database["public"]["Enums"]["company_type"]
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_owner_division_fkey"
            columns: ["owner_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      deals: {
        Row: {
          company_id: string | null
          created_at: string | null
          deadline: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          deliverables: string | null
          event_id: string | null
          id: string
          name: string
          notes: string | null
          owner_division: string | null
          owner_person_id: string | null
          primary_contact_id: string | null
          related_surat_number: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at: string | null
          value_idr: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          deadline?: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          deliverables?: string | null
          event_id?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_division?: string | null
          owner_person_id?: string | null
          primary_contact_id?: string | null
          related_surat_number?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string | null
          value_idr?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          deadline?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"]
          deliverables?: string | null
          event_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_division?: string | null
          owner_person_id?: string | null
          primary_contact_id?: string | null
          related_surat_number?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string | null
          value_idr?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_division_fkey"
            columns: ["owner_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "deals_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          code: string
          color_hex: string | null
          created_at: string | null
          description: string | null
          name: string
        }
        Insert: {
          code: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          name: string
        }
        Update: {
          code?: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          name?: string
        }
        Relationships: []
      }
      event_rundowns: {
        Row: {
          activity: string
          created_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          pic_id: string | null
          sort_order: number | null
          time_end: string | null
          time_start: string | null
        }
        Insert: {
          activity: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          pic_id?: string | null
          sort_order?: number | null
          time_end?: string | null
          time_start?: string | null
        }
        Update: {
          activity?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          pic_id?: string | null
          sort_order?: number | null
          time_end?: string | null
          time_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rundowns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rundowns_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          confirmation_status: Database["public"]["Enums"]["speaker_confirmation"]
          created_at: string | null
          event_id: string | null
          fee_idr: number | null
          fee_status: Database["public"]["Enums"]["fee_status"]
          id: string
          notes: string | null
          session_time_end: string | null
          session_time_start: string | null
          session_title: string | null
          speaker_id: string | null
          tor_url: string | null
          updated_at: string | null
        }
        Insert: {
          confirmation_status?: Database["public"]["Enums"]["speaker_confirmation"]
          created_at?: string | null
          event_id?: string | null
          fee_idr?: number | null
          fee_status?: Database["public"]["Enums"]["fee_status"]
          id?: string
          notes?: string | null
          session_time_end?: string | null
          session_time_start?: string | null
          session_title?: string | null
          speaker_id?: string | null
          tor_url?: string | null
          updated_at?: string | null
        }
        Update: {
          confirmation_status?: Database["public"]["Enums"]["speaker_confirmation"]
          created_at?: string | null
          event_id?: string | null
          fee_idr?: number | null
          fee_status?: Database["public"]["Enums"]["fee_status"]
          id?: string
          notes?: string | null
          session_time_end?: string | null
          session_time_start?: string | null
          session_title?: string | null
          speaker_id?: string | null
          tor_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actual_attendees: number | null
          actual_spend_idr: number | null
          budget_idr: number | null
          created_at: string | null
          date_end: string | null
          date_start: string | null
          description: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          name: string
          notes: string | null
          pic_id: string | null
          poster_url: string | null
          slug: string | null
          status: Database["public"]["Enums"]["event_status"]
          target_attendees: number | null
          updated_at: string | null
          venue: string | null
          venue_address: string | null
        }
        Insert: {
          actual_attendees?: number | null
          actual_spend_idr?: number | null
          budget_idr?: number | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          name: string
          notes?: string | null
          pic_id?: string | null
          poster_url?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          target_attendees?: number | null
          updated_at?: string | null
          venue?: string | null
          venue_address?: string | null
        }
        Update: {
          actual_attendees?: number | null
          actual_spend_idr?: number | null
          budget_idr?: number | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          name?: string
          notes?: string | null
          pic_id?: string | null
          poster_url?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          target_attendees?: number | null
          updated_at?: string | null
          venue?: string | null
          venue_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_requests: {
        Row: {
          amount_idr: number
          approval_notes: string | null
          approved_at: string | null
          approver_id: string | null
          breakdown: Json | null
          created_at: string | null
          disbursed_at: string | null
          disbursement_proof_url: string | null
          event_id: string | null
          id: string
          notes: string | null
          purpose: string
          report_submitted_at: string | null
          report_url: string | null
          request_number: string | null
          requester_division: string | null
          requester_id: string
          status: Database["public"]["Enums"]["fund_status"]
          updated_at: string | null
          urgency: Database["public"]["Enums"]["fund_urgency"]
        }
        Insert: {
          amount_idr: number
          approval_notes?: string | null
          approved_at?: string | null
          approver_id?: string | null
          breakdown?: Json | null
          created_at?: string | null
          disbursed_at?: string | null
          disbursement_proof_url?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          purpose: string
          report_submitted_at?: string | null
          report_url?: string | null
          request_number?: string | null
          requester_division?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["fund_status"]
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["fund_urgency"]
        }
        Update: {
          amount_idr?: number
          approval_notes?: string | null
          approved_at?: string | null
          approver_id?: string | null
          breakdown?: Json | null
          created_at?: string | null
          disbursed_at?: string | null
          disbursement_proof_url?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          purpose?: string
          report_submitted_at?: string | null
          report_url?: string | null
          request_number?: string | null
          requester_division?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["fund_status"]
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["fund_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "fund_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_requests_requester_division_fkey"
            columns: ["requester_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fund_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_transactions: {
        Row: {
          amount_idr: number
          category: string
          created_at: string | null
          description: string
          id: string
          proof_url: string | null
          recorded_by: string | null
          related_deal_id: string | null
          related_event_id: string | null
          related_fund_request_id: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          visibility: Database["public"]["Enums"]["transaction_visibility"]
        }
        Insert: {
          amount_idr: number
          category: string
          created_at?: string | null
          description: string
          id?: string
          proof_url?: string | null
          recorded_by?: string | null
          related_deal_id?: string | null
          related_event_id?: string | null
          related_fund_request_id?: string | null
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
          visibility?: Database["public"]["Enums"]["transaction_visibility"]
        }
        Update: {
          amount_idr?: number
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          proof_url?: string | null
          recorded_by?: string | null
          related_deal_id?: string | null
          related_event_id?: string | null
          related_fund_request_id?: string | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          visibility?: Database["public"]["Enums"]["transaction_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "fund_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_transactions_related_deal_id_fkey"
            columns: ["related_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_transactions_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_transactions_related_fund_request_id_fkey"
            columns: ["related_fund_request_id"]
            isOneToOne: false
            referencedRelation: "fund_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          approval_status: Database["public"]["Enums"]["letter_approval"]
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          letter_number: string | null
          notes: string | null
          output_type: string | null
          pdf_url: string | null
          purpose: string
          recipient_name: string | null
          recipient_organization: string | null
          requester_division: string | null
          requester_id: string
          template_type: Database["public"]["Enums"]["letter_template"]
          updated_at: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["letter_approval"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          letter_number?: string | null
          notes?: string | null
          output_type?: string | null
          pdf_url?: string | null
          purpose: string
          recipient_name?: string | null
          recipient_organization?: string | null
          requester_division?: string | null
          requester_id: string
          template_type: Database["public"]["Enums"]["letter_template"]
          updated_at?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["letter_approval"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          letter_number?: string | null
          notes?: string | null
          output_type?: string | null
          pdf_url?: string | null
          purpose?: string
          recipient_name?: string | null
          recipient_organization?: string | null
          requester_division?: string | null
          requester_id?: string
          template_type?: Database["public"]["Enums"]["letter_template"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_requester_division_fkey"
            columns: ["requester_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "letters_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mous: {
        Row: {
          company_id: string | null
          created_at: string | null
          deal_id: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          pdf_url: string | null
          renewal_reminder_days: number | null
          signatory_our_side_id: string | null
          signatory_their_name: string | null
          signatory_their_title: string | null
          signed_date: string | null
          status: Database["public"]["Enums"]["mou_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          renewal_reminder_days?: number | null
          signatory_our_side_id?: string | null
          signatory_their_name?: string | null
          signatory_their_title?: string | null
          signed_date?: string | null
          status?: Database["public"]["Enums"]["mou_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          renewal_reminder_days?: number | null
          signatory_our_side_id?: string | null
          signatory_their_name?: string | null
          signatory_their_title?: string | null
          signed_date?: string | null
          status?: Database["public"]["Enums"]["mou_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mous_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mous_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mous_signatory_our_side_id_fkey"
            columns: ["signatory_our_side_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          preferred_channel:
            | Database["public"]["Enums"]["contact_channel"]
            | null
          role_in_relation: Database["public"]["Enums"]["contact_role"] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          preferred_channel?:
            | Database["public"]["Enums"]["contact_channel"]
            | null
          role_in_relation?: Database["public"]["Enums"]["contact_role"] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          preferred_channel?:
            | Database["public"]["Enums"]["contact_channel"]
            | null
          role_in_relation?: Database["public"]["Enums"]["contact_role"] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          division: string | null
          email: string | null
          full_name: string
          id: string
          joined_at: string | null
          nickname: string | null
          phone: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          division?: string | null
          email?: string | null
          full_name: string
          id: string
          joined_at?: string | null
          nickname?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          division?: string | null
          email?: string | null
          full_name?: string
          id?: string
          joined_at?: string | null
          nickname?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      speakers: {
        Row: {
          bio_short: string | null
          company_id: string | null
          contact_person_id: string | null
          created_at: string | null
          cv_url: string | null
          default_rate_idr: number | null
          direct_email: string | null
          direct_phone: string | null
          expertise: string | null
          full_name: string
          id: string
          notes: string | null
          photo_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          bio_short?: string | null
          company_id?: string | null
          contact_person_id?: string | null
          created_at?: string | null
          cv_url?: string | null
          default_rate_idr?: number | null
          direct_email?: string | null
          direct_phone?: string | null
          expertise?: string | null
          full_name: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          bio_short?: string | null
          company_id?: string | null
          contact_person_id?: string | null
          created_at?: string | null
          cv_url?: string | null
          default_rate_idr?: number | null
          direct_email?: string | null
          direct_phone?: string | null
          expertise?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speakers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speakers_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_categories: {
        Row: {
          color_hex: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          type: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          type: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_fund_request_number: { Args: never; Returns: string }
      generate_letter_number: {
        Args: {
          div: string
          tmpl: Database["public"]["Enums"]["letter_template"]
        }
        Returns: string
      }
      get_my_division: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      budget_status: "On_Budget" | "Warning" | "Over_Budget"
      company_status: "Cold" | "Warm" | "Active" | "Dormant" | "Blacklist"
      company_type:
        | "Sponsor"
        | "Media"
        | "Speaker_Source"
        | "Institutional"
        | "Vendor"
      contact_channel: "WA" | "Email" | "Phone"
      contact_role: "Decision_Maker" | "Influencer" | "Executor" | "Gatekeeper"
      deal_stage:
        | "Prospect"
        | "Contacted"
        | "Pitched"
        | "Negotiating"
        | "Deal"
        | "Rejected"
        | "Ghosted"
      deal_type:
        | "Sponsorship"
        | "Media_Partnership"
        | "Speaker"
        | "Institutional_MoU"
        | "In_kind"
      event_status: "Planning" | "Preparation" | "Live" | "Done" | "Cancelled"
      event_type:
        | "Flagship"
        | "Workshop"
        | "Talkshow"
        | "Internal"
        | "Competition"
        | "Other"
      fee_status: "Not_Applicable" | "Pending" | "Paid"
      fund_status:
        | "Draft"
        | "Submitted"
        | "Under_Review"
        | "Approved"
        | "Rejected"
        | "Disbursed"
        | "Reported"
      fund_urgency: "Normal" | "Urgent" | "Emergency"
      letter_approval:
        | "Auto_Approved"
        | "Pending_Review"
        | "Approved"
        | "Rejected"
        | "Cancelled"
      letter_template:
        | "Sponsor_Outreach"
        | "Media_Outreach"
        | "Speaker_Invitation"
        | "Institutional"
        | "Internal_Task"
        | "Custom"
      member_status: "Active" | "Alumni" | "Inactive"
      mou_status: "Draft" | "Under_Review" | "Signed" | "Expired" | "Terminated"
      speaker_confirmation: "Invited" | "Confirmed" | "Declined" | "Cancelled"
      transaction_type: "Income" | "Expense"
      transaction_visibility:
        | "Public_Org"
        | "Kadiv_And_Above"
        | "Controller_Only"
      user_role:
        | "Anggota"
        | "Kadiv"
        | "Waketu"
        | "Ketua"
        | "Sekretaris"
        | "Controller"
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
      budget_status: ["On_Budget", "Warning", "Over_Budget"],
      company_status: ["Cold", "Warm", "Active", "Dormant", "Blacklist"],
      company_type: [
        "Sponsor",
        "Media",
        "Speaker_Source",
        "Institutional",
        "Vendor",
      ],
      contact_channel: ["WA", "Email", "Phone"],
      contact_role: ["Decision_Maker", "Influencer", "Executor", "Gatekeeper"],
      deal_stage: [
        "Prospect",
        "Contacted",
        "Pitched",
        "Negotiating",
        "Deal",
        "Rejected",
        "Ghosted",
      ],
      deal_type: [
        "Sponsorship",
        "Media_Partnership",
        "Speaker",
        "Institutional_MoU",
        "In_kind",
      ],
      event_status: ["Planning", "Preparation", "Live", "Done", "Cancelled"],
      event_type: [
        "Flagship",
        "Workshop",
        "Talkshow",
        "Internal",
        "Competition",
        "Other",
      ],
      fee_status: ["Not_Applicable", "Pending", "Paid"],
      fund_status: [
        "Draft",
        "Submitted",
        "Under_Review",
        "Approved",
        "Rejected",
        "Disbursed",
        "Reported",
      ],
      fund_urgency: ["Normal", "Urgent", "Emergency"],
      letter_approval: [
        "Auto_Approved",
        "Pending_Review",
        "Approved",
        "Rejected",
        "Cancelled",
      ],
      letter_template: [
        "Sponsor_Outreach",
        "Media_Outreach",
        "Speaker_Invitation",
        "Institutional",
        "Internal_Task",
        "Custom",
      ],
      member_status: ["Active", "Alumni", "Inactive"],
      mou_status: ["Draft", "Under_Review", "Signed", "Expired", "Terminated"],
      speaker_confirmation: ["Invited", "Confirmed", "Declined", "Cancelled"],
      transaction_type: ["Income", "Expense"],
      transaction_visibility: [
        "Public_Org",
        "Kadiv_And_Above",
        "Controller_Only",
      ],
      user_role: [
        "Anggota",
        "Kadiv",
        "Waketu",
        "Ketua",
        "Sekretaris",
        "Controller",
      ],
    },
  },
} as const
