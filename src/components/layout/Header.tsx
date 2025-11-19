
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Package, MessageSquare, LogOut, User, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";


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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-link",
                isActive(item.path) && "active"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          {/* Auth Buttons for Desktop */}
            {isAuthed && (
              <Button variant="ghost" onClick={handleLogout} className="hidden md:inline-flex items-center">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-2 py-3 px-2",
                  isActive(item.path) ? "text-primary font-medium" : "text-gray-700"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="border-t -mx-4 my-2"></div>
            {isAuthed && (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-2 py-3 px-2 w-full text-left text-red-600 hover:bg-red-50 rounded"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
