import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Upload, FileText } from "lucide-react";

interface DancerProfileProps {
  profile: {
    name: string;
    email: string;
    dance_style: string;
    gender: string;
    age?: number;
    height?: string;
    skin_tone?: string;
    experience?: string;
    about?: string;
    video_url?: string;
    certification_document_url?: string;
  };
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

const heightOptions = [
  "Under 5'0\"", "5'0\" - 5'2\"", "5'3\" - 5'5\"", "5'6\" - 5'8\"",
  "5'9\" - 5'11\"", "6'0\" - 6'2\"", "Over 6'2\""
];

const skinToneOptions = ["Fair", "Light", "Medium", "Tan", "Brown", "Dark"];

export const DancerProfile = ({ profile: initialProfile, userId }: DancerProfileProps) => {
  const [profile, setProfile] = useState(initialProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);

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

  const uploadCertification = async () => {
    if (!certFile) return null;

    const fileExt = certFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('certifications')
      .upload(filePath, certFile, {
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('certifications')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let videoUrl = profile.video_url;
      let certUrl = profile.certification_document_url;

      if (videoFile) {
        videoUrl = await uploadVideo();
      }

      if (certFile) {
        certUrl = await uploadCertification();
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          dance_style: profile.dance_style,
          gender: profile.gender,
          age: profile.age,
          height: profile.height,
          skin_tone: profile.skin_tone,
          experience: profile.experience,
          about: profile.about,
          video_url: videoUrl,
          certification_document_url: certUrl,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setVideoFile(null);
      setCertFile(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-elegant)] max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Your Dancer Profile</CardTitle>
        <CardDescription>Complete your profile to stand out to event organizers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
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
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={profile?.age || ''}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
              placeholder="Enter your age"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <Select
              value={profile?.height || ''}
              onValueChange={(value) => setProfile({ ...profile, height: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select height" />
              </SelectTrigger>
              <SelectContent>
                {heightOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skin_tone">Skin Tone</Label>
            <Select
              value={profile?.skin_tone || ''}
              onValueChange={(value) => setProfile({ ...profile, skin_tone: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select skin tone" />
              </SelectTrigger>
              <SelectContent>
                {skinToneOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dance_style">Dance Style *</Label>
            <Select
              value={profile?.dance_style || ""}
              onValueChange={(value) => setProfile({ ...profile, dance_style: value })}
            >
              <SelectTrigger id="dance_style">
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
            <Label htmlFor="gender">Gender *</Label>
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

        <div className="space-y-2">
          <Label htmlFor="experience">Dance Experience</Label>
          <Textarea
            id="experience"
            value={profile?.experience || ''}
            onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
            placeholder="Describe your dance experience, achievements, performances, training..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="about">About You</Label>
          <Textarea
            id="about"
            value={profile?.about || ''}
            onChange={(e) => setProfile({ ...profile, about: e.target.value })}
            placeholder="Tell us about yourself, your passion for dance, goals..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Performance Video *</Label>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => document.getElementById('video-upload')?.click()}
          >
            {videoPreview ? (
              <div className="space-y-2">
                <video src={videoPreview} controls className="max-w-full h-64 mx-auto rounded" />
                <p className="text-sm text-muted-foreground">Click to change video</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload your best performance video
                </p>
                <p className="text-xs text-muted-foreground">Max size: 50MB</p>
              </div>
            )}
          </div>
          <Input
            id="video-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Dance Course Certification (Optional)</Label>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => document.getElementById('cert-upload')?.click()}
          >
            {profile.certification_document_url || certFile ? (
              <div className="space-y-2">
                <FileText className="w-8 h-8 mx-auto text-primary" />
                <p className="text-sm font-medium">
                  {certFile ? certFile.name : 'Certification uploaded'}
                </p>
                {profile.certification_document_url && !certFile && (
                  <a 
                    href={profile.certification_document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View current certificate
                  </a>
                )}
                <p className="text-xs text-muted-foreground">Click to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upload your dance certification document
                </p>
                <p className="text-xs text-muted-foreground">PDF, JPG, or PNG (max 10MB)</p>
              </div>
            )}
          </div>
          <Input
            id="cert-upload"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 10 * 1024 * 1024) {
                  toast.error("File size must be less than 10MB");
                  return;
                }
                setCertFile(file);
              }
            }}
          />
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
};
