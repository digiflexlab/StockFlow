
-- Créer une table pour les permissions granulaires
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  is_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission_type, permission_key)
);

-- Activer RLS pour les permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Politique pour que les admins puissent gérer toutes les permissions
CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour que les utilisateurs puissent voir leurs propres permissions
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Créer une table pour les configurations système
CREATE TABLE public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour la configuration système
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent gérer la configuration système
CREATE POLICY "Only admins can manage system config" ON public.system_config
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Insérer des configurations par défaut
INSERT INTO public.system_config (config_key, config_value, description) VALUES
('general_settings', '{"companyName": "StockFlow Pro", "defaultCurrency": "XOF", "language": "fr"}', 'Parametres generaux de application'),
('feature_flags', '{"enableSalesModule": true, "enableReturnsModule": true, "enableMultiStore": true, "allowProductDeletion": false}', 'Activation et desactivation des fonctionnalites'),
('notification_settings', '{"emailNotifications": true, "smsNotifications": false, "lowStockAlerts": true}', 'Parametres de notification'),
('security_settings', '{"requireProductDescription": false, "requireProductSKU": true, "requireSupplierInfo": false}', 'Parametres de securite et validation');
