-- Add drawing_files column to nodes table to store multiple PDF files as JSON array
ALTER TABLE nodes ADD COLUMN drawing_files JSONB DEFAULT '[]'::jsonb;

-- Create index for better performance when querying drawing files
CREATE INDEX idx_nodes_drawing_files ON nodes USING GIN (drawing_files);
