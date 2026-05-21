import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isSuperAdmin, getCurrentCode, getCurrentRole, ADMIN_ROLES } from "@/lib/auth";
import { KeyRound, Plus, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";

interface AccessCode {
  id: string;
  code: string;
  role: string;
  holder_name: string | null;
  active: boolean;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  last_used_at: string | null;
}

const ALL_ROLES = [
  "President", "Vice-President",
  "Honorary Secretary", "Honorary Assistant Secretary",
  "Honorary Treasurer", "Honorary Assistant Treasurer",
  "Training Head (General)", "Training Head (Land)", "Training Head (Water)", "Training Head (Welfare)",
  "Quartermaster", "Assistant Quarter Master",
  "Publicity Head", "First Assistant Publicity Head", "Second Assistant Publicity Head",
  "Member",
];

const randomCode = () => String(Math.floor(100000 + Math.random() * 900000));

const AdminAccess: React.FC = () => {
  const { toast } = useToast();
  const allowed = isSuperAdmin();
  const [codes, setCodes] = React.useState<AccessCode[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [newOpen, setNewOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({ code: randomCode(), role: "Member", holder_name: "" });

  const audit = React.useCallback((action: string, access_code_id: string | null, details: any = {}) => {
    supabase.from("access_codes_audit_log").insert({
      access_code_id,
      action,
      performed_by_code: getCurrentCode(),
      performed_by_role: getCurrentRole(),
      details,
    }).then(() => {});
  }, []);

  const fetchCodes = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("access_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load codes", description: error.message, variant: "destructive" });
    else setCodes((data as AccessCode[]) || []);
    setLoading(false);
  }, [toast]);

  React.useEffect(() => {
    if (!allowed) return;
    fetchCodes();
    const ch = supabase
      .channel("access-codes-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "access_codes" }, fetchCodes)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [allowed, fetchCodes]);

  if (!allowed) {
    return (
      <MainLayout>
        <Card className="card-premium max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" />Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Only the President and Vice-President can manage access codes.
            </p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const handleCreate = async () => {
    if (!/^\d{6}$/.test(draft.code)) {
      toast({ title: "Code must be 6 digits", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase
      .from("access_codes")
      .insert({ code: draft.code, role: draft.role, holder_name: draft.holder_name || null })
      .select("id")
      .single();
    if (error) {
      toast({ title: "Failed to create code", description: error.message, variant: "destructive" });
      return;
    }
    audit("create", data?.id ?? null, { code: draft.code, role: draft.role, holder_name: draft.holder_name });
    toast({ title: "Code created", description: `${draft.code} (${draft.role})` });
    setDraft({ code: randomCode(), role: "Member", holder_name: "" });
    setNewOpen(false);
  };

  const toggleActive = async (c: AccessCode) => {
    const { error } = await supabase.from("access_codes").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    audit(c.active ? "deactivate" : "activate", c.id, {});
  };

  const rotateCode = async (c: AccessCode) => {
    const next = randomCode();
    const { error } = await supabase.from("access_codes").update({ code: next }).eq("id", c.id);
    if (error) return toast({ title: "Rotate failed", description: error.message, variant: "destructive" });
    audit("rotate", c.id, { from: c.code, to: next });
    toast({ title: "Code rotated", description: `New code: ${next}` });
  };

  const deleteCode = async (c: AccessCode) => {
    const { error } = await supabase.from("access_codes").delete().eq("id", c.id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    audit("delete", c.id, { code: c.code, role: c.role });
    toast({ title: "Code deleted" });
  };

  const updateHolder = async (c: AccessCode, value: string) => {
    const { error } = await supabase.from("access_codes").update({ holder_name: value || null }).eq("id", c.id);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else audit("update_holder", c.id, { holder_name: value });
  };

  const filtered = codes.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.code.includes(q) || c.role.toLowerCase().includes(q) || (c.holder_name || "").toLowerCase().includes(q);
  });

  return (
    <MainLayout>
      <div className="space-y-6 page-enter">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2"><KeyRound className="h-6 w-6 text-primary" />Access Codes</h1>
            <p className="text-muted-foreground">Manage who can sign in. Changes apply instantly — no redeploy.</p>
          </div>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New code</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue a new access code</DialogTitle>
                <DialogDescription>The holder uses this 6-digit code on the sign-in screen.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Code</Label>
                  <div className="flex gap-2">
                    <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
                    <Button type="button" variant="outline" onClick={() => setDraft({ ...draft, code: randomCode() })}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Holder name (optional)</Label>
                  <Input value={draft.holder_name} onChange={(e) => setDraft({ ...draft, holder_name: e.target.value })} placeholder="e.g. Jane Tan" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create code</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle>All codes ({codes.length})</CardTitle>
              <Input
                placeholder="Search code, role, or holder..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Holder</TableHead>
                      <TableHead>Last used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono">{c.code}</TableCell>
                        <TableCell>
                          <Badge variant={ADMIN_ROLES.has(c.role) ? "default" : "secondary"}>{c.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            defaultValue={c.holder_name || ""}
                            placeholder="—"
                            className="h-8"
                            onBlur={(e) => {
                              if ((e.target.value || "") !== (c.holder_name || "")) updateHolder(c, e.target.value);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.last_used_at ? new Date(c.last_used_at).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                            <span className="text-xs text-muted-foreground">{c.active ? "Active" : "Disabled"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline" onClick={() => rotateCode(c)} title="Generate new code">
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" title="Delete" aria-label={`Delete code ${c.code}`}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete code {c.code}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    The holder ({c.holder_name || c.role}) will no longer be able to sign in. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteCode(c)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete code
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No codes match.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminAccess;
