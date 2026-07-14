-- ============================================================================
-- Migration Content API v2.1 -> Merchant API v1  (Lynq)
-- A exécuter dans Supabase : Dashboard > SQL Editor > New query.
-- Idempotent : peut être relancé sans risque.
-- ============================================================================

-- 1) Colonne GTIN dédiée (comparaison multi-marchands du même produit).
ALTER TABLE products ADD COLUMN IF NOT EXISTS gtin text;
CREATE INDEX IF NOT EXISTS products_gtin_idx ON products (gtin);

-- 2) Marqueur "vu lors du dernier run" -> suppression des produits périmés.
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- 3) Pays au niveau du marchand (source de products.country_code).
--    On applique le pays du marchand à tous ses produits lors de la synchro.
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'FR';

-- 4) État de synchro par curseur, porté par le marchand (auto-enchaînement).
--    sync_state : 'idle' | 'running'
--    sync_cursor : pageToken Merchant API de la prochaine page à traiter (NULL = début)
--    sync_run_id : identifiant du cycle de synchro en cours (horodatage ISO)
--    sync_started_at : début du cycle courant
--    sync_page_count : nb de pages traitées sur le cycle courant
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS sync_state text NOT NULL DEFAULT 'idle';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS sync_cursor text;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS sync_run_id text;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS sync_started_at timestamptz;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS sync_page_count integer NOT NULL DEFAULT 0;

-- 5) Contrainte d'unicité (merchant_id, offer_id) : nécessaire pour l'UPSERT.
--    /!\ Si des doublons existent déjà, la création de l'index échouera.
--    Décommentez d'abord ce bloc pour supprimer les doublons (garde la ligne au plus grand id) :
--
--    DELETE FROM products a
--    USING products b
--    WHERE a.merchant_id = b.merchant_id
--      AND a.offer_id = b.offer_id
--      AND a.offer_id IS NOT NULL
--      AND a.id < b.id;
--
-- Index unique COMPLET (pas partiel) : requis pour que l'UPSERT supabase-js
-- (onConflict: 'merchant_id,offer_id') puisse l'utiliser comme cible de conflit.
-- Les produits Merchant API ont toujours un offerId ; les NULL éventuels
-- restent distincts en Postgres, donc aucune collision indésirable.
CREATE UNIQUE INDEX IF NOT EXISTS products_merchant_offer_uidx
  ON products (merchant_id, offer_id);

-- 6) (Optionnel, à lancer APRÈS validation de la nouvelle synchro)
--    On n'écrit plus raw_data (économie d'espace sur le plan gratuit 500 Mo).
--    Pour récupérer l'espace déjà consommé, supprimez la colonne :
--
--    ALTER TABLE products DROP COLUMN IF EXISTS raw_data;
