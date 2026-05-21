
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Package, MessageSquare, LogOut, User, FileCode, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSuperAdmin } from "@/lib/auth";


const cleanupAuthState = () => {
  try {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) localStorage.removeItem(key);
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) sessionStorage.removeItem(key);
    });
  } catch {}
};

const Header = () => {
  const location = useLocation();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const updateAuth = () => {
      const hasAccessCode = localStorage.getItem('tpac_access_granted') === 'true';
      setIsAuthed(hasAccessCode);
    };
    updateAuth();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tpac_access_granted') updateAuth();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogout = async () => {
    try {
      cleanupAuthState();
      // Clear access code state as well
      localStorage.removeItem('tpac_access_granted');
      localStorage.removeItem('tpac_user_role');
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: "/events", label: "Programmes", icon: <Calendar className="w-4 h-4" /> },
    { path: "/gear", label: "Inventory", icon: <Package className="w-4 h-4" /> },
    { path: "/feedback", label: "AARs", icon: <MessageSquare className="w-4 h-4" /> },
    { path: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    ...(isSuperAdmin() ? [{ path: "/admin/access", label: "Access", icon: <KeyRound className="w-4 h-4" /> }] : []),
    { path: "/developer-notes", label: "Dev Notes", icon: <FileCode className="w-4 h-4" /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b sticky top-0 z-30">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center space-x-2">
          <Link to="/dashboard" className="flex items-center">
            <span className="font-bold text-2xl text-black">TPAC OS</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-link hover-scale",
                isActive(item.path) && "active"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
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
