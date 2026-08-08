"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { logout } from "@/lib/api";
import { ROLE_LABELS_AR, TENANT_TYPE_LABELS_AR, type RoleKey, type TenantType } from "@marsad/shared";
import { useSidebar } from "@/lib/sidebar-context";
import { t } from "@/i18n/t";

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const { user, tenant } = useSession();
  const { toggle } = useSidebar();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header
      className="flex items-center justify-between border-b border-border-subtle bg-raised px-4 py-4 sm:px-6"
      style={{ borderTop: "3px solid var(--brand-gold)" }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="فتح القائمة"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle text-text-secondary md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text-primary">{title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="hidden text-xs text-text-tertiary sm:inline">{tenant.nameAr}</span>
            <span
              className="hidden rounded-[3px] border px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex"
              style={{
                borderColor: "color-mix(in srgb, var(--brand-primary) 35%, transparent)",
                color: "var(--brand-primary)",
                background: "color-mix(in srgb, var(--brand-primary) 8%, transparent)",
              }}
            >
              {TENANT_TYPE_LABELS_AR[tenant.type as TenantType]}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-end sm:block">
          <p className="text-sm font-medium text-text-primary">{user.fullName}</p>
          <p className="text-xs text-text-tertiary">{ROLE_LABELS_AR[user.roleKey as RoleKey] ?? user.roleName}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-[var(--radius-sm)] border border-border-subtle bg-raised px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-danger/40 hover:text-danger"
        >
          {t("dashboard.logout")}
        </button>
      </div>
    </header>
  );
}
