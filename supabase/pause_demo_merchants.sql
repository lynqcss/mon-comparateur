-- ============================================================================
-- Mise en pause des marchands de DÉMONSTRATION (Lynq)
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query.
--
-- ⚠️ OPÉRATION PONCTUELLE — NE PAS REJOUER À L'AVEUGLE.
-- Elle ne pose aucune règle permanente : c'est un UPDATE unique qui n'affecte
-- que les lignes existant au moment où il tourne. Le rejouer plus tard
-- risquerait de mettre en pause un vrai marchand créé mais pas encore relié à
-- son compte Merchant Center.
--
-- CONTEXTE : 99 marchands en base, tous avec sync_paused = false, mais un seul
-- (headled) possède un gmc_id. Le cron quotidien lançait donc 99 invocations
-- serverless dont 98 vouées à l'échec — l'appel partait sur
-- /accounts/null/products et échouait systématiquement. C'était un des
-- facteurs du dépassement des quotas Vercel.
--
-- CE QUE ÇA NE FAIT PAS : rien n'est supprimé. Les marchands de démonstration
-- et leurs ~1000 produits restent affichés sur le site. La synchronisation ne
-- fait que RAFRAÎCHIR les produits depuis Google ; ces marchands n'ayant
-- aucune source Google, il n'y a rien à rafraîchir.
--
-- POURQUOI AUCUN RISQUE POUR LES VRAIS MARCHANDS : l'onboarding renseigne
-- toujours gmc_id. Un marchand réel ne peut donc pas être attrapé par la
-- condition ci-dessous, ni maintenant ni plus tard.
--
-- Un garde-fou équivalent existe déjà dans le code (app/api/cron/sync-all :
-- .not('gmc_id', 'is', null)). Ce script est de la redondance volontaire, qui
-- couvre aussi les déclenchements manuels depuis l'admin.
-- ============================================================================

UPDATE merchants
SET sync_paused = true,
    -- Rend la mise en pause auto-explicative dans l'admin (champ non public),
    -- et indique comment la lever. Non écrasé tant que le marchand est en
    -- pause, puisque la synchro ne tourne jamais pour lui.
    last_import_message = 'Marchand de démonstration : exclu de la synchronisation automatique, aucun compte Merchant Center rattaché. Pour l''activer : renseigner gmc_id, puis passer sync_paused a false.'
WHERE gmc_id IS NULL
  AND sync_paused = false;

-- Vérification : ne doivent rester actifs QUE les marchands ayant un gmc_id.
SELECT id, name, gmc_id, sync_paused
FROM merchants
WHERE sync_paused = false
ORDER BY id;

-- Pour réactiver un marchand précis (une fois son gmc_id renseigné) :
-- UPDATE merchants
-- SET sync_paused = false, last_import_message = NULL
-- WHERE id = <id>;
