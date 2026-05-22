import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, ChevronDown } from "lucide-react";
import { FeedbackListSkeleton } from "@/components/ui/loading-states";
import { downloadAarReportCsv, downloadAarReportPdf } from "@/lib/exportAarReport";

type AarReportRow = Tables<"aar_reports">;

function ReadonlyField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  const text = value?.trim() || "—";
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`text-sm text-foreground ${multiline ? "whitespace-pre-wrap" : ""}`}>{text}</p>
    </div>
  );
}

const FeedbackReportDetail: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [report, setReport] = useState<AarReportRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    if (!reportId) {
      setLoading(false);
      setReport(null);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.from("aar_reports").select("*").eq("id", reportId).maybeSingle();

      if (error) throw error;
      setReport(data);
    } catch (err) {
      console.error("Error loading AAR report:", err);
      toast({ title: "Failed to load report", variant: "destructive" });
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportId, toast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <MainLayout>
        <FeedbackListSkeleton />
      </MainLayout>
    );
  }

  if (!reportId || !report) {
    return (
      <MainLayout>
        <div className="space-y-4 page-enter">
          <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
            <Link to="/feedback">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to AARs
            </Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Report not found</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              This AAR may have been removed or the link is invalid.
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleExportPdf = () => {
    try {
      downloadAarReportPdf(report);
      toast({ title: "PDF exported", description: `Saved "${report.programme_title}" as PDF.` });
    } catch (err) {
      console.error(err);
      toast({
        title: "PDF export failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportCsv = () => {
    try {
      downloadAarReportCsv(report);
      toast({ title: "CSV exported", description: "One-row file opens in Excel or Sheets." });
    } catch (err) {
      console.error(err);
      toast({
        title: "CSV export failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 page-enter">
        <div className="flex flex-wrap gap-4 items-start justify-between">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
              <Link to="/feedback">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to AARs
              </Link>
            </Button>
            <div className="flex items-start gap-2">
              <FileText className="h-7 w-7 shrink-0 mt-0.5" />
              <div>
                <h1>{report.programme_title}</h1>
                <p className="text-muted-foreground">
                  After Action Report • Filed{" "}
                  {new Date(report.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPdf}>Download PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCsv}>Download CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {report.event_id ? (
              <Button variant="outline" asChild>
                <Link to={`/events/${report.event_id}`}>View programme</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReadonlyField label="Reporter name" value={report.reporter_name} />
              <ReadonlyField
                label="Date of programme"
                value={new Date(report.date_of_programme).toLocaleDateString(undefined, { dateStyle: "medium" })}
              />
              <ReadonlyField label="Location" value={report.location} />
            </div>

            <ReadonlyField label="Participants" value={report.participants} multiline />
            <ReadonlyField label="Were objectives met?" value={report.objectives_met} multiline />
            <ReadonlyField label="What went well?" value={report.what_went_well} multiline />
            <ReadonlyField label="What could be improved?" value={report.what_could_be_improved} multiline />
            <ReadonlyField label="Lessons learned" value={report.lessons_learned} multiline />
            <ReadonlyField label="Recommendations" value={report.recommendations} multiline />
            <ReadonlyField label="Additional comments" value={report.additional_comments} multiline />

            <div className="pt-4">
              <Button variant="outline" onClick={() => navigate("/feedback")}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default FeedbackReportDetail;
