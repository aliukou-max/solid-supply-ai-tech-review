CREATE TABLE component_photos (
  id SERIAL PRIMARY KEY,
  component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_component_photos_component_id ON component_photos(component_id);
CREATE INDEX idx_component_photos_display_order ON component_photos(component_id, display_order);
