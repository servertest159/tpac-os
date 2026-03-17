
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const aarFormSchema = z.object({
  programmeTitle: z.string().min(1, "Programme title is required"),
  reporterName: z.string().min(1, "Reporter name is required"),
  dateOfProgramme: z.string().min(1, "Date is required"),
  location: z.string().min(1, "Location is required"),
  participants: z.string().min(1, "Participants list is required"),
  objectivesMet: z.string().min(1, "Please describe if objectives were met"),
  whatWentWell: z.string().min(1, "Please describe what went well"),
  whatCouldBeImproved: z.string().min(1, "Please describe what could be improved"),
  lessonsLearned: z.string().min(1, "Please share lessons learned"),
  recommendations: z.string().optional(),
  additionalComments: z.string().optional(),
});

type AarFormValues = z.infer<typeof aarFormSchema>;

const AarForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const eventId = searchParams.get('eventId');

  const form = useForm<AarFormValues>({
    resolver: zodResolver(aarFormSchema),
    defaultValues: {
      programmeTitle: "",
      reporterName: "",
      dateOfProgramme: "",
      location: "",
      participants: "",
      objectivesMet: "",
      whatWentWell: "",
      whatCouldBeImproved: "",
      lessonsLearned: "",
      recommendations: "",
      additionalComments: "",
    },
  });

  const onSubmit = async (values: AarFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Here you would typically save the AAR to the database
      // For now, we'll simulate saving and show success
      console.log("AAR Report Data:", values);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "✅ AAR Report Filed Successfully",
        description: "Your After Action Report has been submitted and logged.",
      });
      
      navigate("/feedback");
    } catch (error) {
      toast({
        title: "❌ Failed to Submit AAR",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          File After Action Report (AAR)
        </h1>
        <p className="text-muted-foreground">
          Complete this form to document lessons learned and recommendations from your programme.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>After Action Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="programmeTitle">Programme Title *</Label>
                <Input
                  id="programmeTitle"
                  {...form.register("programmeTitle")}
                  placeholder="e.g., MacRitchie Treetop Walk"
                />
                {form.formState.errors.programmeTitle && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.programmeTitle.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporterName">Reporter Name *</Label>
                <Input
                  id="reporterName"
                  {...form.register("reporterName")}
                  placeholder="Your full name"
                />
                {form.formState.errors.reporterName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.reporterName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfProgramme">Date of Programme *</Label>
                <Input
                  id="dateOfProgramme"
                  type="date"
                  {...form.register("dateOfProgramme")}
                />
                {form.formState.errors.dateOfProgramme && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.dateOfProgramme.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  placeholder="Programme location"
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participants">Participants *</Label>
              <Textarea
                id="participants"
                {...form.register("participants")}
                placeholder="List all participants who attended the programme"
                rows={3}
              />
              {form.formState.errors.participants && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.participants.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectivesMet">Were the programme objectives met? *</Label>
              <Textarea
                id="objectivesMet"
                {...form.register("objectivesMet")}
                placeholder="Describe whether the planned objectives were achieved and to what extent"
                rows={4}
              />
              {form.formState.errors.objectivesMet && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.objectivesMet.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatWentWell">What went well? *</Label>
              <Textarea
                id="whatWentWell"
                {...form.register("whatWentWell")}
                placeholder="Describe the positive aspects and successes of the programme"
                rows={4}
              />
              {form.formState.errors.whatWentWell && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.whatWentWell.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatCouldBeImproved">What could be improved? *</Label>
              <Textarea
                id="whatCouldBeImproved"
                {...form.register("whatCouldBeImproved")}
                placeholder="Identify areas for improvement and challenges encountered"
                rows={4}
              />
              {form.formState.errors.whatCouldBeImproved && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.whatCouldBeImproved.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lessonsLearned">Key Lessons Learned *</Label>
              <Textarea
                id="lessonsLearned"
                {...form.register("lessonsLearned")}
                placeholder="What are the key takeaways from this programme?"
                rows={4}
              />
              {form.formState.errors.lessonsLearned && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.lessonsLearned.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations for Future Programmes</Label>
              <Textarea
                id="recommendations"
                {...form.register("recommendations")}
                placeholder="Specific recommendations for similar future programmes"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalComments">Additional Comments</Label>
              <Textarea
                id="additionalComments"
                {...form.register("additionalComments")}
                placeholder="Any other relevant information or observations"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/feedback")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Filing Report..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    File AAR Report
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AarForm;
