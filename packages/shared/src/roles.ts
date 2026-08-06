export const DEFAULT_ROLE_KEYS = [
  "SUPER_ADMIN",
  "TENANT_ADMIN",
  "REGION_MANAGER",
  "SUPPORT_ENGINEER",
  "OPERATIONS_CENTER",
  "SITE_MANAGER",
  "EMPLOYEE",
] as const;

export type RoleKey = (typeof DEFAULT_ROLE_KEYS)[number];

export const ROLE_LABELS_AR: Record<RoleKey, string> = {
  SUPER_ADMIN: "مدير النظام",
  TENANT_ADMIN: "مدير الجهة",
  REGION_MANAGER: "مدير المنطقة",
  SUPPORT_ENGINEER: "مهندس الدعم الفني",
  OPERATIONS_CENTER: "مركز العمليات",
  SITE_MANAGER: "مدير الفرع/الموقع",
  EMPLOYEE: "مستخدم عادي",
};
