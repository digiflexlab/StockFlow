
-- Insérer 5 utilisateurs avec des profils complets
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_user_meta_data
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'admin@stockflow.com',
  crypt('StockFlow2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Marie Dupont"}'::jsonb
),
(
  '22222222-2222-2222-2222-222222222222',
  'manager@stockflow.com',
  crypt('Manager2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Pierre Martin"}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333333',
  'seller1@stockflow.com',
  crypt('Seller2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Sophie Dubois"}'::jsonb
),
(
  '44444444-4444-4444-4444-444444444444',
  'seller2@stockflow.com',
  crypt('Seller2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Jean Leroy"}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555555',
  'seller3@stockflow.com',
  crypt('Seller2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Claire Bernard"}'::jsonb
);

-- Insérer les profils correspondants
INSERT INTO public.profiles (id, email, name, role, store_ids, permissions) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'admin@stockflow.com',
  'Marie Dupont',
  'admin',
  '{1,2,3}',
  '{"all"}'
),
(
  '22222222-2222-2222-2222-222222222222',
  'manager@stockflow.com',
  'Pierre Martin',
  'manager',
  '{1,2}',
  '{"products", "suppliers", "inventory"}'
),
(
  '33333333-3333-3333-3333-333333333333',
  'seller1@stockflow.com',
  'Sophie Dubois',
  'seller',
  '{1}',
  '{"sales"}'
),
(
  '44444444-4444-4444-4444-444444444444',
  'seller2@stockflow.com',
  'Jean Leroy',
  'seller',
  '{2}',
  '{"sales"}'
),
(
  '55555555-5555-5555-5555-555555555555',
  'seller3@stockflow.com',
  'Claire Bernard',
  'seller',
  '{3}',
  '{"sales"}'
);

-- Créer des magasins
INSERT INTO public.stores (id, name, address, phone, email, manager_id) VALUES
(1, 'StockFlow Paris Centre', '123 Rue de Rivoli, 75001 Paris', '01.42.36.78.90', 'paris@stockflow.com', '22222222-2222-2222-2222-222222222222'),
(2, 'StockFlow Lyon Bellecour', '45 Place Bellecour, 69002 Lyon', '04.78.37.89.01', 'lyon@stockflow.com', '22222222-2222-2222-2222-222222222222'),
(3, 'StockFlow Marseille Vieux Port', '78 Quai du Port, 13002 Marseille', '04.91.54.32.10', 'marseille@stockflow.com', '11111111-1111-1111-1111-111111111111');

-- Créer des catégories
INSERT INTO public.categories (id, name, description) VALUES
(1, 'Électronique', 'Appareils électroniques et accessoires'),
(2, 'Vêtements', 'Vêtements et accessoires de mode'),
(3, 'Maison & Jardin', 'Articles pour la maison et le jardin'),
(4, 'Sports & Loisirs', 'Équipements sportifs et de loisirs'),
(5, 'Alimentation', 'Produits alimentaires et boissons');

-- Créer des fournisseurs
INSERT INTO public.suppliers (id, name, contact_person, email, phone, address) VALUES
(1, 'TechDistrib France', 'Marc Techno', 'contact@techdistrib.fr', '01.45.67.89.12', '12 Avenue de la Technologie, 92100 Boulogne'),
(2, 'Mode & Style SARL', 'Julie Fashion', 'commandes@modestyle.fr', '04.72.33.44.55', '88 Rue de la Mode, 69003 Lyon'),
(3, 'GreenHome Distribution', 'Paul Vert', 'info@greenhome.fr', '04.88.21.33.44', '34 Boulevard Écologique, 13008 Marseille'),
(4, 'SportMax Pro', 'Laura Sport', 'pro@sportmax.fr', '01.77.88.99.00', '56 Rue du Sport, 75015 Paris'),
(5, 'AlimFresh Wholesale', 'David Fresh', 'wholesale@alimfresh.fr', '03.20.45.67.89', '78 Avenue des Produits Frais, 59000 Lille');

-- Créer des produits variés
INSERT INTO public.products (id, name, sku, category_id, supplier_id, purchase_price, min_sale_price, current_price, description) VALUES
(1, 'Smartphone Samsung Galaxy A54', 'PHONE-SAM-A54', 1, 1, 280.00, 350.00, 399.99, 'Smartphone Android 6.4 pouces, 128GB'),
(2, 'Écouteurs Bluetooth JBL', 'AUDIO-JBL-BT', 1, 1, 45.00, 60.00, 79.99, 'Écouteurs sans fil avec réduction de bruit'),
(3, 'Jean Levi\'s 501 Original', 'CLOTH-LEVIS-501', 2, 2, 35.00, 50.00, 89.99, 'Jean classique coupe droite'),
(4, 'T-shirt Bio Coton', 'CLOTH-TSHIRT-BIO', 2, 2, 8.00, 15.00, 24.99, 'T-shirt 100% coton biologique'),
(5, 'Aspirateur Dyson V15', 'HOME-DYSON-V15', 3, 3, 420.00, 520.00, 649.99, 'Aspirateur sans fil haute performance'),
(6, 'Plante verte Monstera', 'GARDEN-MONSTERA', 3, 3, 12.00, 20.00, 34.99, 'Plante d\'intérieur tropicale'),
(7, 'Raquette Tennis Wilson', 'SPORT-WILSON-RAQ', 4, 4, 80.00, 120.00, 159.99, 'Raquette de tennis professionnelle'),
(8, 'Ballon Football Nike', 'SPORT-NIKE-BALL', 4, 4, 15.00, 25.00, 39.99, 'Ballon de football officiel'),
(9, 'Café Bio Arabica 1kg', 'FOOD-COFFEE-BIO', 5, 5, 12.00, 18.00, 24.99, 'Café bio torréfaction artisanale'),
(10, 'Miel de Provence 500g', 'FOOD-HONEY-PROV', 5, 5, 8.00, 12.00, 16.99, 'Miel de lavande de Provence');

-- Créer du stock pour chaque magasin
INSERT INTO public.stock (product_id, store_id, quantity, min_threshold) VALUES
-- Magasin Paris
(1, 1, 25, 5), (2, 1, 40, 10), (3, 1, 30, 8), (4, 1, 50, 15), (5, 1, 12, 3),
(6, 1, 20, 5), (7, 1, 15, 4), (8, 1, 35, 10), (9, 1, 45, 12), (10, 1, 28, 8),
-- Magasin Lyon
(1, 2, 18, 5), (2, 2, 32, 10), (3, 2, 25, 8), (4, 2, 42, 15), (5, 2, 8, 3),
(6, 2, 15, 5), (7, 2, 12, 4), (8, 2, 28, 10), (9, 2, 38, 12), (10, 2, 22, 8),
-- Magasin Marseille
(1, 3, 22, 5), (2, 3, 35, 10), (3, 3, 28, 8), (4, 3, 48, 15), (5, 3, 10, 3),
(6, 3, 18, 5), (7, 3, 14, 4), (8, 3, 32, 10), (9, 3, 41, 12), (10, 3, 25, 8);

-- Créer quelques ventes d'exemple
INSERT INTO public.sales (store_id, seller_id, subtotal, tax_amount, discount_amount, total, status, payment_method, customer_name, customer_email, sale_number) VALUES
(1, '33333333-3333-3333-3333-333333333333', 89.99, 18.00, 0, 107.99, 'completed', 'card', 'Client Parisien', 'client.paris@email.com', 'VTE-20241210-0001'),
(2, '44444444-4444-4444-4444-444444444444', 159.99, 32.00, 10.00, 181.99, 'completed', 'cash', 'Client Lyonnais', 'client.lyon@email.com', 'VTE-20241210-0002'),
(3, '55555555-5555-5555-5555-555555555555', 24.99, 5.00, 0, 29.99, 'completed', 'card', 'Client Marseillais', 'client.marseille@email.com', 'VTE-20241210-0003');

-- Créer les articles de vente correspondants
INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES
(1, 3, 1, 89.99, 89.99),
(2, 7, 1, 159.99, 159.99),
(3, 9, 1, 24.99, 24.99);

-- Migration pour le système de gamification
-- Création des tables et fonctions pour la gamification

-- Table de configuration de gamification
CREATE TABLE IF NOT EXISTS gamification_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_points JSONB NOT NULL DEFAULT '{
    "sale_completed": 10,
    "product_sold": 5,
    "customer_satisfaction": 15,
    "training_completed": 20,
    "perfect_attendance": 25
  }',
  multipliers JSONB NOT NULL DEFAULT '{
    "weekend_sale": 1.5,
    "holiday_sale": 2.0,
    "premium_product": 1.3,
    "new_customer": 1.2,
    "repeat_customer": 1.1
  }',
  penalties JSONB NOT NULL DEFAULT '{
    "late_arrival": -10,
    "customer_complaint": -20,
    "product_return": -15,
    "missed_target": -25,
    "training_missed": -30,
    "no_sales_daily": -15
  }',
  daily_goals JSONB NOT NULL DEFAULT '{
    "sales_count": 5,
    "sales_amount": 50000,
    "products_sold": 20,
    "customer_satisfaction": 4.5
  }',
  admin_config JSONB NOT NULL DEFAULT '{
    "point_adjustment_cooldown_hours": 20,
    "max_daily_point_adjustment": 100,
    "auto_penalty_no_sales": true,
    "manager_badge_requirements": {
      "total_sales_threshold": 1000,
      "sales_count_threshold": 50
    }
  }',
  avatar_levels JSONB NOT NULL DEFAULT '[
    {"level": 1, "name": "Débutant", "required_points": 0, "avatar_url": "/avatars/level1.png", "benefits": ["Accès de base"]},
    {"level": 2, "name": "Vendeur", "required_points": 100, "avatar_url": "/avatars/level2.png", "benefits": ["Badge Bronze"]},
    {"level": 3, "name": "Vendeur Confirmé", "required_points": 300, "avatar_url": "/avatars/level3.png", "benefits": ["Badge Argent"]},
    {"level": 4, "name": "Expert", "required_points": 600, "avatar_url": "/avatars/level4.png", "benefits": ["Badge Or"]},
    {"level": 5, "name": "Maître Vendeur", "required_points": 1000, "avatar_url": "/avatars/level5.png", "benefits": ["Badge Diamant"]}
  ]',
  badges JSONB NOT NULL DEFAULT '[
    {"type": "bronze", "name": "Bronze", "description": "Premier pas", "icon_url": "/badges/bronze.png", "required_points": 100, "is_active": true, "is_manager_only": false},
    {"type": "silver", "name": "Argent", "description": "Vendeur confirmé", "icon_url": "/badges/silver.png", "required_points": 300, "is_active": true, "is_manager_only": false},
    {"type": "gold", "name": "Or", "description": "Expert vendeur", "icon_url": "/badges/gold.png", "required_points": 600, "is_active": true, "is_manager_only": false},
    {"type": "diamond", "name": "Diamant", "description": "Maître vendeur", "icon_url": "/badges/diamond.png", "required_points": 1000, "is_active": true, "is_manager_only": false},
    {"type": "platinum", "name": "Platine", "description": "Légende", "icon_url": "/badges/platinum.png", "required_points": 2000, "is_active": true, "is_manager_only": false},
    {"type": "manager_bronze", "name": "Manager Bronze", "description": "Manager débutant", "icon_url": "/badges/manager_bronze.png", "required_points": 500, "is_active": true, "is_manager_only": true, "manager_requirements": {"total_sales": 1000, "sales_count": 50}},
    {"type": "manager_silver", "name": "Manager Argent", "description": "Manager confirmé", "icon_url": "/badges/manager_silver.png", "required_points": 1000, "is_active": true, "is_manager_only": true, "manager_requirements": {"total_sales": 2000, "sales_count": 100}},
    {"type": "manager_gold", "name": "Manager Or", "description": "Manager expert", "icon_url": "/badges/manager_gold.png", "required_points": 2000, "is_active": true, "is_manager_only": true, "manager_requirements": {"total_sales": 5000, "sales_count": 250}}
  ]',
  trophies JSONB NOT NULL DEFAULT '[
    {"name": "Meilleur Vendeur du Mois", "description": "Vendeur avec le plus de ventes du mois", "category": "monthly", "icon_url": "/trophies/monthly.png", "points_reward": 100, "criteria": [{"type": "sales_amount", "operator": "greater_than", "value": 1000000, "period": "monthly"}], "is_active": true, "applies_to_all_users": true},
    {"name": "Meilleur Vendeur 5 fois consécutives", "description": "Être meilleur vendeur 5 mois consécutifs", "category": "consecutive", "icon_url": "/trophies/consecutive5.png", "points_reward": 500, "criteria": [{"type": "best_seller_count", "operator": "greater_than", "value": 5, "period": "monthly"}], "is_active": true, "applies_to_all_users": true},
    {"name": "Meilleur Vendeur 15 fois consécutives", "description": "Être meilleur vendeur 15 mois consécutifs", "category": "consecutive", "icon_url": "/trophies/consecutive15.png", "points_reward": 1500, "criteria": [{"type": "best_seller_count", "operator": "greater_than", "value": 15, "period": "monthly"}], "is_active": true, "applies_to_all_users": true},
    {"name": "Objectif Quotidien", "description": "Atteindre l''objectif quotidien 7 jours de suite", "category": "special", "icon_url": "/trophies/daily.png", "points_reward": 50, "criteria": [{"type": "sales_count", "operator": "greater_than", "value": 5, "period": "daily"}], "is_active": true, "applies_to_all_users": true}
  ]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de gamification utilisateur
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_avatar TEXT DEFAULT '/avatars/level1.png',
  consecutive_best_seller_count INTEGER DEFAULT 0,
  last_best_seller_month TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table des badges utilisateur
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_manager_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des achievements utilisateur
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  points_earned INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des objectifs quotidiens
CREATE TABLE IF NOT EXISTS user_daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_date DATE NOT NULL,
  goal_type TEXT NOT NULL,
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal_date, goal_type)
);

-- Table des statistiques mensuelles
CREATE TABLE IF NOT EXISTS user_monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  total_sales INTEGER DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  total_products_sold INTEGER DEFAULT 0,
  average_satisfaction NUMERIC DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_lost INTEGER DEFAULT 0,
  net_points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  is_top_seller BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Table des événements de gamification
CREATE TABLE IF NOT EXISTS gamification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications de gamification
CREATE TABLE IF NOT EXISTS gamification_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon_url TEXT,
  points INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des ajustements de points par l'admin
CREATE TABLE IF NOT EXISTS admin_point_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points_adjusted INTEGER NOT NULL,
  reason TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('add', 'subtract')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id ON user_daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_monthly_stats_user_id ON user_monthly_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_events_user_id ON gamification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_notifications_user_id ON gamification_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_point_adjustments_admin_id ON admin_point_adjustments(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_point_adjustments_user_id ON admin_point_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_monthly_stats_month ON user_monthly_stats(month);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_date ON user_daily_goals(goal_date);

-- Fonction pour calculer automatiquement le niveau basé sur les points
CREATE OR REPLACE FUNCTION calculate_user_level(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF points >= 2000 THEN
    RETURN 5;
  ELSIF points >= 1000 THEN
    RETURN 4;
  ELSIF points >= 600 THEN
    RETURN 3;
  ELSIF points >= 300 THEN
    RETURN 2;
  ELSE
    RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour automatiquement le niveau et l'avatar
CREATE OR REPLACE FUNCTION update_user_level_and_avatar()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_level = calculate_user_level(NEW.total_points);
  
  -- Mettre à jour l'avatar basé sur le niveau
  CASE NEW.current_level
    WHEN 1 THEN NEW.current_avatar := '/avatars/level1.png';
    WHEN 2 THEN NEW.current_avatar := '/avatars/level2.png';
    WHEN 3 THEN NEW.current_avatar := '/avatars/level3.png';
    WHEN 4 THEN NEW.current_avatar := '/avatars/level4.png';
    WHEN 5 THEN NEW.current_avatar := '/avatars/level5.png';
    ELSE NEW.current_avatar := '/avatars/level1.png';
  END CASE;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le niveau et l'avatar
CREATE TRIGGER trigger_update_user_level_and_avatar
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level_and_avatar();

-- Fonction pour créer automatiquement les objectifs quotidiens
CREATE OR REPLACE FUNCTION create_daily_goals()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_daily_goals (user_id, goal_date, goal_type, target_value)
  VALUES 
    (NEW.user_id, CURRENT_DATE, 'sales_count', 5),
    (NEW.user_id, CURRENT_DATE, 'sales_amount', 50000),
    (NEW.user_id, CURRENT_DATE, 'products_sold', 20),
    (NEW.user_id, CURRENT_DATE, 'customer_satisfaction', 4.5)
  ON CONFLICT (user_id, goal_date, goal_type) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement les objectifs quotidiens
CREATE TRIGGER trigger_create_daily_goals
  AFTER INSERT ON user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION create_daily_goals();

-- Fonction pour appliquer automatiquement la pénalité d'absence de ventes
CREATE OR REPLACE FUNCTION apply_no_sales_penalty()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  config_record RECORD;
BEGIN
  -- Récupérer la configuration
  SELECT admin_config INTO config_record FROM gamification_config LIMIT 1;
  
  -- Vérifier si la pénalité automatique est activée
  IF NOT (config_record.admin_config->>'auto_penalty_no_sales')::boolean THEN
    RETURN;
  END IF;
  
  -- Pour chaque utilisateur
  FOR user_record IN 
    SELECT ug.user_id 
    FROM user_gamification ug
    WHERE NOT EXISTS (
      SELECT 1 FROM sales s 
      WHERE s.user_id = ug.user_id 
      AND DATE(s.created_at) = CURRENT_DATE
    )
    AND NOT EXISTS (
      SELECT 1 FROM gamification_events ge 
      WHERE ge.user_id = ug.user_id 
      AND ge.event_type = 'no_sales_penalty'
      AND DATE(ge.created_at) = CURRENT_DATE
    )
  LOOP
    -- Appliquer la pénalité
    UPDATE user_gamification 
    SET total_points = GREATEST(0, total_points + (config_record.admin_config->'penalties'->>'no_sales_daily')::integer)
    WHERE user_id = user_record.user_id;
    
    -- Enregistrer l'événement
    INSERT INTO gamification_events (user_id, event_type, event_data)
    VALUES (
      user_record.user_id, 
      'no_sales_penalty', 
      jsonb_build_object(
        'points', (config_record.admin_config->'penalties'->>'no_sales_daily')::integer,
        'reason', 'Aucune vente aujourd''hui'
      )
    );
    
    -- Créer une notification
    INSERT INTO gamification_notifications (user_id, type, title, message, points, is_read)
    VALUES (
      user_record.user_id,
      'no_sales_penalty',
      'Pénalité quotidienne',
      'Points soustraits pour absence de ventes aujourd''hui',
      (config_record.admin_config->'penalties'->>'no_sales_daily')::integer,
      false
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour déterminer le meilleur vendeur du mois
CREATE OR REPLACE FUNCTION determine_best_seller_month(month_param TEXT)
RETURNS void AS $$
DECLARE
  best_seller_record RECORD;
BEGIN
  -- Trouver le meilleur vendeur du mois
  SELECT user_id, total_amount
  INTO best_seller_record
  FROM user_monthly_stats
  WHERE month = month_param
  ORDER BY total_amount DESC
  LIMIT 1;
  
  IF FOUND THEN
    -- Mettre à jour le statut de meilleur vendeur
    UPDATE user_monthly_stats
    SET is_best_seller = true
    WHERE user_id = best_seller_record.user_id AND month = month_param;
    
    -- Mettre à jour le compteur consécutif
    UPDATE user_gamification
    SET 
      consecutive_best_seller_count = CASE 
        WHEN last_best_seller_month IS NULL OR 
             (SUBSTRING(last_best_seller_month, 1, 4)::integer = SUBSTRING(month_param, 1, 4)::integer AND 
              SUBSTRING(last_best_seller_month, 6, 2)::integer + 1 = SUBSTRING(month_param, 6, 2)::integer) OR
             (SUBSTRING(last_best_seller_month, 1, 4)::integer + 1 = SUBSTRING(month_param, 1, 4)::integer AND 
              SUBSTRING(last_best_seller_month, 6, 2)::integer = 12 AND 
              SUBSTRING(month_param, 6, 2)::integer = 1)
        THEN consecutive_best_seller_count + 1
        ELSE 1
      END,
      last_best_seller_month = month_param
    WHERE user_id = best_seller_record.user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Politiques RLS (Row Level Security)
ALTER TABLE gamification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_point_adjustments ENABLE ROW LEVEL SECURITY;

-- Politiques pour gamification_config (lecture seule pour tous les utilisateurs authentifiés)
CREATE POLICY "gamification_config_select_policy" ON gamification_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politiques pour user_gamification
CREATE POLICY "user_gamification_select_policy" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "user_gamification_insert_policy" ON user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "user_gamification_update_policy" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques pour user_badges
CREATE POLICY "user_badges_select_policy" ON user_badges
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "user_badges_insert_policy" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques pour user_achievements
CREATE POLICY "user_achievements_select_policy" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "user_achievements_insert_policy" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques pour user_daily_goals
CREATE POLICY "user_daily_goals_select_policy" ON user_daily_goals
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "user_daily_goals_insert_policy" ON user_daily_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "user_daily_goals_update_policy" ON user_daily_goals
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques pour user_monthly_stats
CREATE POLICY "user_monthly_stats_select_policy" ON user_monthly_stats
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "user_monthly_stats_insert_policy" ON user_monthly_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "user_monthly_stats_update_policy" ON user_monthly_stats
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques pour gamification_events
CREATE POLICY "gamification_events_select_policy" ON gamification_events
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "gamification_events_insert_policy" ON gamification_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques pour gamification_notifications
CREATE POLICY "gamification_notifications_select_policy" ON gamification_notifications
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "gamification_notifications_insert_policy" ON gamification_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "gamification_notifications_update_policy" ON gamification_notifications
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques pour admin_point_adjustments
CREATE POLICY "admin_point_adjustments_select_policy" ON admin_point_adjustments
  FOR SELECT USING (auth.uid() = admin_id OR auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "admin_point_adjustments_insert_policy" ON admin_point_adjustments
  FOR INSERT WITH CHECK (auth.uid() = admin_id OR auth.role() = 'service_role');

-- Insérer la configuration par défaut
INSERT INTO gamification_config (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;
