CREATE TABLE product_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_type_parts (
  id TEXT PRIMARY KEY,
  product_type_id TEXT NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_type_parts_product_type_id ON product_type_parts(product_type_id);
