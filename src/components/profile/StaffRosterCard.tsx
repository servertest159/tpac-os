import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

type HolderRow = {
  id: string;
  holder_name: string | null;
  role: string;
  active: boolean;
};

/**
 * Invite roster from `access_codes` (who holds which role).
 * Operational “members/profiles” for this deployment; excludes raw codes from UI.
 */
const StaffRosterCard: React.FC = () => {
  const [rows, setRows] = React.useState<HolderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("access_codes")
        .select("id, holder_name, role, active")
        .order("holder_name", { ascending: true });
      if (cancelled) return;
      if (error) setErr(error.message);
      else setRows((data as HolderRow[]) || []);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <Card className="card-premium w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Access roster</CardTitle>
        <CardDescription>
          Holders and roles backed by invite codes (no codes shown here). Matches what committee can administer under Access Codes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : err ? (
          <p className="text-sm text-destructive">{err}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Holder</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.holder_name ?? "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{r.role}</Badge></TableCell>
                    <TableCell>{r.active ? "Active" : "Disabled"}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      No roster rows loaded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffRosterCard;
