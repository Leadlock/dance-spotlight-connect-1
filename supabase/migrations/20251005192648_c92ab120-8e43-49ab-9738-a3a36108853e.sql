-- Create storage bucket for dancer videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('dancer-videos', 'dancer-videos', true);

-- Create storage policies for dancer videos
CREATE POLICY "Anyone can view dancer videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'dancer-videos');

CREATE POLICY "Dancers can upload their own videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dancer-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Dancers can update their own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dancer-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Dancers can delete their own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'dancer-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);