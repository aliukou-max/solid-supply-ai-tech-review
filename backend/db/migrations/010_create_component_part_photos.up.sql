CREATE TABLE component_part_photos (
  id SERIAL PRIMARY KEY,
  component_part_id INTEGER NOT NULL REFERENCES component_parts(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_component_part_photos_part_id ON component_part_photos(component_part_id);
CREATE INDEX idx_component_part_photos_display_order ON component_part_photos(component_part_id, display_order);
