import type { UserRole } from "./roles";

export type VerificationStatus = "pending" | "verified" | "suspended" | "rejected";
export type PostType = "discussion" | "announcement" | "resource" | "poll" | "achievement";
export type VisibilityScope = "public" | "university" | "department" | "group" | "private";
export type EventStatus = "draft" | "published" | "ongoing" | "completed" | "cancelled";
export type RegistrationStatus = "registered" | "attended" | "cancelled" | "saved";
export type NoticePriority = "normal" | "important" | "urgent";
export type NoticeCategory = "university" | "department" | "academic" | "exam" | "deadline" | "general";
export type ListingStatus = "active" | "reserved" | "sold" | "removed";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled" | "expired";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  global_role: UserRole;
  primary_university_id: string | null;
  bio: string;
  phone: string | null;
  skills: string[];
  interests: string[];
  social_links: Record<string, string>;
  privacy_settings: {
    show_email?: boolean;
    show_phone?: boolean;
    profile_visibility?: "public" | "university" | "private";
  };
  is_verified: boolean;
  is_active: boolean;
  online_status: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface University {
  id: string;
  name: string;
  slug: string;
  short_code: string;
  domain: string | null;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  brand_color: string;
  secondary_color: string;
  address: string | null;
  city: string | null;
  country: string | null;
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  established_year: number | null;
  student_capacity: number;
  status: VerificationStatus;
  is_verified: boolean;
  is_featured: boolean;
  current_academic_year: string;
  settings: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UniversityMember {
  id: string;
  university_id: string;
  user_id: string;
  role: UserRole;
  department_id: string | null;
  status: VerificationStatus;
  is_primary: boolean;
  joined_at: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  university_id: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  head_user_id: string | null;
  building: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicProgram {
  id: string;
  university_id: string;
  department_id: string;
  name: string;
  code: string;
  degree_level: "certificate" | "associate" | "bachelor" | "master" | "doctoral";
  duration_years: number;
  academic_year: string;
  total_credits: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentRecord {
  id: string;
  university_id: string;
  user_id: string;
  department_id: string | null;
  program_id: string | null;
  student_id_number: string;
  academic_year: string;
  semester: string;
  enrollment_year: number | null;
  graduation_year: number | null;
  gpa_summary: number | null;
  verification_status: VerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FacultyRecord {
  id: string;
  university_id: string;
  user_id: string;
  department_id: string | null;
  employee_id_number: string;
  title: string;
  designation: string;
  specialization: string;
  office_location: string | null;
  office_hours: string | null;
  assigned_classes: Array<{ code: string; title: string; semester?: string }>;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface CommunityGroup {
  id: string;
  university_id: string;
  department_id: string | null;
  name: string;
  slug: string;
  description: string;
  category: string;
  avatar_url: string | null;
  banner_url: string | null;
  is_private: boolean;
  requires_approval: boolean;
  created_by: string | null;
  members_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampusPost {
  id: string;
  university_id: string;
  department_id: string | null;
  group_id: string | null;
  author_id: string;
  post_type: PostType;
  visibility: VisibilityScope;
  title: string | null;
  content: string;
  media_urls: string[];
  resource_url: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_pinned: boolean;
  is_flagged: boolean;
  report_count: number;
  moderation_status: "approved" | "flagged" | "hidden";
  created_at: string;
  updated_at: string;
}

export interface CampusEvent {
  id: string;
  university_id: string;
  department_id: string | null;
  group_id: string | null;
  organizer_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  cover_image_url: string | null;
  location: string;
  is_online: boolean;
  meeting_url: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  registered_count: number;
  is_free: boolean;
  ticket_price: number;
  status: EventStatus;
  is_featured: boolean;
  visibility: VisibilityScope;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  university_id: string;
  status: RegistrationStatus;
  is_favorite: boolean;
  qr_token: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: string;
  university_id: string | null;
  department_id: string | null;
  author_id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  audience_role: UserRole | null;
  attachment_url: string | null;
  is_pinned: boolean;
  is_global: boolean;
  expires_at: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceListing {
  id: string;
  university_id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: "new" | "like_new" | "good" | "fair" | "service";
  images: string[];
  location_text: string;
  status: ListingStatus;
  is_negotiable: boolean;
  views_count: number;
  is_flagged: boolean;
  report_count: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_students: number | null;
  max_departments: number | null;
  storage_limit_gb: number;
  features: string[];
  enabled_modules: Record<string, boolean>;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface WebsitePage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  hero_title: string;
  hero_description: string;
  hero_cta_text: string;
  hero_cta_url: string;
  banner_image_url: string | null;
  sections: Array<Record<string, unknown>>;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  show_in_nav: boolean;
  nav_order: number;
}
