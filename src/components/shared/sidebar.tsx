"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  ListOrderedIcon,
  SendIcon,
  UserIcon,
} from "lucide-react";
import { signOutAction } from "@/actions/auth.actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/actions/user.actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/transactions", label: "Transactions", icon: ListOrderedIcon },
  { href: "/transfer", label: "Transfer Money", icon: SendIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

interface SidebarProps {
  user: CurrentUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-svh w-[280px] flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="text-lg font-bold tracking-tight">SwiftSend</span>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="size-9 rounded-full object-cover"
              />
            ) : (
              <span>
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <form action={signOutAction}>
          <Button variant="outline" size="sm" className="w-full" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
