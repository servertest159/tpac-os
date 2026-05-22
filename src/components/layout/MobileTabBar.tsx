import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Package,
  MessageSquare,
  MoreHorizontal,
  User,
  FileCode,
  KeyRound,
  Download,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut as tpacSignOut, canStaffManage } from "@/lib/auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const handleLogout = () => {
  tpacSignOut();
};

const coreTabs = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/events", label: "Programmes", icon: Calendar },
  { path: "/gear", label: "Inventory", icon: Package },
  { path: "/feedback", label: "AARs", icon: MessageSquare },
];

const MobileTabBar: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path || (path === "/dashboard" && location.pathname === "/");

  const moreItems = [
    { path: "/profile", label: "Profile", icon: User },
    ...(canStaffManage()
      ? [
          { path: "/admin/access", label: "Access Codes", icon: KeyRound },
          { path: "/admin/exports", label: "Exports", icon: Download },
        ]
      : []),
    { path: "/developer-notes", label: "Dev Notes", icon: FileCode },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-5 h-16">
        {coreTabs.map((t) => {
          const Icon = t.icon;
          const active = isActive(t.path);
          return (
            <Link
              key={t.path}
              to={t.path}
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors min-h-11",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              <span>{t.label}</span>
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="More options"
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors min-h-11",
              "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="mt-4 grid gap-1">
              {moreItems.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.path}
                    to={m.path}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors min-h-11"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{m.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors min-h-11 text-left"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Log Out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default MobileTabBar;
