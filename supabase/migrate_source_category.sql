-- Import Awin : catégorie d'origine de chaque offre (Lynq)
-- Ajoute une colonne à la table des produits. Ne modifie aucune ligne.
-- Peut être relancé sans risque.
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_category text;

-- Contrôle : la colonne existe.
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'source_category';
