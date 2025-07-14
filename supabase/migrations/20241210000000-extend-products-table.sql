-- Migration pour étendre la table products avec les nouveaux champs
-- Date: 2024-12-10
-- Description: Ajout des champs manquants pour le scénario "Huile palmiste"

-- Créer la table units si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.units (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer des unités de base
INSERT INTO public.units (name, symbol, description) VALUES
('Pièce', 'pcs', 'Unité par pièce'),
('Bidon de 25L', '25L', 'Bidon de 25 litres'),
('Kilogramme', 'kg', 'Unité en kilogrammes'),
('Litre', 'L', 'Unité en litres'),
('Mètre', 'm', 'Unité en mètres'),
('Carton', 'ctn', 'Unité par carton')
ON CONFLICT (name) DO NOTHING;

-- Ajouter les nouveaux champs à la table products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES public.units(id),
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 18.00,
ADD COLUMN IF NOT EXISTS min_stock_threshold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS store_ids INTEGER[] DEFAULT '{}';

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON public.products(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_store_ids ON public.products USING GIN(store_ids);

-- Mettre à jour les produits existants avec des valeurs par défaut
UPDATE public.products 
SET 
  unit_id = (SELECT id FROM public.units WHERE name = 'Pièce' LIMIT 1),
  tax_rate = 18.00,
  min_stock_threshold = 0,
  store_ids = '{}'
WHERE unit_id IS NULL;

-- Ajouter des contraintes pour la validation
ALTER TABLE public.products 
ADD CONSTRAINT check_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100),
ADD CONSTRAINT check_min_stock_threshold CHECK (min_stock_threshold >= 0);

-- Commentaires pour la documentation
COMMENT ON COLUMN public.products.barcode IS 'Code barre du produit (EAN-13, UPC, etc.)';
COMMENT ON COLUMN public.products.unit_id IS 'Unité de vente du produit (pièce, kg, litre, etc.)';
COMMENT ON COLUMN public.products.tax_rate IS 'Taux de taxe en pourcentage (0-100)';
COMMENT ON COLUMN public.products.min_stock_threshold IS 'Seuil d''alerte de stock minimum';
COMMENT ON COLUMN public.products.store_ids IS 'Liste des magasins où le produit est disponible'; 