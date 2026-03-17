import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, BarChart, ExternalLink, FileText, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import AddFeedbackDialog from "./AddFeedbackDialog";
import { FeedbackListSkeleton } from "@/components/ui/loading-states";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AarForm {
  id: string;
  title: string;
  url: string | null;
  event_date: string;
  response_count: number;
  participant_count: number;
  average_rating: number;
  status: string;
  created_at: string;
}

interface AarReport {
  id: string;
  programme_title: string;
  reporter_name: string;
  date_of_programme: string;
  location: string;
  created_at: string;
}

const FeedbackList = () => {
  const [aarForms, setAarForms] = useState<AarForm[]>([]);
  const [aarReports, setAarReports] = useState<AarReport[]>([]);
  const [filter, setFilter] = useState<"all" | "forms" | "reports">("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [formsRes, reportsRes] = await Promise.all([
        supabase.from('aar_forms').select('*').order('created_at', { ascending: false }),
        supabase.from('aar_reports').select('id, programme_title, reporter_name, date_of_programme, location, created_at').order('created_at', { ascending: false }),
      ]);

      if (formsRes.error) throw formsRes.error;
      if (reportsRes.error) throw reportsRes.error;

      setAarForms(formsRes.data || []);
      setAarReports(reportsRes.data || []);
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      toast({ title: "❌ Failed to load feedback", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();

    const formsChannel = supabase
      .channel('aar-forms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aar_forms' }, () => fetchData())
      .subscribe();

    const reportsChannel = supabase
      .channel('aar-reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aar_reports' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(formsChannel);
      supabase.removeChannel(reportsChannel);
    };
  }, [fetchData]);

  const handleAddForm = async (values: { title: string; url: string }) => {
    try {
      const { error } = await supabase.from('aar_forms').insert({
        title: values.title,
        url: values.url,
        status: 'pending',
      });
      if (error) throw error;
      toast({ title: "🎉 AAR Form Link Saved!", description: "The form has been added." });
    } catch (err) {
      console.error('Error adding AAR form:', err);
      toast({ title: "❌ Failed to save form", variant: "destructive" });
    }
  };

  const handleDeleteForm = async (id: string) => {
    try {
      const { error } = await supabase.from('aar_forms').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "✅ Form deleted" });
    } catch (err) {
      toast({ title: "❌ Failed to delete", variant: "destructive" });
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const { error } = await supabase.from('aar_reports').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "✅ Report deleted" });
    } catch (err) {
      toast({ title: "❌ Failed to delete", variant: "destructive" });
    }
  };

  if (loading) {
    return <FeedbackListSkeleton />;
  }

  const hasContent = aarForms.length > 0 || aarReports.length > 0;
  const showForms = filter === "all" || filter === "forms";
  const showReports = filter === "all" || filter === "reports";

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1>AAR (After Action Review)</h1>
          <p className="text-muted-foreground">Manage AAR form links and filed reports.</p>
        </div>
        <div className="flex gap-2">
          <AddFeedbackDialog onFormSubmit={handleAddForm}>
            <Button variant="outline">Link AAR Form</Button>
          </AddFeedbackDialog>
          <Button asChild>
            <Link to="/feedback/new">
              <FileText className="mr-2 h-4 w-4" />
              File AAR Report
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 mb-6">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All ({aarForms.length + aarReports.length})
        </Button>
        <Button variant={filter === "forms" ? "default" : "outline"} onClick={() => setFilter("forms")}>
          Form Links ({aarForms.length})
        </Button>
        <Button variant={filter === "reports" ? "default" : "outline"} onClick={() => setFilter("reports")}>
          Filed Reports ({aarReports.length})
        </Button>
      </div>

      {!hasContent ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 mb-2">No AAR data found</h3>
          <p className="text-muted-foreground mb-4">Link an AAR form or file a report to get started.</p>
          <div className="flex gap-2 justify-center">
            <AddFeedbackDialog onFormSubmit={handleAddForm}>
              <Button variant="outline">Link AAR Form</Button>
            </AddFeedbackDialog>
            <Button asChild>
              <Link to="/feedback/new">File AAR Report</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* AAR Form Links */}
          {showForms && aarForms.length > 0 && (
            <div>
              {filter === "all" && <h2 className="text-lg font-semibold mb-4">Form Links</h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aarForms.map((item, index) => (
                  <Card key={item.id} className="card-hover hover-lift animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{new Date(item.event_date).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1 text-sm">
                            <span className="text-muted-foreground">Response Rate:</span>
                            <span>{item.response_count}/{item.participant_count}</span>
                          </div>
                          <Progress value={(item.response_count / Math.max(item.participant_count, 1)) * 100} />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      {item.url ? (
                        <Button asChild variant="default" className="flex-1">
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> Open Form
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" className="flex-1" disabled>No URL</Button>
                      )}
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteForm(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Filed AAR Reports */}
          {showReports && aarReports.length > 0 && (
            <div>
              {filter === "all" && <h2 className="text-lg font-semibold mb-4">Filed Reports</h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aarReports.map((report, index) => (
                  <Card key={report.id} className="card-hover hover-lift animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{report.programme_title}</CardTitle>
                        <Badge>Filed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{new Date(report.date_of_programme).toLocaleDateString()}</span>
                        </div>
                        <p className="text-muted-foreground">By: {report.reporter_name}</p>
                        <p className="text-muted-foreground">Location: {report.location}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" className="flex-1" disabled>
                        View Report
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteReport(report.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
