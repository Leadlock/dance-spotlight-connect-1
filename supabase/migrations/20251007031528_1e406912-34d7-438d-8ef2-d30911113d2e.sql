-- Add new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN age integer,
ADD COLUMN height text,
ADD COLUMN skin_tone text,
ADD COLUMN experience text,
ADD COLUMN about text,
ADD COLUMN certification_document_url text;

-- Update RLS policy to allow organizers to update application status
CREATE POLICY "Organizers can update application status"
ON applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = applications.event_id 
    AND e.organizer_id = auth.uid()
  )
);

-- Create storage bucket for certification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certifications', 'certifications', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for certifications
CREATE POLICY "Dancers can upload own certifications"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Dancers can update own certifications"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view certifications"
ON storage.objects
FOR SELECT
USING (bucket_id = 'certifications');