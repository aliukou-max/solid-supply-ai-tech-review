CREATE TABLE IF NOT EXISTS product_type_synonyms (
  synonym TEXT PRIMARY KEY,
  product_type_id TEXT NOT NULL REFERENCES product_types(id)
);

INSERT INTO product_type_synonyms (synonym, product_type_id) VALUES
('cabinet', 'Vitrina'),
('cupboard', 'Vitrina'),
('wardrobe', 'Vitrina'),
('locker', 'Vitrina'),
('storage', 'Vitrina'),
('workstation', 'Vitrina'),
('full wall', 'Vitrina'),
('showcase', 'Vitrina'),
('vitrinos', 'Vitrina'),
('spinta', 'Vitrina'),

('shelf', 'Lentyna'),
('shelving', 'Lentyna'),
('niche', 'Lentyna'),
('display', 'Lentyna'),
('lentyna', 'Lentyna'),

('banquette', 'Sofa'),
('bench', 'Sofa'),
('seating', 'Sofa'),
('sofa', 'Sofa'),

('table', 'Stalas'),
('desk', 'Stalas'),
('island', 'Stalas'),
('counter', 'Stalas'),
('stalas', 'Stalas'),

('panel', 'Backwall'),
('wall panel', 'Backwall'),
('back panel', 'Backwall'),
('backwall', 'Backwall'),
('back wall', 'Backwall'),

('frame', 'Rėmas'),
('structure', 'Rėmas'),
('support', 'Rėmas'),
('remas', 'Rėmas'),

('lightbox', 'Lightbox'),
('light box', 'Lightbox')
ON CONFLICT (synonym) DO NOTHING;
