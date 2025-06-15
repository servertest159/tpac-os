
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, BarChart, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import AddFeedbackDialog from "./AddFeedbackDialog";

// Define the type for a feedback item
interface FeedbackItem {
  id: string;
  eventTitle: string;
  eventDate: string;
  responseCount: number;
  participantCount: number;
  averageRating: number;
  status: "completed" | "pending";
  url?: string; // Add optional URL for MS Forms
}

// Sample data for feedback responses
const initialFeedbackData: FeedbackItem[] = [
  {
    id: "1",
    eventTitle: "Mountain Hiking Weekend",
    eventDate: "2025-04-10",
    responseCount: 6,
    participantCount: 8,
    averageRating: 4.5,
    status: "completed",
  },
  {
    id: "2",
    eventTitle: "Kayaking Trip",
    eventDate: "2025-05-05",
    responseCount: 4,
    participantCount: 6,
    averageRating: 4.2,
    status: "completed",
  },
  {
    id: "3",
    eventTitle: "Rock Climbing Workshop",
    eventDate: "2025-05-15",
    responseCount: 10,
    participantCount: 12,
    averageRating: 4.8,
    status: "completed",
  },
  {
    id: "4",
    eventTitle: "Mountain Biking Adventure",
    eventDate: "2025-07-12",
    responseCount: 0,
    participantCount: 0,
    averageRating: 0,
    status: "pending",
  },
];

const FeedbackList = () => {
  const [feedbackData, setFeedbackData] = React.useState<FeedbackItem[]>(initialFeedbackData);
  const [filter, setFilter] = React.useState<"all" | "completed" | "pending">("all");

  const handleAddForm = (values: { title: string; url: string }) => {
    const newFeedback: FeedbackItem = {
      id: new Date().getTime().toString(),
      eventTitle: values.title,
      url: values.url,
      eventDate: new Date().toISOString().split("T")[0],
      responseCount: 0,
      participantCount: 0,
      averageRating: 0,
      status: "pending",
    };
    setFeedbackData((prevData) => [newFeedback, ...prevData]);
  };

  const filteredFeedback = feedbackData.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>AAR (After Action Review) Forms</h1>
          <p className="text-muted-foreground">Collect and manage mission feedback via Microsoft Forms.</p>
        </div>
        <AddFeedbackDialog onFormSubmit={handleAddForm}>
          <Button>Create AAR Form</Button>
        </AddFeedbackDialog>
      </div>

      {/* Filter buttons */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All AARs
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
        >
          Completed
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          Pending
        </Button>
      </div>

      {filteredFeedback.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 mb-2">No AAR forms found</h3>
          <p className="text-muted-foreground mb-4">
            {filter !== "all"
              ? `There are no ${filter} AAR forms.`
              : "You haven't added any AAR forms yet."}
          </p>
          <AddFeedbackDialog onFormSubmit={handleAddForm}>
            <Button>Create AAR Form</Button>
          </AddFeedbackDialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeedback.map((item) => (
            <Card key={item.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.eventTitle}</CardTitle>
                  <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                    {item.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{new Date(item.eventDate).toLocaleDateString()}</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="text-muted-foreground">Response Rate:</span>
                      <span>{item.responseCount}/{item.participantCount}</span>
                    </div>
                    <Progress value={(item.responseCount / Math.max(item.participantCount, 1)) * 100} />
                  </div>
                  
                  {item.status === "completed" && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Average Rating:</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">{item.averageRating.toFixed(1)}</span>
                        <span className="text-muted-foreground">/5</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {item.status === "completed" ? (
                  <Button asChild variant="default" className="w-full">
                    <Link to={`/feedback/${item.id}`}>View Responses</Link>
                  </Button>
                ) : item.url ? (
                  <Button asChild variant="default" className="w-full">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center">
                      <ExternalLink className="mr-2 h-4 w-4" /> Open Form
                    </a>
                  </Button>
                ) : (
                  <Button asChild variant="default" className="w-full">
                    <Link to={`/feedback/${item.id}/edit`}>Edit Form</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
