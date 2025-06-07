
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface AccessGateProps {
  onAccessGranted: () => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ onAccessGranted }) => {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validCodes = [
    938271, 472839, 615204, 307198, 529746, 184302, 763910, 920458, 
    381207, 640193, 859321, 712496, 530984, 298374, 476213
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate a brief loading state for security appearance
    setTimeout(() => {
      const numericCode = parseInt(code.trim());
      
      if (validCodes.includes(numericCode)) {
        setMessage("✅ Access granted. Welcome to the TPAC OS.");
        localStorage.setItem("tpac_access_granted", "true");
        setTimeout(() => {
          onAccessGranted();
        }, 1000);
      } else {
        setMessage("❌ Invalid code. This Platform is invite-only. Please contact the developer if you believe this is a mistake.");
        setCode("");
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
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
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !code.trim()}
            >
              {isLoading ? "Verifying..." : "Access Platform"}
            </Button>
            
            {message && (
              <div className={`text-center text-sm p-3 rounded ${
                message.includes("✅") 
                  ? "bg-green-50 text-green-700 border border-green-200" 
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
