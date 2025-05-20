
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST to prevent missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        
        // Show toast for specific auth events
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome back!",
            description: "You have been successfully logged in.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Logged out",
            description: "You have been successfully logged out.",
          });
        } else if (event === 'USER_UPDATED') {
          toast({
            title: "Account updated",
            description: "Your account has been successfully updated.",
          });
        } else if (event === 'EMAIL_VERIFICATION_STATUS_CHANGED') {
          toast({
            title: "Email verification status updated",
            description: "Your email verification status has been updated.",
          });
        }
      }
    );

    // THEN check for existing session and verification status
    const checkUser = async () => {
      // Check if user is logged in with Supabase
      const { data, error } = await supabase.auth.getSession();
      
      // Check URL for verification success
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.slice(1));
      const type = hashParams.get('type');
      
      if (type === 'email_verification') {
        toast({
          title: "Email verification successful",
          description: "Your email has been verified. You can now access all features.",
        });
        
        // Clean URL to remove hash fragments
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 0);
      }
      
      setUser(data.session?.user || null);
      setLoading(false);
    };

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  // If logged in, redirect to dashboard, otherwise to auth
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />;
};

export default Index;
