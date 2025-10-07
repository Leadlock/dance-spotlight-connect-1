import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Music2, Users, Eye, Trash2, CheckCircle, XCircle, FileText, User, Ruler, Palette, MessageCircle } from "lucide-react";
import { Messages } from "@/components/Messages";

interface Event {
  id: string;
  name: string;
  dance_style: string;
  gender_preference: string;
  created_at: string;
}

interface Application {
  id: string;
  created_at: string;
  status: string;
  dancer: {
    id: string;
    name: string;
    email: string;
    dance_style: string;
    gender: string;
    age?: number;
    height?: string;
    skin_tone?: string;
    experience?: string;
    about?: string;
    video_url: string | null;
    certification_document_url?: string | null;
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
  const [loadingApplications, setLoadingApplications] = useState(false);

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
    setLoadingApplications(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          created_at,
          status,
          dancer:profiles!applications_dancer_id_fkey (
            id,
            name,
            email,
            dance_style,
            gender,
            age,
            height,
            skin_tone,
            experience,
            about,
            video_url,
            certification_document_url
          )
        `)
        .eq("event_id", eventId);

      if (error) throw error;
      setApplications(data as unknown as Application[] || []);
    } catch (error: any) {
      toast.error("Failed to load applications");
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleStatusUpdate = async (
    applicationId: string,
    dancerId: string,
    status: 'approved' | 'rejected',
    dancerEmail: string,
    dancerName: string,
    eventName: string
  ) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", applicationId);

      if (error) throw error;

      // Get organizer info
      const { data: organizer } = await supabase
        .from("organizers")
        .select("name")
        .eq("id", organizerId)
        .single();

      // Send notification email
      await supabase.functions.invoke("send-application-notification", {
        body: {
          dancerEmail,
          dancerName,
          eventName,
          status,
          organizerName: organizer?.name || "Event Organizer"
        }
      });

      toast.success(`Application ${status}!`);
      
      // Refresh applications
      if (selectedEvent) {
        await fetchApplications(selectedEvent.id);
      }
    } catch (error: any) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application");
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Applicants for {selectedEvent?.name}</DialogTitle>
            <DialogDescription>
              Review complete dancer profiles and manage applications
            </DialogDescription>
          </DialogHeader>

          {loadingApplications ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications yet for this event
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((app) => (
                <Card key={app.id} className="p-6 border-2">
                  <div className="space-y-6">
                    {/* Header with Actions */}
                    <div className="flex items-start justify-between pb-4 border-b">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold">{app.dancer.name}</h3>
                          <Badge 
                            variant={
                              app.status === 'approved' ? 'default' : 
                              app.status === 'rejected' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Music2 className="w-3 h-3" />
                            {app.dancer.dance_style}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {app.dancer.gender}
                          </Badge>
                          {app.dancer.age && (
                            <Badge variant="outline">{app.dancer.age} years old</Badge>
                          )}
                        </div>
                      </div>
                      
                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(
                              app.id, 
                              app.dancer.id,
                              'approved', 
                              app.dancer.email, 
                              app.dancer.name, 
                              selectedEvent?.name || ''
                            )}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(
                              app.id,
                              app.dancer.id,
                              'rejected',
                              app.dancer.email,
                              app.dancer.name,
                              selectedEvent?.name || ''
                            )}
                            className="flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Personal Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="text-sm font-medium">{app.dancer.email}</p>
                      </div>
                      {app.dancer.height && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Ruler className="w-3 h-3" />
                            Height
                          </Label>
                          <p className="text-sm font-medium">{app.dancer.height}</p>
                        </div>
                      )}
                      {app.dancer.skin_tone && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Palette className="w-3 h-3" />
                            Skin Tone
                          </Label>
                          <p className="text-sm font-medium">{app.dancer.skin_tone}</p>
                        </div>
                      )}
                    </div>

                    {/* Experience Section */}
                    {app.dancer.experience && (
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Experience</Label>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                          {app.dancer.experience}
                        </p>
                      </div>
                    )}

                    {/* About Section */}
                    {app.dancer.about && (
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">About</Label>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                          {app.dancer.about}
                        </p>
                      </div>
                    )}

                    {/* Performance Video */}
                    {app.dancer.video_url && (
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Performance Video</Label>
                        <video
                          src={app.dancer.video_url}
                          controls
                          className="w-full rounded-lg shadow-lg"
                          style={{ maxHeight: '500px' }}
                        />
                      </div>
                    )}

                    {/* Certification */}
                    {app.dancer.certification_document_url && (
                      <div className="space-y-2">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Dance Certification
                        </Label>
                        <a
                          href={app.dancer.certification_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          View Certificate
                        </a>
                      </div>
                    )}

                    {/* Messages Section */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Communication
                      </Label>
                      <Messages
                        applicationId={app.id}
                        dancerId={app.dancer.id}
                        organizerId={organizerId}
                        dancerName={app.dancer.name}
                        organizerName="You"
                        eventName={selectedEvent?.name || ''}
                      />
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Applied on {new Date(app.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
