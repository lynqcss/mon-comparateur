-- À exécuter dans Supabase (Dashboard > SQL Editor > New query).
-- Demandes envoyées par le formulaire simplifié de /onboarding.
CREATE TABLE IF NOT EXISTS merchant_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  website text,
  gmc_id text NOT NULL,
  monthly_budget text,
  message text,
  status text DEFAULT 'new' NOT NULL
);

-- RLS activé SANS aucune règle : seule la clé de service (côté serveur) peut
-- lire ou écrire. Les coordonnées ne sont donc pas lisibles depuis un navigateur.
ALTER TABLE merchant_leads ENABLE ROW LEVEL SECURITY;
