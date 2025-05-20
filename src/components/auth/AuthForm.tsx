
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Helper function to clean up auth state
  const cleanupAuthState = () => {
    // Remove all Supabase auth related items from storage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Also clean sessionStorage if needed
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Clean up existing auth state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      
      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      
      // Force page reload for a clean state
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Clean up existing auth state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      // Get the current origin for redirect URL
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth`; // Redirect back to auth page after verification
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            full_name: registerName
          },
          emailRedirectTo: redirectTo
        }
      });
      
      if (error) throw error;

      setVerificationSent(true);
      toast({
        title: "Account created!",
        description: "We've sent you an email verification link. Please check your inbox and verify your email to continue.",
      });
      
      // If autoconfirm is enabled, redirect to dashboard
      if (data.session) {
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if user arrived here after email verification
    const checkEmailConfirmation = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.slice(1));
      const type = hashParams.get('type');
      
      if (type === 'email_confirmation' || type === 'recovery' || type === 'invite') {
        toast({
          title: "Processing authentication...",
          description: "Please wait while we complete the process.",
        });
        
        // Let Supabase handle the token
        const { data, error } = await supabase.auth.getSession();
        
        if (data.session) {
          toast({
            title: "Authentication successful!",
            description: "Your account has been verified. You'll be redirected shortly.",
          });
          
          // Clean URL to remove hash fragments
          setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
            window.location.href = '/dashboard';
          }, 1500);
        } else if (error) {
          toast({
            title: "Authentication error",
            description: error.message || "There was a problem with authentication. Please try again.",
            variant: "destructive"
          });
        }
      }
    };

    checkEmailConfirmation();
  }, [toast]);

  return (
    <Tabs defaultValue="login" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>
      
      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Access your Singapore adventure planning dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input 
                  id="login-email" 
                  type="email" 
                  placeholder="hello@example.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input 
                  id="login-password" 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
      
      <TabsContent value="register">
        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Create an account to start planning your Singapore adventures
            </CardDescription>
          </CardHeader>
          {verificationSent ? (
            <CardContent className="space-y-4 text-center">
              <div className="p-4 bg-green-50 rounded-md">
                <h3 className="font-medium text-green-800">Email Verification Sent</h3>
                <p className="mt-2 text-sm text-green-700">
                  Please check your email inbox for a verification link. You need to verify your email before you can log in.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setVerificationSent(false)}
              >
                Register another account
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Name</Label>
                  <Input 
                    id="register-name" 
                    type="text" 
                    placeholder="John Doe" 
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="hello@example.com" 
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Register"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AuthForm;
