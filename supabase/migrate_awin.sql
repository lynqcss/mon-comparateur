-- ============================================================================
-- Import des catalogues Awin (Lynq)
-- Ajoute à `merchants` de quoi distinguer l'origine d'un marchand et retrouver
-- son annonceur Awin. Ne touche à aucun produit.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query.
-- Idempotent : peut être relancé sans risque.
-- ============================================================================

-- 1) Origine du marchand.
--      'gmc'  : alimenté par son compte Google Merchant Center (synchro quotidienne)
--      'awin' : alimenté par son catalogue Awin (scripts/awin-import.mjs)
--      'demo' : données de démonstration, jamais mises à jour
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'gmc';

-- Les marchands existants sans compte Merchant Center sont les données de démo.
UPDATE merchants SET source = 'demo' WHERE gmc_id IS NULL AND source = 'gmc';

-- 2) Identifiant de l'annonceur chez Awin : clé de rapprochement de l'import.
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS awin_advertiser_id bigint;

-- Index unique COMPLET (pas partiel) : requis pour l'UPSERT par
-- `on_conflict=awin_advertiser_id`. Les NULL restent autorisés en nombre
-- illimité (marchands gmc et demo).
CREATE UNIQUE INDEX IF NOT EXISTS merchants_awin_advertiser_uidx
    ON merchants (awin_advertiser_id);

-- 3) Contrôle : répartition des marchands par origine.
SELECT source, COUNT(*) AS marchands FROM merchants GROUP BY source ORDER BY source;
