import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import tpacLogo from "@/assets/tpac-logo.png";
import { DEVELOPER_ACCESS_CODE, emitTpacSessionUpdate } from "@/lib/auth";

interface AccessGateProps {
  onAccessGranted: () => void;
}

function formatSixDigits(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 6);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)} · ${d.slice(3)}`;
}

const AccessGate: React.FC<AccessGateProps> = ({ onAccessGranted }) => {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const digits = code.replace(/\D/g, "").slice(0, 6);

  const handleCodeInput = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, 6));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    handleCodeInput(pasted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const trimmed = digits;

    // Maintainer bypass — works without DB round-trip (migration still seeds parity for Edge Functions).
    if (trimmed === DEVELOPER_ACCESS_CODE) {
      setMessage(`✅ Access granted. Developer session.`);
      localStorage.setItem("tpac_access_granted", "true");
      localStorage.setItem("tpac_user_role", "Developer");
      localStorage.setItem("tpac_access_code", trimmed);
      localStorage.setItem("tpac_holder_name", "Developer");
      emitTpacSessionUpdate();
      setTimeout(() => onAccessGranted(), 500);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("access_codes")
        .select("id, code, role, holder_name, active, expires_at")
        .eq("code", trimmed)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setMessage(
          "❌ Invalid code. This platform is invite-only. Check you entered all 6 digits. For a new code, contact your President, Vice‑President, or Quartermaster.",
        );
        setCode("");
      } else if (!data.active) {
        setMessage(
          "⚠️ This code has been deactivated. Request a new code from your President, Vice‑President, Committee leads, or Quartermaster.",
        );
        setCode("");
      } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setMessage(
          "⚠️ This code has expired. Request a renewed code from your President, Vice‑President, Committee leads, or Quartermaster.",
        );
        setCode("");
      } else {
        setMessage(`✅ Access granted. Welcome, ${data.holder_name || data.role}.`);
        localStorage.setItem("tpac_access_granted", "true");
        localStorage.setItem("tpac_user_role", data.role);
        localStorage.setItem("tpac_access_code", trimmed);
        if (data.holder_name) localStorage.setItem("tpac_holder_name", data.holder_name);

        supabase
          .from("access_codes")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", data.id)
          .then(() => {});

        emitTpacSessionUpdate();
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
          <p className="text-muted-foreground">Enter your 6-digit access code to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Access code</Label>
              <Input
                id="access-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={digits}
                onChange={(e) => handleCodeInput(e.target.value)}
                onPaste={handlePaste}
                placeholder="6 digits"
                required
                disabled={isLoading}
                aria-describedby="access-code-hint access-code-remember"
                className="text-center text-lg tracking-[0.4em] font-mono tabular-nums"
              />
              {digits.length > 0 ? (
                <p id="access-code-preview" className="text-center text-sm font-mono tabular-nums text-muted-foreground" aria-live="polite">
                  {formatSixDigits(digits)}
                </p>
              ) : null}
              <p id="access-code-hint" className="text-xs text-muted-foreground">
                Tip: you can <strong>paste</strong> the full code (Ctrl+V / long-press). Grouping is visual only.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || digits.length < 6}>
              {isLoading ? "Verifying..." : "Access platform"}
            </Button>

            <p id="access-code-remember" className="text-[11px] text-muted-foreground leading-snug border-t pt-3">
              This device will stay signed in until you log out or clear site data.{" "}
              <span className="text-amber-800 dark:text-amber-200">
                Do not use “Remember me” on shared or public computers.
              </span>
            </p>

            {message && (
              <div
                role="status"
                className={`text-center text-sm p-3 rounded ${
                  message.includes("✅")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : message.includes("⚠️")
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
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
