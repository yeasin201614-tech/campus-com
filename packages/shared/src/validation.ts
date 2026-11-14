import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid institutional or personal email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  requestedRole: z.enum(["student", "teacher", "club_moderator"]),
  universityId: z.string().uuid("Select a valid university"),
  studentIdNumber: z.string().max(40).optional(),
});

export const createPostSchema = z.object({
  title: z.string().max(160).optional(),
  content: z.string().min(1, "Post content cannot be empty").max(5000),
  postType: z.enum(["discussion", "announcement", "resource", "poll", "achievement"]).default("discussion"),
  visibility: z.enum(["public", "university", "department", "group", "private"]).default("university"),
  groupId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  resourceUrl: z.string().url().nullable().optional().or(z.literal("")),
  tags: z.array(z.string().max(32)).max(8).optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(3, "Event title is required").max(160),
  description: z.string().min(5, "Describe your event").max(4000),
  category: z.string().min(2).max(40).default("General"),
  location: z.string().min(2).max(160),
  isOnline: z.boolean().default(false),
  meetingUrl: z.string().url().optional().or(z.literal("")),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  capacity: z.coerce.number().int().positive().nullable().optional(),
  isFree: z.boolean().default(true),
  ticketPrice: z.coerce.number().min(0).default(0),
});

export const createNoticeSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(5).max(6000),
  category: z.enum(["university", "department", "academic", "exam", "deadline", "general"]).default("university"),
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
  isPinned: z.boolean().default(false),
  isGlobal: z.boolean().default(false),
});

export const createListingSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(5).max(3000),
  price: z.coerce.number().min(0).max(99999),
  condition: z.enum(["new", "like_new", "good", "fair", "service"]).default("good"),
  categoryId: z.string().uuid().nullable().optional(),
  locationText: z.string().max(120).default("Main Campus"),
  isNegotiable: z.boolean().default(true),
});

export const supportTicketSchema = z.object({
  contactName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
  subject: z.string().min(3).max(160),
  message: z.string().min(10).max(4000),
  ticketType: z.enum(["support", "contact", "post_report", "listing_report", "user_report", "billing"]).default("contact"),
  targetType: z.string().optional(),
  targetId: z.string().uuid().optional(),
});

export const createUniversitySchema = z.object({
  name: z.string().min(2).max(160),
  shortCode: z.string().min(2).max(16),
  domain: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  description: z.string().max(2000).optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#101B62"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6038ED"),
});
