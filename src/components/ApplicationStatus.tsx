import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Music2, Clock, CheckCircle2, XCircle, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Messages } from "@/components/Messages";

interface Application {
  id: string;
  event_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  event: {
    id: string;
    name: string;
    dance_style: string;
    gender_preference: string;
    organizer: {
      name: string;
      email: string;
    };
  };
}

interface ApplicationStatusProps {
  dancerId: string;
}

export const ApplicationStatus = ({ dancerId }: ApplicationStatusProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [dancerId]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          event:events(
            *,
            organizer:organizers(*)
          )
        `)
        .eq("dancer_id", dancerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
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

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No applications submitted yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Apply to events to see your application status here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Applications</h2>
        <Badge variant="outline" className="text-sm">
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {applications.map((application) => (
        <Card key={application.id} className="overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Music2 className="w-5 h-5 text-primary" />
                  {application.event.name}
                </CardTitle>
                <CardDescription className="mt-2">
                  Applied on {new Date(application.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(application.status)} flex items-center gap-1`}>
                  {getStatusIcon(application.status)}
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Music2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{application.event.dance_style}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Organizer: {application.event.organizer.name}</span>
            </div>
            
            {application.status !== 'pending' && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Status updated on {new Date(application.updated_at).toLocaleDateString()}
                </p>
                {application.status === 'approved' && (
                  <p className="text-sm text-green-700 mt-1">
                    🎉 Congratulations! You've been selected for this event.
                  </p>
                )}
                {application.status === 'rejected' && (
                  <p className="text-sm text-red-700 mt-1">
                    Unfortunately, your application wasn't selected this time.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Contact Organizer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Messages</DialogTitle>
                    <DialogDescription>
                      Communicate with {application.event.organizer.name} about your application for {application.event.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <Messages
                    applicationId={application.id}
                    dancerId={dancerId}
                    organizerId={application.event.organizer.id}
                    dancerName="You" // This should be the dancer's name
                    organizerName={application.event.organizer.name}
                    eventName={application.event.name}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
