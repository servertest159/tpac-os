
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Users, Package, MessageSquare, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: "/events", label: "Programmes", icon: <Calendar className="w-4 h-4" /> },
    { path: "/crew", label: "Crew", icon: <Users className="w-4 h-4" /> },
    { path: "/gear", label: "Inventory", icon: <Package className="w-4 h-4" /> },
    { path: "/feedback", label: "AARs", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "👋 Stand easy, you're logged out!",
      description: "Your mission data is secure. See you on the trails!",
      duration: 3000,
    });
  };

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

        <div className="flex items-center space-x-4">
          {/* Desktop Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="hidden md:flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </Button>

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
            {/* Mobile Logout Button */}
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="flex items-center space-x-2 py-3 px-2 text-gray-700 w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
