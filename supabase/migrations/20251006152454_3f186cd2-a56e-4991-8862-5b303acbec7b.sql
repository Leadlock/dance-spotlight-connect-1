-- Add status column to applications table
ALTER TABLE applications 
ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add index for better performance
CREATE INDEX idx_applications_status ON applications(status);

-- Add updated_at column to track when status changes
ALTER TABLE applications 
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Create trigger to update updated_at
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();