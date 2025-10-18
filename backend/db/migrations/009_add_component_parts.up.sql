ALTER TABLE products ADD COLUMN product_type_id TEXT REFERENCES product_types(id);

CREATE TABLE component_parts (
  id BIGSERIAL PRIMARY KEY,
  tech_review_id BIGINT NOT NULL REFERENCES tech_reviews(id) ON DELETE CASCADE,
  product_type_part_id TEXT NOT NULL REFERENCES product_type_parts(id),
  part_name TEXT NOT NULL,
  
  photo_url TEXT,
  
  has_done BOOLEAN DEFAULT FALSE,
  has_node BOOLEAN DEFAULT FALSE,
  had_errors BOOLEAN DEFAULT FALSE,
  
  material TEXT,
  finish TEXT,
  notes TEXT,
  
  recommended_node_id TEXT,
  selected_node_id TEXT,
  drawing_code TEXT,
  
  technological_description TEXT,
  assembly_technology TEXT,
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE component_part_errors (
  id BIGSERIAL PRIMARY KEY,
  component_part_id BIGINT NOT NULL REFERENCES component_parts(id) ON DELETE CASCADE,
  production_error_id BIGINT NOT NULL REFERENCES production_errors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_component_parts_tech_review_id ON component_parts(tech_review_id);
CREATE INDEX idx_component_parts_product_type_part_id ON component_parts(product_type_part_id);
CREATE INDEX idx_component_part_errors_component_part_id ON component_part_errors(component_part_id);
