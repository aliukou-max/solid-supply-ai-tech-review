-- Add part_name column to production_errors table
ALTER TABLE production_errors ADD COLUMN part_name TEXT;

-- Create index for better performance when filtering by part name
CREATE INDEX idx_production_errors_part_name ON production_errors(part_name);
