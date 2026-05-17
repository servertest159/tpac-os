import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import tpacLogo from "@/assets/tpac-logo.png";

interface AccessGateProps {
  onAccessGranted: () => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ onAccessGranted }) => {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const trimmed = code.trim();
    try {
      const { data, error } = await supabase
        .from("access_codes")
        .select("id, code, role, holder_name, active, expires_at")
        .eq("code", trimmed)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setMessage("❌ Invalid code. This platform is invite-only. Contact the developer if you believe this is a mistake.");
        setCode("");
      } else if (!data.active) {
        setMessage("⚠️ This code has been deactivated. Please request a new one from your President or Vice-President.");
        setCode("");
      } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setMessage("⚠️ This code has expired. Please request a renewed code from your President or Vice-President.");
        setCode("");
      } else {
        setMessage(`✅ Access granted. Welcome, ${data.holder_name || data.role}.`);
        localStorage.setItem("tpac_access_granted", "true");
        localStorage.setItem("tpac_user_role", data.role);
        localStorage.setItem("tpac_access_code", trimmed);
        if (data.holder_name) localStorage.setItem("tpac_holder_name", data.holder_name);

        // Fire-and-forget: stamp last_used_at
        supabase.from("access_codes").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(() => {});

        setTimeout(() => onAccessGranted(), 800);
      }
    } catch (err) {
      console.error("AccessGate error", err);
      setMessage("❌ Could not verify code. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <img src={tpacLogo} alt="TPAC Logo" className="w-24 h-24" />
          </div>
          <CardTitle className="text-2xl font-bold">TPAC OS</CardTitle>
          <p className="text-muted-foreground">Enter your access code to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Access Code</Label>
              <Input
                id="access-code"
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                disabled={isLoading}
                className="text-center text-lg tracking-wider"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !code.trim()}>
              {isLoading ? "Verifying..." : "Access Platform"}
            </Button>

            {message && (
              <div className={`text-center text-sm p-3 rounded ${
                message.includes("✅")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : message.includes("⚠️")
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessGate;
