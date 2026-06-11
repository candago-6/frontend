"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Scale, LayoutDashboard, Users, LogOut, MessageSquare, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true, roles: ["gestor", "analista"] },
  { href: "/dashboard/usuarios", label: "Usuários", icon: Users, exact: false, roles: ["gestor"] },
  { href: "/dashboard/conversas", label: "Conversas", icon: MessageSquare, exact: false, roles: ["gestor", "analista"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.role === "analista" && pathname.startsWith("/dashboard/usuarios")) {
      router.replace("/dashboard");
    }
  }, [user?.role, pathname, router]);

  function handleLogout() {
    logout();
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-60 shrink-0 -translate-x-full flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0",
          sidebarOpen && "translate-x-0"
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-[1.125rem]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-slate-900">Procon Jacareí</p>
              <p className="mt-0.5 text-xs text-slate-500">Painel de gestão</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar menu</span>
          </Button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV_ITEMS.filter((item) => !user?.role || item.roles.includes(user.role)).map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 px-3 py-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{user?.name ?? "Usuário"}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              className="shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
          <p className="text-sm font-semibold text-slate-900">Procon Jacareí</p>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
