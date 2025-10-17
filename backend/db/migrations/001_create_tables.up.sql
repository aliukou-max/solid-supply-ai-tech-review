-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ss_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  dimensions TEXT,
  has_drawing BOOLEAN NOT NULL DEFAULT FALSE,
  drawing_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tech review cards table
CREATE TABLE tech_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Components/Parts table
CREATE TABLE components (
  id BIGSERIAL PRIMARY KEY,
  tech_review_id BIGINT NOT NULL REFERENCES tech_reviews(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  material TEXT,
  finish TEXT,
  color TEXT,
  grain_direction TEXT,
  technical_notes TEXT,
  assembly_notes TEXT,
  node_id TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lessons learnt table
CREATE TABLE lessons_learnt (
  id BIGSERIAL PRIMARY KEY,
  product_type TEXT NOT NULL,
  error_description TEXT NOT NULL,
  solution TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  severity TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Errors and issues table
CREATE TABLE errors (
  id BIGSERIAL PRIMARY KEY,
  tech_review_id BIGINT NOT NULL REFERENCES tech_reviews(id) ON DELETE CASCADE,
  component_id BIGINT REFERENCES components(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  solution TEXT,
  lesson_learnt_id BIGINT REFERENCES lessons_learnt(id),
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- AI suggestions table
CREATE TABLE ai_suggestions (
  id BIGSERIAL PRIMARY KEY,
  tech_review_id BIGINT NOT NULL REFERENCES tech_reviews(id) ON DELETE CASCADE,
  error_id BIGINT REFERENCES errors(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  confidence DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_project_id ON products(project_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_components_tech_review_id ON components(tech_review_id);
CREATE INDEX idx_lessons_learnt_product_type ON lessons_learnt(product_type);
CREATE INDEX idx_errors_tech_review_id ON errors(tech_review_id);
CREATE INDEX idx_ai_suggestions_tech_review_id ON ai_suggestions(tech_review_id);
