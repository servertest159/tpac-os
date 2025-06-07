
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
  };

  const revokeAccess = () => {
    localStorage.removeItem("tpac_access_granted");
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    grantAccess,
    revokeAccess
  };
};
