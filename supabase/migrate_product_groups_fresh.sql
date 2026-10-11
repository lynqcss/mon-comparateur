-- ============================================================================
-- Comparaison multi-marchands : ajout de la colonne `is_fresh` à product_groups
-- (Lynq). Un groupe est « frais » si au moins une de ses offres a été vue dans
-- un catalogue marchand au cours des 3 derniers jours. La liste des produits
-- affiche ces groupes en premier.
--
-- Une vue matérialisée ne peut pas recevoir de colonne : on la recrée. Le tout
-- est dans une transaction, donc le site ne voit jamais la vue absente.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query.
-- Idempotent : peut être relancé sans risque. Ne touche à aucun produit.
-- ============================================================================

BEGIN;

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
        m.website_url AS merchant_domain,
        -- Offre vue récemment dans le catalogue du marchand (synchro GMC ou
        -- import Awin). Les fiches jamais resynchronisées valent FALSE.
        COALESCE(p.last_seen_at >= now() - interval '3 days', false) AS seen_recently
    FROM products p
    JOIN merchants m ON m.id = p.merchant_id
),
agg AS (
    SELECT
        group_key,
        MIN(total_price) AS min_price,
        MAX(total_price) AS max_price,
        COUNT(DISTINCT merchant_domain) AS merchant_count,
        BOOL_OR(seen_recently) AS is_fresh
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
    agg.merchant_count,
    agg.is_fresh
FROM rep
JOIN agg USING (group_key);

-- Index UNIQUE (obligatoire pour REFRESH MATERIALIZED VIEW CONCURRENTLY).
CREATE UNIQUE INDEX product_groups_group_key_uidx ON product_groups (group_key);

-- Index de filtrage / tri.
CREATE INDEX product_groups_country_idx ON product_groups (country_code);
CREATE INDEX product_groups_country_cat_idx ON product_groups (country_code, google_product_category_id);
CREATE INDEX product_groups_country_price_idx ON product_groups (country_code, min_price);
CREATE INDEX product_groups_route_key_idx ON product_groups (route_key);
CREATE INDEX product_groups_brand_idx ON product_groups (brand);

-- Accès lecture (PostgREST / clés Supabase).
GRANT SELECT ON product_groups TO anon, authenticated, service_role;

COMMIT;

-- PostgREST garde le schéma en mémoire : on lui demande de le relire.
NOTIFY pgrst, 'reload schema';

-- Contrôle : groupes frais et non frais, par pays.
SELECT country_code, is_fresh, COUNT(*) AS groupes
FROM product_groups
GROUP BY country_code, is_fresh
ORDER BY country_code, is_fresh DESC;
