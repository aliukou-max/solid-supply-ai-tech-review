-- Nodes (mazgai) table
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  product_code TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  part_name TEXT NOT NULL,
  description TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_nodes_product_code ON nodes(product_code);
CREATE INDEX idx_nodes_brand_name ON nodes(brand_name);
CREATE INDEX idx_nodes_part_name ON nodes(part_name);
