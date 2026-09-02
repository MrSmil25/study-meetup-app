import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  User,
  Users,
  Boxes,
  LogOut,
  Menu,
  X,
  Building2,
  KanbanSquare,
  FileSignature,
  Wallet,
  ClipboardCheck,
  Receipt,
  PiggyBank,
  Tags,
  CalendarDays,
  Mic,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/useProfile";
import { isApprover } from "@/hooks/useFunds";
import { canManageCategories } from "@/hooks/useFinance";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AppLayout,
});

const navSections = [
  {
    section: "UTAMA",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/profile", label: "Profil Saya", icon: User },
    ],
  },
  {
    section: "ORGANISASI",
    items: [
      { to: "/members", label: "Anggota", icon: Users },
      { to: "/divisions", label: "Divisi", icon: Boxes },
    ],
  },
  {
    section: "EKSTERNAL",
    items: [
      { to: "/companies", label: "Perusahaan", icon: Building2 },
      { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
      { to: "/mous", label: "MoU", icon: FileSignature },
    ],
  },
  {
    section: "KEUANGAN",
    items: [
      { to: "/fund-requests", label: "Pengajuan Dana", icon: Wallet },
      { to: "/fund-approvals", label: "Approval Dana", icon: ClipboardCheck, approverOnly: true },
      { to: "/transactions", label: "Feed Keuangan", icon: Receipt },
      { to: "/budgets", label: "Budget", icon: PiggyBank },
      {
        to: "/admin/categories",
        label: "Kelola Kategori",
        icon: Tags,
        financeAdminOnly: true,
      },
    ],
  },
  {
    section: "EVENT",
    items: [
      { to: "/events", label: "Events", icon: CalendarDays },
      { to: "/speakers", label: "Speaker", icon: Mic },
    ],
  },
] as const;

function AppLayout() {
  const { data: profile } = useMyProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-muted">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <span className="text-lg font-bold tracking-tight">OrgTool</span>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X className="size-5" />
          </button>
        </div>
        <nav className="space-y-5 overflow-y-auto p-3">
          {navSections.map((group) => (
            <div key={group.section} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                {group.section}
              </p>
              {group.items
                .filter(
                  (item) =>
                    !("approverOnly" in item && item.approverOnly) || isApprover(profile?.role),
                )
                .filter(
                  (item) =>
                    !("financeAdminOnly" in item && item.financeAdminOnly) ||
                    canManageCategories(profile?.role),
                )
                .map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeProps={{
                    className:
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground",
                  }}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Menu className="size-5" />
          </button>
          <div className="flex flex-1 items-center justify-end gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{profile?.full_name ?? "Pengguna"}</p>
              <p className="text-xs text-muted-foreground">{profile?.role ?? "Anggota"}</p>
            </div>
            <UserAvatar path={profile?.photo_url} name={profile?.full_name} className="size-9" />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
