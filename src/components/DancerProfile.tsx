import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";

interface DancerProfileProps {
  profile: any;
  userId: string;
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
  "Other"
];

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];

export const DancerProfile = ({ profile: initialProfile, userId }: DancerProfileProps) => {
  const [profile, setProfile] = useState(initialProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  useEffect(() => {
    setProfile(initialProfile);
    if (initialProfile?.video_url) {
      setVideoPreview(initialProfile.video_url);
    }
  }, [initialProfile]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video file must be under 50MB");
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const uploadVideo = async () => {
    if (!videoFile) return null;

    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('dancer-videos')
      .upload(filePath, videoFile, {
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('dancer-videos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let videoUrl = profile.video_url;

      if (videoFile) {
        videoUrl = await uploadVideo();
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          dance_style: profile.dance_style,
          gender: profile.gender,
          video_url: videoUrl,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setVideoFile(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-elegant)]">
      <CardHeader>
        <CardTitle>Your Dancer Profile</CardTitle>
        <CardDescription>Update your information and showcase your talent</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile?.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dance-style">Dance Style</Label>
              <Select
                value={profile?.dance_style || ""}
                onValueChange={(value) => setProfile({ ...profile, dance_style: value })}
              >
                <SelectTrigger id="dance-style">
                  <SelectValue placeholder="Select your dance style" />
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
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={profile?.gender || ""}
                onValueChange={(value) => setProfile({ ...profile, gender: value })}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video">Performance Video</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="video"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                <label htmlFor="video" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload video (max 50MB)
                  </p>
                </label>
              </div>
            </div>

            {videoPreview && (
              <div className="rounded-lg overflow-hidden shadow-lg">
                <video
                  src={videoPreview}
                  controls
                  className="w-full h-auto"
                  style={{ maxHeight: "300px" }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
};
