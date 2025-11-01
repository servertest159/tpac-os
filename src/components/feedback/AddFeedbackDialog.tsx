
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  url: z.string().url({ message: "Please enter a valid Microsoft Forms URL." }),
});

type AddFeedbackFormValues = z.infer<typeof formSchema>;

interface AddFeedbackDialogProps {
  children: React.ReactNode;
  onFormSubmit: (values: AddFeedbackFormValues) => void;
}

const AddFeedbackDialog = ({ children, onFormSubmit }: AddFeedbackDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<AddFeedbackFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  });

  const onSubmit = (values: AddFeedbackFormValues) => {
    onFormSubmit(values);
    toast({
      title: "🎉 AAR Form Link Saved!",
      description: "The form has been added to your list.",
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New AAR Form</DialogTitle>
          <DialogDescription>
            Create a form on Microsoft Forms, then paste the share link here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Button asChild variant="outline" className="w-full">
            <a href="https://forms.office.com/Pages/DesignPage.aspx" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Create a new form in Microsoft Forms
            </a>
          </Button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AAR Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MacRitchie Treetop Walk AAR" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Microsoft Forms Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://forms.office.com/r/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save Form</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFeedbackDialog;
