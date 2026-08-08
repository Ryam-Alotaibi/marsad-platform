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

export const ROLE_SCOPE_AR: Record<RoleKey, string> = {
  SUPER_ADMIN: "صلاحية كاملة على مستوى النظام — يشرف على جميع الجهات المسجّلة بالمنصة.",
  TENANT_ADMIN: "يدير إعدادات الجهة بالكامل: المستخدمين، المناطق، الفروع، وقنوات الإشعار.",
  REGION_MANAGER: "يتابع كل الفروع والمواقع ضمن منطقته، ويستقبل تنبيهات المستوى الإقليمي.",
  SUPPORT_ENGINEER: "يستقبل التصعيدات الفنية المباشرة، ومسؤول عن حل الأعطال الميدانية.",
  OPERATIONS_CENTER: "يراقب كل التنبيهات والمؤشرات لحظيًا من مركز عمليات مركزي.",
  SITE_MANAGER: "مسؤول عن موقع أو فرع واحد فقط، ويتابع تنبيهاته وأجهزته الخاصة.",
  EMPLOYEE: "مستخدم عادي بصلاحية اطّلاع محدودة على تنبيهات موقعه.",
};
