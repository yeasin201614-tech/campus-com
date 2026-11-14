export type UserRole =
  | "super_admin"
  | "university_admin"
  | "department_admin"
  | "teacher"
  | "student"
  | "club_moderator";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  university_admin: "University Admin",
  department_admin: "Department Admin",
  teacher: "Teacher / Faculty",
  student: "Student",
  club_moderator: "Club Moderator",
};

export type Permission =
  | "platform:manage"
  | "cms:manage"
  | "billing:manage"
  | "university:manage"
  | "department:manage"
  | "users:verify"
  | "notices:publish"
  | "events:manage"
  | "events:checkin"
  | "groups:moderate"
  | "resources:share"
  | "marketplace:sell"
  | "community:post";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "platform:manage",
    "cms:manage",
    "billing:manage",
    "university:manage",
    "department:manage",
    "users:verify",
    "notices:publish",
    "events:manage",
    "events:checkin",
    "groups:moderate",
    "resources:share",
    "marketplace:sell",
    "community:post",
  ],
  university_admin: [
    "university:manage",
    "department:manage",
    "users:verify",
    "notices:publish",
    "events:manage",
    "events:checkin",
    "groups:moderate",
    "resources:share",
    "marketplace:sell",
    "community:post",
  ],
  department_admin: [
    "department:manage",
    "users:verify",
    "notices:publish",
    "events:manage",
    "events:checkin",
    "resources:share",
    "marketplace:sell",
    "community:post",
  ],
  teacher: [
    "notices:publish",
    "events:manage",
    "events:checkin",
    "resources:share",
    "marketplace:sell",
    "community:post",
  ],
  club_moderator: [
    "events:manage",
    "events:checkin",
    "groups:moderate",
    "marketplace:sell",
    "community:post",
  ],
  student: ["marketplace:sell", "community:post"],
};

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isStaffRole(role: UserRole | null | undefined): boolean {
  return role === "super_admin" || role === "university_admin" || role === "department_admin" || role === "teacher";
}
