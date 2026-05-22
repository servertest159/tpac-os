
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Calendar, Package, MessageSquare, LogOut, User, FileCode, KeyRound, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TPAC_SESSION_EVENT,
  signOut as tpacSignOut,
  getCurrentHolderName,
  getCurrentRole,
  canStaffManage,
  canManageAccessCodes,
} from "@/lib/auth";

const Header = () => {
  const location = useLocation();
  const [isAuthed, setIsAuthed] = useState(false);
  const [identityBump, setIdentityBump] = useState(0);

  useEffect(() => {
    const updateAuth = () => {
      const hasAccessCode = localStorage.getItem("tpac_access_granted") === "true";
      setIsAuthed(hasAccessCode);
      setIdentityBump((n) => n + 1);
    };
    updateAuth();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "tpac_access_granted" ||
        e.key === "tpac_user_role" ||
        e.key === "tpac_holder_name" ||
        e.key === "tpac_access_code"
      ) {
        updateAuth();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(TPAC_SESSION_EVENT, updateAuth as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(TPAC_SESSION_EVENT, updateAuth as EventListener);
    };
  }, []);

  void identityBump;
  const role = getCurrentRole();
  const holder = getCurrentHolderName();

  const handleLogout = () => {
    tpacSignOut();
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: "/events", label: "Programmes", icon: <Calendar className="w-4 h-4" /> },
    { path: "/gear", label: "Inventory", icon: <Package className="w-4 h-4" /> },
    { path: "/feedback", label: "AARs", icon: <MessageSquare className="w-4 h-4" /> },
    { path: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    ...(canManageAccessCodes()
      ? [{ path: "/admin/access", label: "Access", icon: <KeyRound className="w-4 h-4" /> }]
      : []),
    ...(canStaffManage()
      ? [{ path: "/admin/exports", label: "Exports", icon: <FileDown className="w-4 h-4" /> }]
      : []),
    { path: "/developer-notes", label: "Dev Notes", icon: <FileCode className="w-4 h-4" /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const roleLabel = role?.trim() || null;
  const roleBadgeTitle =
    roleLabel && holder?.trim()
      ? `${roleLabel} — ${holder.trim()}`
      : roleLabel || holder?.trim() || undefined;

  return (
    <header className="bg-white border-b sticky top-0 z-30">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="flex items-center shrink-0">
            <span className="font-bold text-2xl text-black">TPAC OS</span>
          </Link>
          {isAuthed && roleLabel ? (
            <Badge
              variant="secondary"
              className="hidden lg:inline-flex max-w-[min(280px,calc(100vw-620px))] font-normal py-1 px-2.5 whitespace-nowrap"
              title={roleBadgeTitle}
            >
              {roleLabel}
            </Badge>
          ) : null}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn("nav-link hover-scale", isActive(item.path) && "active")}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2 shrink-0">
          {isAuthed && roleLabel ? (
            <Badge variant="outline" className="lg:hidden text-[11px] font-normal px-2 py-0.5 max-w-[min(200px,42vw)] truncate" title={roleBadgeTitle}>
              {roleLabel}
            </Badge>
          ) : null}
          {isAuthed && (
            <Button variant="ghost" onClick={handleLogout} className="hidden md:inline-flex items-center">
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
