-- ============================================================================
-- Comparaison multi-marchands par GTIN (Lynq)
-- Vue matérialisée product_groups : 1 ligne par (gtin + country_code),
-- + singletons (clé id-<id>) pour les produits sans GTIN.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query.
-- Idempotent (DROP + CREATE).
-- ============================================================================

-- Index de regroupement sur la table source.
CREATE INDEX IF NOT EXISTS products_gtin_country_idx ON products (gtin, country_code);

DROP MATERIALIZED VIEW IF EXISTS product_groups;

CREATE MATERIALIZED VIEW product_groups AS
WITH offers AS (
    SELECT
        -- Clé de groupe UNIQUE (inclut le pays) -> requise pour REFRESH CONCURRENTLY.
        CASE
            WHEN NULLIF(p.gtin, '') IS NOT NULL
                THEN 'gtin:' || p.gtin || ':' || p.country_code
            ELSE 'id:' || p.id::text
        END AS group_key,
        -- Clé d'URL de la fiche : le gtin, ou 'id-<id>' pour les singletons.
        CASE
            WHEN NULLIF(p.gtin, '') IS NOT NULL THEN p.gtin
            ELSE 'id-' || p.id::text
        END AS route_key,
        NULLIF(p.gtin, '') AS gtin,
        p.country_code,
        p.id,
        p.title,
        p.image_link,
        p.brand,
        p.price_currency,
        p.google_product_category_id,
        -- Prix TOTAL = prix + frais de port (base de comparaison).
        (COALESCE(p.price_value, 0) + COALESCE(p.shipping_price, 0)) AS total_price,
        m.website_url AS merchant_domain
    FROM products p
    JOIN merchants m ON m.id = p.merchant_id
),
agg AS (
    SELECT
        group_key,
        MIN(total_price) AS min_price,
        MAX(total_price) AS max_price,
        COUNT(DISTINCT merchant_domain) AS merchant_count
    FROM offers
    GROUP BY group_key
),
rep AS (
    -- Champs représentatifs = ceux de l'offre la MOINS chère du groupe.
    SELECT DISTINCT ON (group_key)
        group_key, route_key, gtin, country_code,
        title, image_link, brand, price_currency, google_product_category_id
    FROM offers
    ORDER BY group_key, total_price ASC NULLS LAST, id ASC
)
SELECT
    rep.group_key,
    rep.route_key,
    rep.gtin,
    rep.country_code,
    rep.title,
    rep.image_link,
    rep.brand,
    rep.price_currency,
    rep.google_product_category_id,
    agg.min_price,
    agg.max_price,
    agg.merchant_count
FROM rep
JOIN agg USING (group_key);

-- Index UNIQUE (obligatoire pour REFRESH MATERIALIZED VIEW CONCURRENTLY).
CREATE UNIQUE INDEX IF NOT EXISTS product_groups_group_key_uidx
    ON product_groups (group_key);

-- Index de filtrage / tri (appliqués côté SQL sur la vue).
CREATE INDEX IF NOT EXISTS product_groups_country_idx
    ON product_groups (country_code);
CREATE INDEX IF NOT EXISTS product_groups_country_cat_idx
    ON product_groups (country_code, google_product_category_id);
CREATE INDEX IF NOT EXISTS product_groups_country_price_idx
    ON product_groups (country_code, min_price);
CREATE INDEX IF NOT EXISTS product_groups_route_key_idx
    ON product_groups (route_key);
CREATE INDEX IF NOT EXISTS product_groups_brand_idx
    ON product_groups (brand);

-- Accès lecture (PostgREST / clés Supabase).
GRANT SELECT ON product_groups TO anon, authenticated, service_role;

-- Fonction de rafraîchissement, appelée par l'app via supabase.rpc('refresh_product_groups')
-- après chaque cycle de synchro (et par le cron quotidien).
CREATE OR REPLACE FUNCTION refresh_product_groups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_groups;
EXCEPTION WHEN OTHERS THEN
    -- Repli si CONCURRENTLY impossible (ex. vue jamais peuplée).
    REFRESH MATERIALIZED VIEW product_groups;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_product_groups() TO anon, authenticated, service_role;
