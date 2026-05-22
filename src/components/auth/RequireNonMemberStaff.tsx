import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canStaffManage } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";

/**
 * Access-code roles other than {@link MEMBER_ROLE_LABEL} may manage gear, AAR admin surfaces,
 * data exports, profiles (where RLS allows), and /admin/access codes.
 */
export default function RequireNonMemberStaff({ children }: { children: React.ReactNode }) {
  if (!canStaffManage()) {
    return (
      <Card className="card-premium max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Committee access only
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This area is for committee and role leads. Member codes can view programmes and inventory but cannot add,
            edit, or delete records here. Use an access code issued for a committee role, or ask a President or
            Vice-President to reissue your code with the right role.
          </p>
        </CardContent>
      </Card>
    );
  }
  return <>{children}</>;
}
