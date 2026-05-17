import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Package, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UsageRecord {
  id: string;
  quantity: number;
  created_at: string | null;
  gear_id: string | null;
  event_id: string | null;
  gear_name?: string;
  event_title?: string;
  event_date?: string | null;
  event_end_date?: string | null;
}

const GearUsageHistory: React.FC = () => {
  const [records, setRecords] = React.useState<UsageRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchHistory = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gear_events")
      .select("id, quantity, created_at, gear_id, event_id, gear:gear_id(name), event:event_id(title, date, end_date)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setRecords(
        (data as any[]).map((r) => ({
          id: r.id,
          quantity: r.quantity,
          created_at: r.created_at,
          gear_id: r.gear_id,
          event_id: r.event_id,
          gear_name: r.gear?.name,
          event_title: r.event?.title,
          event_date: r.event?.date,
          event_end_date: r.event?.end_date,
        }))
      );
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchHistory();
    const channel = supabase
      .channel("gear-usage-history")
      .on("postgres_changes", { event: "*", schema: "public", table: "gear_events" }, fetchHistory)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchHistory]);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.gear_name?.toLowerCase().includes(q) || r.event_title?.toLowerCase().includes(q);
  });

  const isPast = (end?: string | null) => end && new Date(end) < new Date();

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Gear Usage History
        </CardTitle>
        <p className="text-sm text-muted-foreground">Chronological log of gear assigned to programmes.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by gear or programme..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="mx-auto h-10 w-10 mb-2 opacity-50" />
            <p>No usage history yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{r.gear_name || "Unknown gear"}</span>
                    <Badge variant="outline">×{r.quantity}</Badge>
                    {isPast(r.event_end_date) ? (
                      <Badge variant="secondary">Returned</Badge>
                    ) : (
                      <Badge className="bg-primary/15 text-primary border-primary/30">In Use</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="truncate">{r.event_title || "Unknown programme"}</span>
                    {r.event_date && (
                      <span className="text-xs">· {new Date(r.event_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {r.created_at && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Assigned {new Date(r.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GearUsageHistory;
