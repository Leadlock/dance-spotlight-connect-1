import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Music2, Users, Eye, Trash2 } from "lucide-react";

interface Event {
  id: string;
  name: string;
  dance_style: string;
  gender_preference: string;
  created_at: string;
}

interface Application {
  id: string;
  dancer: {
    name: string;
    email: string;
    dance_style: string;
    gender: string;
    video_url: string;
  };
}

interface OrganizerEventsListProps {
  organizerId: string;
}

export const OrganizerEventsList = ({ organizerId }: OrganizerEventsListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showApplicants, setShowApplicants] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [organizerId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", organizerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          dancer:profiles(name, email, dance_style, gender, video_url)
        `)
        .eq("event_id", eventId);

      if (error) throw error;
      setApplications(data as any || []);
    } catch (error: any) {
      toast.error("Failed to load applications");
    }
  };

  const handleViewApplicants = async (event: Event) => {
    setSelectedEvent(event);
    await fetchApplications(event.id);
    setShowApplicants(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;

      setEvents(events.filter((e) => e.id !== eventId));
      toast.success("Event deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete event");
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">You haven't created any events yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all">
            <div className="h-2 bg-gradient-to-r from-secondary to-accent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music2 className="w-5 h-5 text-secondary" />
                {event.name}
              </CardTitle>
              <CardDescription>{new Date(event.created_at).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Music2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{event.dance_style}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{event.gender_preference}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewApplicants(event)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Applicants
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showApplicants} onOpenChange={setShowApplicants}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applicants for {selectedEvent?.name}</DialogTitle>
            <DialogDescription>
              {applications.length} {applications.length === 1 ? "dancer has" : "dancers have"} applied
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No applications yet
              </div>
            ) : (
              applications.map((app) => (
                <Card key={app.id} className="overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-secondary to-accent" />
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-xl mb-3">{app.dancer.name}</h3>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Music2 className="w-3 h-3" />
                            {app.dancer.dance_style}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Users className="w-3 h-3" />
                            {app.dancer.gender}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{app.dancer.email}</p>
                    </div>
                    
                    {app.dancer.video_url ? (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Performance Video</h4>
                        <div className="rounded-lg overflow-hidden bg-muted">
                          <video
                            src={app.dancer.video_url}
                            controls
                            className="w-full"
                            style={{ maxHeight: "400px" }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No performance video uploaded
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
