ALTER TABLE nodes ADD COLUMN product_type TEXT;

CREATE INDEX idx_nodes_product_type ON nodes(product_type);
