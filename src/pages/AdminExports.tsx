import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TableName = "aar_reports" | "aar_forms" | "gear" | "gear_events";

const today = () => new Date().toISOString().slice(0, 10);

const toCsv = (rows: Record<string, unknown>[]): string => {
  if (!rows.length) return "";
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(","));
  return lines.join("\n");
};

const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const EXPORTS: { table: TableName; label: string; description: string; filePrefix: string }[] = [
  {
    table: "aar_reports",
    label: "AAR Reports",
    description: "Filed after-action reports with feedback details.",
    filePrefix: "aar-reports",
  },
  {
    table: "aar_forms",
    label: "AAR Form Links",
    description: "External feedback form links and response counts.",
    filePrefix: "aar-forms",
  },
  {
    table: "gear",
    label: "Gear Inventory",
    description: "Current gear list with quantity, condition, and notes.",
    filePrefix: "gear-inventory",
  },
  {
    table: "gear_events",
    label: "Gear Usage History",
    description: "Gear assignments to events over time.",
    filePrefix: "gear-usage",
  },
];

const AdminExports = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<TableName | null>(null);

  const handleExport = async (table: TableName, filePrefix: string) => {
    setLoading(table);
    try {
      const { data, error } = await supabase.from(table).select("*").limit(10000);
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: "Nothing to export", description: `${table} is empty.` });
        return;
      }
      downloadCsv(`${filePrefix}-${today()}.csv`, toCsv(data as Record<string, unknown>[]));
      toast({ title: "Export ready", description: `${data.length} row(s) downloaded.` });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 page-enter max-w-3xl mx-auto">
        <div>
          <h1 className="flex items-center gap-2">
            <FileDown className="h-6 w-6" />
            Data Exports
          </h1>
          <p className="text-muted-foreground">
            Download feedback and gear data as CSV. Files open in Excel or Google Sheets.
          </p>
        </div>

        <div className="grid gap-4">
          {EXPORTS.map((exp) => (
            <Card key={exp.table}>
              <CardHeader>
                <CardTitle className="text-lg">{exp.label}</CardTitle>
                <CardDescription>{exp.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport(exp.table, exp.filePrefix)}
                  disabled={loading !== null}
                >
                  {loading === exp.table ? (
                    <>
                      <Loader2 className="animate-spin" /> Exporting…
                    </>
                  ) : (
                    <>
                      <Download /> Download CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminExports;
