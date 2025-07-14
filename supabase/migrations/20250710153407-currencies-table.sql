-- Migration pour créer la table currencies
-- Date: 2025-07-10

-- Créer la table currencies
CREATE TABLE IF NOT EXISTS public.currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    rate DECIMAL(15, 8) NOT NULL DEFAULT 1.0,
    is_base BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur le code pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_currencies_code ON public.currencies(code);

-- Créer un index sur is_base pour filtrer rapidement la devise de base
CREATE INDEX IF NOT EXISTS idx_currencies_is_base ON public.currencies(is_base);

-- Créer un index sur is_active pour filtrer les devises actives
CREATE INDEX IF NOT EXISTS idx_currencies_is_active ON public.currencies(is_active);

-- Ajouter des contraintes
ALTER TABLE public.currencies 
ADD CONSTRAINT currencies_code_length CHECK (LENGTH(code) = 3),
ADD CONSTRAINT currencies_rate_positive CHECK (rate > 0),
ADD CONSTRAINT currencies_unique_base CHECK (
    (is_base = true AND id = (SELECT MIN(id) FROM public.currencies WHERE is_base = true)) OR 
    is_base = false
);

-- Insérer les devises par défaut
INSERT INTO public.currencies (code, name, symbol, rate, is_base, is_active, last_updated) VALUES
('XOF', 'Franc CFA (BCEAO)', 'CFA', 1.0, true, true, NOW()),
('EUR', 'Euro', '€', 0.00152, false, true, NOW()),
('USD', 'Dollar Américain', '$', 0.00165, false, true, NOW()),
('GBP', 'Livre Sterling', '£', 0.00132, false, true, NOW()),
('JPY', 'Yen Japonais', '¥', 0.25, false, true, NOW()),
('CHF', 'Franc Suisse', 'CHF', 0.00135, false, true, NOW()),
('CAD', 'Dollar Canadien', 'C$', 0.00225, false, true, NOW()),
('AUD', 'Dollar Australien', 'A$', 0.00245, false, true, NOW()),
('CNY', 'Yuan Chinois', '¥', 0.012, false, true, NOW()),
('NGN', 'Naira Nigérian', '₦', 2.5, false, true, NOW());

-- Créer une fonction pour mettre à jour automatiquement last_updated
CREATE OR REPLACE FUNCTION update_currency_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour mettre à jour automatiquement last_updated
CREATE TRIGGER trigger_update_currency_last_updated
    BEFORE UPDATE ON public.currencies
    FOR EACH ROW
    EXECUTE FUNCTION update_currency_last_updated();

-- Ajouter les permissions RLS (Row Level Security)
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to read currencies" ON public.currencies
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre la modification aux admins et managers
CREATE POLICY "Allow admins and managers to modify currencies" ON public.currencies
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND (profiles.role = 'admin' OR profiles.role = 'manager')
            )
        )
    );

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE public.currencies IS 'Table des devises supportées par le système';
COMMENT ON COLUMN public.currencies.id IS 'Identifiant unique de la devise';
COMMENT ON COLUMN public.currencies.code IS 'Code ISO 4217 de la devise (3 caractères)';
COMMENT ON COLUMN public.currencies.name IS 'Nom complet de la devise';
COMMENT ON COLUMN public.currencies.symbol IS 'Symbole de la devise';
COMMENT ON COLUMN public.currencies.rate IS 'Taux de change par rapport à la devise de base';
COMMENT ON COLUMN public.currencies.is_base IS 'Indique si c''est la devise de base du système';
COMMENT ON COLUMN public.currencies.is_active IS 'Indique si la devise est active';
COMMENT ON COLUMN public.currencies.last_updated IS 'Date de dernière mise à jour du taux';
COMMENT ON COLUMN public.currencies.created_at IS 'Date de création de l''enregistrement'; 