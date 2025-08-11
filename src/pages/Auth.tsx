import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const search = new URLSearchParams(location.search);
  const redirect = search.get("redirect") || "/events";

  useEffect(() => {
    document.title = mode === "signin" ? "Sign in | TPAC OS" : "Sign up | TPAC OS";
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      toast({ title: "Success", description: "You are signed in." });
      navigate(redirect);
    } catch (err) {
      console.error("Auth error:", err);
      toast({ title: "Auth failed", description: err instanceof Error ? err.message : "" , variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}> 
              {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Auth;
