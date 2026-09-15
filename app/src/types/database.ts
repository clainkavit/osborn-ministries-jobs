// Hand-written Supabase Database type. Migration 001 (M1) + 002 (M2). Each
// table spells out Row/Insert/Update explicitly -- the Supabase typed query
// builder does not infer row types through a generic Partial<> helper (that
// yields `never`), so the shapes are written out. Could be regenerated with
// `supabase gen types typescript` once the CLI is authenticated.

import type {
  Availability,
  CredentialsStatus,
  DocumentType,
  EmploymentStatus,
  MembershipStatus,
  ProfileStatus,
} from "./member";
import type { UserRole } from "./roles";

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          auth_user_id: string;
          role: UserRole;
          first_name: string;
          last_name: string;
          phone: string | null;
          email: string | null;
          profile_status: ProfileStatus;
          membership_status: MembershipStatus;
          credentials_status: CredentialsStatus;
          photo_url: string | null;
          date_of_birth: string | null;
          gender: string | null;
          location: string | null;
          primary_profession_id: string | null;
          profession_freetext: string | null;
          job_title: string | null;
          industry: string | null;
          employment_status: EmploymentStatus | null;
          years_of_experience: number | null;
          availability: Availability;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          role?: UserRole;
          first_name: string;
          last_name: string;
          phone?: string | null;
          email?: string | null;
          profile_status?: ProfileStatus;
          membership_status?: MembershipStatus;
          credentials_status?: CredentialsStatus;
          photo_url?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          location?: string | null;
          primary_profession_id?: string | null;
          profession_freetext?: string | null;
          job_title?: string | null;
          industry?: string | null;
          employment_status?: EmploymentStatus | null;
          years_of_experience?: number | null;
          availability?: Availability;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: UserRole;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          email?: string | null;
          profile_status?: ProfileStatus;
          membership_status?: MembershipStatus;
          credentials_status?: CredentialsStatus;
          photo_url?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          location?: string | null;
          primary_profession_id?: string | null;
          profession_freetext?: string | null;
          job_title?: string | null;
          industry?: string | null;
          employment_status?: EmploymentStatus | null;
          years_of_experience?: number | null;
          availability?: Availability;
          updated_at?: string;
        };
        Relationships: [];
      };
      professions: {
        Row: {
          id: string;
          name: string;
          category: string;
          synonyms: string[];
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          synonyms?: string[];
        };
        Update: {
          name?: string;
          category?: string;
          synonyms?: string[];
        };
        Relationships: [];
      };
      skills: {
        Row: { id: string; name: string; synonyms: string[] };
        Insert: { id?: string; name: string; synonyms?: string[] };
        Update: { name?: string; synonyms?: string[] };
        Relationships: [];
      };
      member_skills: {
        Row: { member_id: string; skill_id: string; created_at: string };
        Insert: { member_id: string; skill_id: string; created_at?: string };
        Update: { created_at?: string };
        Relationships: [];
      };
      education: {
        Row: {
          id: string;
          member_id: string;
          institution: string;
          qualification: string;
          field_of_study: string | null;
          start_year: number | null;
          end_year: number | null;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          institution: string;
          qualification: string;
          field_of_study?: string | null;
          start_year?: number | null;
          end_year?: number | null;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          institution?: string;
          qualification?: string;
          field_of_study?: string | null;
          start_year?: number | null;
          end_year?: number | null;
          is_current?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      experience: {
        Row: {
          id: string;
          member_id: string;
          organization: string;
          position: string;
          location: string | null;
          start_date: string | null;
          end_date: string | null;
          is_current: boolean;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          organization: string;
          position: string;
          location?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization?: string;
          position?: string;
          location?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      certifications: {
        Row: {
          id: string;
          member_id: string;
          name: string;
          issuing_organization: string | null;
          issue_date: string | null;
          expiration_date: string | null;
          document_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          name: string;
          issuing_organization?: string | null;
          issue_date?: string | null;
          expiration_date?: string | null;
          document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          issuing_organization?: string | null;
          issue_date?: string | null;
          expiration_date?: string | null;
          document_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          member_id: string;
          type: DocumentType;
          filename: string;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          type: DocumentType;
          filename: string;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          created_at?: string;
        };
        Update: {
          type?: DocumentType;
          filename?: string;
          storage_path?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
        };
        Relationships: [];
      };
      verification_history: {
        Row: {
          id: string;
          member_id: string;
          track: "MEMBERSHIP" | "CREDENTIALS";
          action:
            | "APPROVED"
            | "NEEDS_CORRECTION"
            | "RESUBMITTED"
            | "AUTO_REVERIFICATION";
          note: string | null;
          actor_admin_id: string | null;
          actor_member_id: string | null;
          detail: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          track: "MEMBERSHIP" | "CREDENTIALS";
          action:
            | "APPROVED"
            | "NEEDS_CORRECTION"
            | "RESUBMITTED"
            | "AUTO_REVERIFICATION";
          note?: string | null;
          actor_admin_id?: string | null;
          actor_member_id?: string | null;
          detail?: string | null;
          created_at?: string;
        };
        Update: {
          note?: string | null;
          detail?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          member_id: string;
          type:
            | "MEMBERSHIP_CONFIRMED"
            | "CREDENTIALS_REVIEWED"
            | "CORRECTION_REQUESTED"
            | "APPLICATION_SHORTLISTED"
            | "APPLICATION_INTERVIEW"
            | "APPLICATION_SELECTED"
            | "APPLICATION_REJECTED"
            | "APPLICATION_OPPORTUNITY_CLOSED";
          body_text: string;
          related_url: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          type:
            | "MEMBERSHIP_CONFIRMED"
            | "CREDENTIALS_REVIEWED"
            | "CORRECTION_REQUESTED"
            | "APPLICATION_SHORTLISTED"
            | "APPLICATION_INTERVIEW"
            | "APPLICATION_SELECTED"
            | "APPLICATION_REJECTED"
            | "APPLICATION_OPPORTUNITY_CLOSED";
          body_text: string;
          related_url?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
      opportunities: {
        Row: {
          id: string;
          title: string;
          type: "EMPLOYMENT" | "CHURCH" | "SERVICE";
          organization_name: string;
          location: string | null;
          description: string | null;
          status:
            | "DRAFT"
            | "PUBLISHED"
            | "CLOSED"
            | "CANCELLED"
            | "FILLED"
            | "COMPLETED";
          headcount_required: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          type: "EMPLOYMENT" | "CHURCH" | "SERVICE";
          organization_name: string;
          location?: string | null;
          description?: string | null;
          status?:
            | "DRAFT"
            | "PUBLISHED"
            | "CLOSED"
            | "CANCELLED"
            | "FILLED"
            | "COMPLETED";
          headcount_required?: number | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          closed_at?: string | null;
        };
        Update: {
          title?: string;
          type?: "EMPLOYMENT" | "CHURCH" | "SERVICE";
          organization_name?: string;
          location?: string | null;
          description?: string | null;
          status?:
            | "DRAFT"
            | "PUBLISHED"
            | "CLOSED"
            | "CANCELLED"
            | "FILLED"
            | "COMPLETED";
          headcount_required?: number | null;
          updated_at?: string;
          published_at?: string | null;
          closed_at?: string | null;
        };
        Relationships: [];
      };
      opportunity_requirements: {
        Row: {
          id: string;
          opportunity_id: string;
          required_profession_id: string | null;
          min_experience_years: number | null;
          required_education_level:
            | "NONE"
            | "SECONDARY_CERTIFICATE"
            | "DIPLOMA"
            | "BACHELORS"
            | "MASTERS"
            | "DOCTORATE"
            | null;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          required_profession_id?: string | null;
          min_experience_years?: number | null;
          required_education_level?:
            | "NONE"
            | "SECONDARY_CERTIFICATE"
            | "DIPLOMA"
            | "BACHELORS"
            | "MASTERS"
            | "DOCTORATE"
            | null;
        };
        Update: {
          required_profession_id?: string | null;
          min_experience_years?: number | null;
          required_education_level?:
            | "NONE"
            | "SECONDARY_CERTIFICATE"
            | "DIPLOMA"
            | "BACHELORS"
            | "MASTERS"
            | "DOCTORATE"
            | null;
        };
        Relationships: [];
      };
      opportunity_required_skills: {
        Row: {
          opportunity_id: string;
          skill_id: string;
          created_at: string;
        };
        Insert: {
          opportunity_id: string;
          skill_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          member_id: string;
          opportunity_id: string;
          status:
            | "APPLIED"
            | "REVIEWED"
            | "SHORTLISTED"
            | "INTERVIEW"
            | "SELECTED"
            | "REJECTED"
            | "WITHDRAWN";
          applied_at: string;
          status_updated_at: string;
          interview_date: string | null;
          interview_time: string | null;
          interview_location: string | null;
          interview_instructions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          opportunity_id: string;
          status?:
            | "APPLIED"
            | "REVIEWED"
            | "SHORTLISTED"
            | "INTERVIEW"
            | "SELECTED"
            | "REJECTED"
            | "WITHDRAWN";
          applied_at?: string;
          status_updated_at?: string;
          interview_date?: string | null;
          interview_time?: string | null;
          interview_location?: string | null;
          interview_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?:
            | "APPLIED"
            | "REVIEWED"
            | "SHORTLISTED"
            | "INTERVIEW"
            | "SELECTED"
            | "REJECTED"
            | "WITHDRAWN";
          status_updated_at?: string;
          interview_date?: string | null;
          interview_time?: string | null;
          interview_location?: string | null;
          interview_instructions?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      application_outcomes: {
        Row: {
          id: string;
          application_id: string;
          outcome:
            | "HIRED"
            | "CONTRACT_AWARDED"
            | "PROJECT_COMPLETED"
            | "SERVICE_DELIVERED"
            | "CONNECTED"
            | "NOT_SELECTED"
            | "CANCELLED"
            | "NO_OUTCOME";
          recorded_by: string;
          recorded_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          outcome:
            | "HIRED"
            | "CONTRACT_AWARDED"
            | "PROJECT_COMPLETED"
            | "SERVICE_DELIVERED"
            | "CONNECTED"
            | "NOT_SELECTED"
            | "CANCELLED"
            | "NO_OUTCOME";
          recorded_by: string;
          recorded_at?: string;
          notes?: string | null;
        };
        Update: {
          outcome?:
            | "HIRED"
            | "CONTRACT_AWARDED"
            | "PROJECT_COMPLETED"
            | "SERVICE_DELIVERED"
            | "CONNECTED"
            | "NOT_SELECTED"
            | "CANCELLED"
            | "NO_OUTCOME";
          notes?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_member_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_church_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      member_is_directory_visible: {
        Args: { p_membership: string; p_credentials: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
