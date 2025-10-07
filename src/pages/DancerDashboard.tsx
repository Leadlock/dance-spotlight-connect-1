import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, User, Music, Calendar, FileText } from "lucide-react";
import { DancerProfile } from "@/components/DancerProfile";
import { EventsList } from "@/components/EventsList";
import { ApplicationStatus } from "@/components/ApplicationStatus";

const DancerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'applications'>('profile');

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

      if (role?.role !== "dancer") {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                DanceLink
              </h1>
              <p className="text-xs text-muted-foreground">Dancer Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'profile' ? "default" : "outline"}
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            My Profile
          </Button>
          <Button
            variant={activeTab === 'events' ? "default" : "outline"}
            onClick={() => setActiveTab('events')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Browse Events
          </Button>
          <Button
            variant={activeTab === 'applications' ? "default" : "outline"}
            onClick={() => setActiveTab('applications')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            My Applications
          </Button>
        </div>

        {activeTab === 'profile' && (
          <DancerProfile profile={profile} userId={user.id} />
        )}
        {activeTab === 'events' && (
          <EventsList dancerId={user.id} />
        )}
        {activeTab === 'applications' && (
          <ApplicationStatus dancerId={user.id} />
        )}
      </main>
    </div>
  );
};

export default DancerDashboard;
