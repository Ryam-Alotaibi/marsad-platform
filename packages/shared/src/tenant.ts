export const TENANT_TYPES = ["GOVERNMENT", "HEALTHCARE", "PRIVATE", "NONPROFIT"] as const;
export type TenantType = (typeof TENANT_TYPES)[number];

export const TENANT_TYPE_LABELS_AR: Record<TenantType, string> = {
  GOVERNMENT: "حكومي",
  HEALTHCARE: "صحي",
  PRIVATE: "خاص",
  NONPROFIT: "غير ربحي",
};

export interface AuthUser {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  role: string;
}

export interface TenantTheme {
  id: string;
  name: string;
  nameAr: string;
  type: TenantType;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
}
