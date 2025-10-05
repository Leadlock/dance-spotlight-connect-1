import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Calendar, Music2, Users, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  name: string;
  dance_style: string;
  gender_preference: string;
  created_at: string;
}

interface EventsListProps {
  dancerId: string;
}

export const EventsList = ({ dancerId }: EventsListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [appliedEvents, setAppliedEvents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchAppliedEvents();
  }, [dancerId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppliedEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("event_id")
        .eq("dancer_id", dancerId);

      if (error) throw error;
      setAppliedEvents(new Set(data?.map((app) => app.event_id) || []));
    } catch (error: any) {
      console.error("Failed to load applications:", error);
    }
  };

  const handleApply = (event: Event) => {
    setSelectedEvent(event);
    setShowConfirmDialog(true);
  };

  const confirmApply = async () => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from("applications")
        .insert({
          event_id: selectedEvent.id,
          dancer_id: dancerId,
        });

      if (error) throw error;

      setAppliedEvents(new Set([...appliedEvents, selectedEvent.id]));
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to apply");
    } finally {
      setShowConfirmDialog(false);
      setSelectedEvent(null);
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
          <p className="text-muted-foreground">No events available at the moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const hasApplied = appliedEvents.has(event.id);
          return (
            <Card key={event.id} className="overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all">
              <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Music2 className="w-5 h-5 text-primary" />
                      {event.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {new Date(event.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {hasApplied && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Applied
                    </Badge>
                  )}
                </div>
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
                <Button
                  onClick={() => handleApply(event)}
                  disabled={hasApplied}
                  className="w-full mt-4"
                  variant={hasApplied ? "outline" : "default"}
                >
                  {hasApplied ? "Already Applied" : "Apply Now"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to apply for <strong>{selectedEvent?.name}</strong>?
              This will submit your profile and performance video to the organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApply}>Apply</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
