CREATE TABLE IF NOT EXISTS product_type_synonyms (
  synonym TEXT PRIMARY KEY,
  product_type_id TEXT NOT NULL REFERENCES product_types(id)
);

INSERT INTO product_type_synonyms (synonym, product_type_id) VALUES
('cabinet', 'Cabinet'),
('cupboard', 'Cabinet'),
('wardrobe', 'Wardrobe'),
('locker', 'Storage Unit'),
('storage', 'Storage Unit'),
('workstation', 'Cabinet'),
('full wall', 'Wardrobe Big'),
('showcase', 'Display Unit'),
('vitrinos', 'Display Unit'),
('vitrina', 'Display Unit'),
('spinta', 'Cabinet'),

('shelf', 'Display Unit'),
('shelving', 'Storage Unit'),
('niche', 'Display Unit'),
('display', 'Display Unit'),
('lentyna', 'Storage Unit'),

('banquette', 'Bench'),
('bench', 'Bench'),
('seating', 'Bench'),
('sofa', 'Bench'),

('table', 'Table'),
('desk', 'Reception Desk'),
('island', 'Island'),
('counter', 'Display Counter'),
('stalas', 'Table'),

('panel', 'Wall Panel'),
('wall panel', 'Wall Panel'),
('back panel', 'Backwall'),
('backwall', 'Backwall'),
('back wall', 'Backwall'),

('frame', 'Decor Frame'),
('structure', 'Decor Frame'),
('support', 'Decor Frame'),
('remas', 'Decor Frame'),

('lightbox', 'Lightbox'),
('light box', 'Lightbox'),

('bar', 'Bar'),
('kitchen', 'Kitchen'),
('sideboard', 'Sideboard'),
('mirror', 'Mirror'),
('podium', 'Display Podium'),
('canopy', 'Canopy'),
('flooring', 'Flooring'),
('ceiling', 'Ceiling Panel'),
('partition', 'Partition Wall'),
('drawer', 'Drawer Cabinet'),
('pouf', 'Pouf')

ON CONFLICT (synonym) DO NOTHING;
