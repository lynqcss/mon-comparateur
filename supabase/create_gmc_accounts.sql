-- À exécuter dans Supabase (Dashboard > SQL Editor > New query > Run).
-- Ticket 2 : comptes Merchant Center surveillés + journal des synchros.
-- Script sans risque pour les données existantes : il ne fait que créer
-- deux nouvelles tables (rien n'est vidé ni modifié ailleurs).

-- Comptes Merchant Center surveillés (périmètre des alertes et des fiches
-- clients). Une ligne n'est jamais supprimée : un compte qui n'est plus
-- visible passe inactif (active = false), ce qui reste réversible.
CREATE TABLE IF NOT EXISTS gmc_accounts (
  account_id text PRIMARY KEY,                       -- identifiant Merchant Center
  name text,
  website text,                                      -- homePageUri renvoyé par Google
  language_code text,
  account_type text NOT NULL DEFAULT 'unknown'
    CHECK (account_type IN ('standalone', 'subaccount', 'mca', 'unknown')),
  aggregator_id text,                                -- MCA parent d'un sous-compte
  css_provider_id text,                              -- CSS utilisé (service comparisonShopping)
  css_provider_name text,
  ads_customer_ids text[] NOT NULL DEFAULT '{}',     -- comptes Google Ads liés
  service_account text,                              -- compte de service qui voit ce GMC
  active boolean NOT NULL DEFAULT true,
  excluded boolean NOT NULL DEFAULT false,           -- exclusion (MCA, marketplace…)
  excluded_reason text,
  access_status text NOT NULL DEFAULT 'never'
    CHECK (access_status IN ('never', 'ok', 'denied')), -- posé par les relevés (ticket 5)
  access_checked_at timestamptz,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  deactivated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gmc_accounts_active_idx ON gmc_accounts (active, excluded);

-- Journal des synchros, pour l'écran de diagnostic : quel compte de service a
-- été appelé, ce que Google a répondu, ce qui a changé en base.
CREATE TABLE IF NOT EXISTS gmc_sync_runs (
  id bigserial PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  trigger text NOT NULL CHECK (trigger IN ('manual', 'schedule')),
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'ok', 'aborted', 'error')),
  calls jsonb NOT NULL DEFAULT '[]'::jsonb,          -- appels Google et leurs réponses
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,        -- ajoutés, réactivés, désactivés, modifiés
  error text
);

CREATE INDEX IF NOT EXISTS gmc_sync_runs_started_idx ON gmc_sync_runs (started_at DESC);

-- Verrou : une seule synchro « en cours » à la fois (deux clics ou le bouton
-- pendant la synchro planifiée → la seconde est refusée).
CREATE UNIQUE INDEX IF NOT EXISTS gmc_sync_runs_single_running_idx
  ON gmc_sync_runs ((true)) WHERE status = 'running';

-- RLS activé SANS aucune règle : seule la clé de service (côté serveur) peut
-- lire ou écrire. Rien n'est lisible depuis un navigateur avec la clé publique.
ALTER TABLE gmc_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmc_sync_runs ENABLE ROW LEVEL SECURITY;
