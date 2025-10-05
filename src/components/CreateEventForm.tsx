import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface CreateEventFormProps {
  organizerId: string;
  onSuccess: () => void;
}

const danceStyles = [
  "Hip Hop",
  "Contemporary",
  "Ballet",
  "Jazz",
  "Salsa",
  "Ballroom",
  "Breakdancing",
  "Tap",
  "Modern",
  "Latin",
  "All Styles"
];

const genderPreferences = ["Male", "Female", "Any", "Non-binary"];

export const CreateEventForm = ({ organizerId, onSuccess }: CreateEventFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [eventData, setEventData] = useState({
    name: "",
    dance_style: "",
    gender_preference: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("events").insert({
        name: eventData.name,
        dance_style: eventData.dance_style,
        gender_preference: eventData.gender_preference,
        organizer_id: organizerId,
      });

      if (error) throw error;

      toast.success("Event created successfully!");
      setEventData({ name: "", dance_style: "", gender_preference: "" });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-elegant)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Event
        </CardTitle>
        <CardDescription>Post a new dance event to discover talented dancers</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">Event Name</Label>
            <Input
              id="event-name"
              placeholder="e.g., Summer Dance Competition"
              value={eventData.name}
              onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-dance-style">Required Dance Style</Label>
            <Select
              value={eventData.dance_style}
              onValueChange={(value) => setEventData({ ...eventData, dance_style: value })}
              required
            >
              <SelectTrigger id="event-dance-style">
                <SelectValue placeholder="Select dance style" />
              </SelectTrigger>
              <SelectContent>
                {danceStyles.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-gender">Gender Preference</Label>
            <Select
              value={eventData.gender_preference}
              onValueChange={(value) => setEventData({ ...eventData, gender_preference: value })}
              required
            >
              <SelectTrigger id="event-gender">
                <SelectValue placeholder="Select gender preference" />
              </SelectTrigger>
              <SelectContent>
                {genderPreferences.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Create Event"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
