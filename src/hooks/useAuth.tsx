
import { useState, useEffect } from "react";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has previously been granted access
    const hasAccess = localStorage.getItem("tpac_access_granted") === "true";
    setIsAuthenticated(hasAccess);
    setIsLoading(false);
  }, []);

  const grantAccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem("tpac_access_granted", "true");
  };

  const logout = () => {
    // End the session by removing authentication status
    localStorage.removeItem("tpac_access_granted");
    setIsAuthenticated(false);
    
    // Note: We intentionally DO NOT clear user data like:
    // - Event drafts
    // - Gear entries
    // - User preferences
    // - Any other application data
    // This preserves the user's work for when they return
  };

  const revokeAccess = () => {
    logout();
  };

  return {
    isAuthenticated,
    isLoading,
    grantAccess,
    logout,
    revokeAccess
  };
};
