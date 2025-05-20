
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in with Supabase
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      // Check if we have a hash fragment that might indicate email verification
      const hash = window.location.hash;
      if (hash && hash.includes('type=email_verification')) {
        toast({
          title: "Email verification successful",
          description: "Your email has been verified. You can now log in to your account.",
        });
      }
      
      setUser(data.session?.user || null);
      setLoading(false);
    };

    checkUser();

    // Set up auth state listener
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
        }
      }
    );

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
