import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music, Users, Calendar, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-6 shadow-[var(--shadow-glow)]">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            DanceLink
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            The professional network connecting dancers with event organizers. Showcase your talent, find opportunities, build your career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Get Started
              <Sparkles className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
          <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm hover:shadow-[var(--shadow-elegant)] transition-all">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">For Dancers</h3>
            <p className="text-muted-foreground">
              Create your portfolio, upload performance videos, and apply to exciting dance events
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm hover:shadow-[var(--shadow-elegant)] transition-all">
            <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">For Organizers</h3>
            <p className="text-muted-foreground">
              Post dance events, discover talented dancers, and review applications with video submissions
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm hover:shadow-[var(--shadow-elegant)] transition-all">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Music className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">All Dance Styles</h3>
            <p className="text-muted-foreground">
              From Hip Hop to Ballet, Contemporary to Ballroom - all dance styles are welcome
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
