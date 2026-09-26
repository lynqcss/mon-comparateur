-- ============================================================================
-- Mise en pause des marchands de DÉMO (Lynq)
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query.
--
-- Contexte : 99 marchands en base, tous avec sync_paused = false, mais un seul
-- (headled) possède un gmc_id. Le cron quotidien lançait donc 99 invocations
-- serverless dont 98 vouées à l'échec — un des facteurs du dépassement des
-- quotas Vercel qui a mis le site hors ligne.
--
-- Cette opération est RÉVERSIBLE et NE SUPPRIME RIEN : les marchands de démo
-- et leurs produits restent affichés sur le site, ils sont simplement exclus
-- de la synchronisation automatique.
-- ============================================================================

-- Avant / après : contrôle du nombre de marchands concernés.
-- SELECT sync_paused, (gmc_id IS NULL) AS sans_gmc, count(*)
-- FROM merchants GROUP BY 1, 2 ORDER BY 1, 2;

UPDATE merchants
SET sync_paused = true
WHERE gmc_id IS NULL
  AND sync_paused = false;

-- Vérification : doit ne rester QUE les marchands ayant un gmc_id.
SELECT id, name, gmc_id, sync_paused
FROM merchants
WHERE sync_paused = false
ORDER BY id;

-- Pour annuler (si besoin) :
-- UPDATE merchants SET sync_paused = false WHERE gmc_id IS NULL;
