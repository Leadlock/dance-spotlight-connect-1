import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, Music, Plus, Calendar } from "lucide-react";
import { CreateEventForm } from "@/components/CreateEventForm";
import { OrganizerEventsList } from "@/components/OrganizerEventsList";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (role?.role !== "organizer") {
        navigate("/auth");
        return;
      }

      setUser(session.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Logged out successfully");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                DanceLink
              </h1>
              <p className="text-xs text-muted-foreground">Organizer Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">My Events</h2>
            <p className="text-muted-foreground">Create and manage your dance events</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2">
            {showCreateForm ? <Calendar className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? "View Events" : "Create Event"}
          </Button>
        </div>

        {showCreateForm ? (
          <CreateEventForm organizerId={user.id} onSuccess={() => setShowCreateForm(false)} />
        ) : (
          <OrganizerEventsList organizerId={user.id} />
        )}
      </main>
    </div>
  );
};

export default OrganizerDashboard;
