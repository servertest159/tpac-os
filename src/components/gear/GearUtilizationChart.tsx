import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { GearItem } from "@/hooks/useGearInventory";

interface Props {
  gear: GearItem[];
}

const CONDITION_COLORS: Record<string, string> = {
  excellent: "hsl(142, 71%, 45%)",
  good: "hsl(var(--primary))",
  fair: "hsl(38, 92%, 50%)",
  poor: "hsl(var(--destructive))",
  "needs repair": "hsl(var(--destructive))",
};

const GearUtilizationChart: React.FC<Props> = ({ gear }) => {
  const [eventUsage, setEventUsage] = React.useState<{ name: string; deployed: number }[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: rows } = await supabase
        .from("gear_events")
        .select("quantity, event_id")
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled || !rows) return;
      const ids = Array.from(new Set(rows.map((r: any) => r.event_id).filter(Boolean)));
      const { data: evs } = ids.length
        ? await supabase.from("events").select("id, title").in("id", ids)
        : { data: [] as any[] };
      const titleById = new Map<string, string>((evs ?? []).map((e: any) => [e.id, e.title]));
      const map = new Map<string, number>();
      rows.forEach((row: any) => {
        const title = titleById.get(row.event_id) ?? "Unassigned";
        map.set(title, (map.get(title) ?? 0) + (row.quantity ?? 0));
      });
      if (cancelled) return;
      setEventUsage(
        Array.from(map.entries())
          .map(([name, deployed]) => ({ name, deployed }))
          .sort((a, b) => b.deployed - a.deployed)
          .slice(0, 8)
      );
    };
    load();

    const channel = supabase
      .channel("gear-events-utilization")
      .on("postgres_changes", { event: "*", schema: "public", table: "gear_events" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  // By-item utilization (top deployed)
  const byItem = React.useMemo(() => {
    return gear
      .map((g) => ({
        name: g.name.length > 14 ? g.name.slice(0, 14) + "…" : g.name,
        deployed: Math.max(0, (g.quantity ?? 0) - (g.available ?? 0)),
        available: g.available ?? 0,
      }))
      .sort((a, b) => b.deployed + b.available - (a.deployed + a.available))
      .slice(0, 8);
  }, [gear]);

  // By condition
  const byCondition = React.useMemo(() => {
    const map = new Map<string, number>();
    gear.forEach((g) => {
      const key = (g.condition || "Unknown").trim();
      map.set(key, (map.get(key) ?? 0) + (g.quantity ?? 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [gear]);

  const totalQty = gear.reduce((s, g) => s + (g.quantity ?? 0), 0);
  const totalAvail = gear.reduce((s, g) => s + (g.available ?? 0), 0);
  const utilizationPct = totalQty > 0 ? Math.round(((totalQty - totalAvail) / totalQty) * 100) : 0;

  return (
    <Card className="card-premium">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Gear Utilization</CardTitle>
            <CardDescription>How your kit is being used right now.</CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{utilizationPct}%</div>
              <div className="text-xs text-muted-foreground">In Use</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalAvail}/{totalQty}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items">By Item</TabsTrigger>
            <TabsTrigger value="events">By Event</TabsTrigger>
            <TabsTrigger value="condition">By Condition</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byItem} margin={{ top: 16, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="available" stackId="a" fill="hsl(var(--muted-foreground) / 0.4)" name="Available" />
                <Bar dataKey="deployed" stackId="a" fill="hsl(var(--primary))" name="Deployed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="events" className="h-72">
            {eventUsage.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No gear has been assigned to programmes yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventUsage} layout="vertical" margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="deployed" fill="hsl(var(--primary))" name="Items Assigned" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="condition" className="h-72">
            {byCondition.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCondition} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {byCondition.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={CONDITION_COLORS[entry.name.toLowerCase()] ?? `hsl(${(i * 60) % 360}, 60%, 55%)`}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GearUtilizationChart;
