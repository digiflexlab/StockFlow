-- Migration pour le système de gamification
-- Création des tables et fonctions nécessaires

-- Enable RLS
ALTER TABLE IF EXISTS user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gamification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gamification_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gamification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gamification_trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_trophies ENABLE ROW LEVEL SECURITY;

-- Table de configuration de gamification
CREATE TABLE IF NOT EXISTS gamification_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table principale de gamification utilisateur
CREATE TABLE IF NOT EXISTS user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    current_avatar TEXT DEFAULT '/avatars/level1.png',
    badges JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    daily_goals JSONB DEFAULT '[]',
    monthly_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des badges utilisateur
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL CHECK (badge_type IN ('bronze', 'silver', 'gold', 'diamond', 'platinum')),
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    icon_url TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des réalisations utilisateur
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
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
    goal_type TEXT NOT NULL CHECK (goal_type IN ('sales_count', 'sales_amount', 'products_sold', 'customer_satisfaction')),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Table des événements de gamification
CREATE TABLE IF NOT EXISTS gamification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('points_earned', 'points_lost', 'badge_earned', 'achievement_unlocked', 'level_up', 'trophy_won')),
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications de gamification
CREATE TABLE IF NOT EXISTS gamification_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('achievement', 'badge', 'level_up', 'trophy', 'daily_goal', 'penalty')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon_url TEXT,
    points INTEGER,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des trophées
CREATE TABLE IF NOT EXISTS gamification_trophies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('monthly', 'quarterly', 'yearly', 'special')),
    icon_url TEXT,
    points_reward INTEGER DEFAULT 0,
    criteria JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des trophées utilisateur
CREATE TABLE IF NOT EXISTS user_trophies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trophy_id UUID REFERENCES gamification_trophies(id) ON DELETE CASCADE,
    trophy_name TEXT NOT NULL,
    trophy_description TEXT,
    points_reward INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, trophy_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id_date ON user_daily_goals(user_id, goal_date);
CREATE INDEX IF NOT EXISTS idx_user_monthly_stats_user_id_month ON user_monthly_stats(user_id, month);
CREATE INDEX IF NOT EXISTS idx_gamification_events_user_id ON gamification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_notifications_user_id ON gamification_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trophies_user_id ON user_trophies(user_id);

-- Index pour les classements
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_points ON user_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_monthly_stats_total_amount ON user_monthly_stats(total_amount DESC);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_monthly_stats_updated_at BEFORE UPDATE ON user_monthly_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamification_config_updated_at BEFORE UPDATE ON gamification_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamification_trophies_updated_at BEFORE UPDATE ON gamification_trophies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer le niveau basé sur les points
CREATE OR REPLACE FUNCTION calculate_user_level(total_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF total_points >= 2000 THEN
        RETURN 6; -- Niveau spécial
    ELSIF total_points >= 1000 THEN
        RETURN 5; -- Maître Vendeur
    ELSIF total_points >= 600 THEN
        RETURN 4; -- Expert
    ELSIF total_points >= 300 THEN
        RETURN 3; -- Vendeur Confirmé
    ELSIF total_points >= 100 THEN
        RETURN 2; -- Vendeur
    ELSE
        RETURN 1; -- Débutant
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier et attribuer les badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id UUID, total_points INTEGER)
RETURNS VOID AS $$
DECLARE
    badge_record RECORD;
    existing_badge RECORD;
BEGIN
    -- Vérifier les badges éligibles
    FOR badge_record IN 
        SELECT * FROM (
            VALUES 
                ('bronze', 100),
                ('silver', 300),
                ('gold', 600),
                ('diamond', 1000),
                ('platinum', 2000)
        ) AS badges(type, required_points)
        WHERE required_points <= total_points
    LOOP
        -- Vérifier si l'utilisateur a déjà ce badge
        SELECT * INTO existing_badge 
        FROM user_badges 
        WHERE user_id = check_and_award_badges.user_id 
        AND badge_type = badge_record.type;
        
        IF NOT FOUND THEN
            -- Attribuer le badge
            INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description, icon_url)
            VALUES (
                user_id,
                badge_record.type,
                CASE badge_record.type
                    WHEN 'bronze' THEN 'Bronze'
                    WHEN 'silver' THEN 'Argent'
                    WHEN 'gold' THEN 'Or'
                    WHEN 'diamond' THEN 'Diamant'
                    WHEN 'platinum' THEN 'Platine'
                END,
                CASE badge_record.type
                    WHEN 'bronze' THEN 'Premier pas'
                    WHEN 'silver' THEN 'Vendeur confirmé'
                    WHEN 'gold' THEN 'Expert vendeur'
                    WHEN 'diamond' THEN 'Maître vendeur'
                    WHEN 'platinum' THEN 'Légende'
                END,
                '/badges/' || badge_record.type || '.png'
            );
            
            -- Créer une notification
            INSERT INTO gamification_notifications (user_id, type, title, message, icon_url)
            VALUES (
                user_id,
                'badge',
                'Nouveau Badge : ' || CASE badge_record.type
                    WHEN 'bronze' THEN 'Bronze'
                    WHEN 'silver' THEN 'Argent'
                    WHEN 'gold' THEN 'Or'
                    WHEN 'diamond' THEN 'Diamant'
                    WHEN 'platinum' THEN 'Platine'
                END,
                'Félicitations ! Vous avez gagné le badge ' || CASE badge_record.type
                    WHEN 'bronze' THEN 'Bronze'
                    WHEN 'silver' THEN 'Argent'
                    WHEN 'gold' THEN 'Or'
                    WHEN 'diamond' THEN 'Diamant'
                    WHEN 'platinum' THEN 'Platine'
                END,
                '/badges/' || badge_record.type || '.png'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques mensuelles
CREATE OR REPLACE FUNCTION update_monthly_stats(user_id UUID, month TEXT)
RETURNS VOID AS $$
DECLARE
    sales_count INTEGER;
    total_amount NUMERIC;
    total_products INTEGER;
    avg_satisfaction NUMERIC;
BEGIN
    -- Calculer les statistiques des ventes
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0),
        COALESCE(SUM(jsonb_array_length(items)), 0)
    INTO sales_count, total_amount, total_products
    FROM sales 
    WHERE user_id = update_monthly_stats.user_id 
    AND to_char(created_at, 'YYYY-MM') = month;
    
    -- Calculer la satisfaction moyenne (si disponible)
    SELECT COALESCE(AVG(satisfaction_score), 0)
    INTO avg_satisfaction
    FROM customer_satisfaction 
    WHERE user_id = update_monthly_stats.user_id 
    AND to_char(created_at, 'YYYY-MM') = month;
    
    -- Insérer ou mettre à jour les statistiques
    INSERT INTO user_monthly_stats (
        user_id, month, total_sales, total_amount, 
        total_products_sold, average_satisfaction
    ) VALUES (
        user_id, month, sales_count, total_amount, 
        total_products, avg_satisfaction
    )
    ON CONFLICT (user_id, month) 
    DO UPDATE SET
        total_sales = EXCLUDED.total_sales,
        total_amount = EXCLUDED.total_amount,
        total_products_sold = EXCLUDED.total_products_sold,
        average_satisfaction = EXCLUDED.average_satisfaction,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le classement mensuel
CREATE OR REPLACE FUNCTION calculate_monthly_rankings(month TEXT)
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    rank_counter INTEGER := 1;
BEGIN
    -- Mettre à jour les rangs
    FOR user_record IN 
        SELECT user_id, total_amount
        FROM user_monthly_stats 
        WHERE month = calculate_monthly_rankings.month
        ORDER BY total_amount DESC
    LOOP
        UPDATE user_monthly_stats 
        SET 
            rank = rank_counter,
            is_top_seller = (rank_counter <= 3)
        WHERE user_id = user_record.user_id 
        AND month = calculate_monthly_rankings.month;
        
        rank_counter := rank_counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies

-- Politiques pour user_gamification
CREATE POLICY "Users can view own gamification data" ON user_gamification
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification data" ON user_gamification
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert gamification data" ON user_gamification
    FOR INSERT WITH CHECK (true);

-- Politiques pour user_badges
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage badges" ON user_badges
    FOR ALL USING (true);

-- Politiques pour user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage achievements" ON user_achievements
    FOR ALL USING (true);

-- Politiques pour user_daily_goals
CREATE POLICY "Users can view own daily goals" ON user_daily_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage daily goals" ON user_daily_goals
    FOR ALL USING (true);

-- Politiques pour user_monthly_stats
CREATE POLICY "Users can view own monthly stats" ON user_monthly_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage monthly stats" ON user_monthly_stats
    FOR ALL USING (true);

-- Politiques pour gamification_events
CREATE POLICY "Users can view own events" ON gamification_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create events" ON gamification_events
    FOR INSERT WITH CHECK (true);

-- Politiques pour gamification_notifications
CREATE POLICY "Users can view own notifications" ON gamification_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON gamification_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON gamification_notifications
    FOR INSERT WITH CHECK (true);

-- Politiques pour gamification_config
CREATE POLICY "Admins can manage config" ON gamification_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Politiques pour gamification_trophies
CREATE POLICY "Everyone can view trophies" ON gamification_trophies
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage trophies" ON gamification_trophies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Politiques pour user_trophies
CREATE POLICY "Users can view own trophies" ON user_trophies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage user trophies" ON user_trophies
    FOR ALL USING (true);

-- Insérer la configuration par défaut
INSERT INTO gamification_config (config) VALUES (
    '{
        "base_points": {
            "sale_completed": 10,
            "product_sold": 5,
            "customer_satisfaction": 15,
            "training_completed": 20,
            "perfect_attendance": 25
        },
        "multipliers": {
            "weekend_sale": 1.5,
            "holiday_sale": 2.0,
            "premium_product": 1.3,
            "new_customer": 1.2,
            "repeat_customer": 1.1
        },
        "penalties": {
            "late_arrival": -10,
            "customer_complaint": -20,
            "product_return": -15,
            "missed_target": -25,
            "training_missed": -30
        },
        "daily_goals": {
            "sales_count": 5,
            "sales_amount": 50000,
            "products_sold": 20,
            "customer_satisfaction": 4.5
        },
        "avatar_levels": [
            {"level": 1, "name": "Débutant", "required_points": 0, "avatar_url": "/avatars/level1.png", "benefits": ["Accès de base"]},
            {"level": 2, "name": "Vendeur", "required_points": 100, "avatar_url": "/avatars/level2.png", "benefits": ["Badge Bronze"]},
            {"level": 3, "name": "Vendeur Confirmé", "required_points": 300, "avatar_url": "/avatars/level3.png", "benefits": ["Badge Argent"]},
            {"level": 4, "name": "Expert", "required_points": 600, "avatar_url": "/avatars/level4.png", "benefits": ["Badge Or"]},
            {"level": 5, "name": "Maître Vendeur", "required_points": 1000, "avatar_url": "/avatars/level5.png", "benefits": ["Badge Diamant"]}
        ],
        "badges": [
            {"type": "bronze", "name": "Bronze", "description": "Premier pas", "icon_url": "/badges/bronze.png", "required_points": 100, "is_active": true},
            {"type": "silver", "name": "Argent", "description": "Vendeur confirmé", "icon_url": "/badges/silver.png", "required_points": 300, "is_active": true},
            {"type": "gold", "name": "Or", "description": "Expert vendeur", "icon_url": "/badges/gold.png", "required_points": 600, "is_active": true},
            {"type": "diamond", "name": "Diamant", "description": "Maître vendeur", "icon_url": "/badges/diamond.png", "required_points": 1000, "is_active": true},
            {"type": "platinum", "name": "Platine", "description": "Légende", "icon_url": "/badges/platinum.png", "required_points": 2000, "is_active": true}
        ],
        "trophies": [
            {
                "name": "Meilleur Vendeur du Mois",
                "description": "Vendeur avec le plus de ventes du mois",
                "category": "monthly",
                "icon_url": "/trophies/monthly.png",
                "points_reward": 100,
                "criteria": [{"type": "sales_amount", "operator": "greater_than", "value": 1000000, "period": "monthly"}],
                "is_active": true
            },
            {
                "name": "Objectif Quotidien",
                "description": "Atteindre l''objectif quotidien 7 jours de suite",
                "category": "special",
                "icon_url": "/trophies/daily.png",
                "points_reward": 50,
                "criteria": [{"type": "sales_count", "operator": "greater_than", "value": 5, "period": "daily"}],
                "is_active": true
            }
        ]
    }'
) ON CONFLICT DO NOTHING;

-- Insérer les trophées par défaut
INSERT INTO gamification_trophies (name, description, category, icon_url, points_reward, criteria, is_active) VALUES
    ('Meilleur Vendeur du Mois', 'Vendeur avec le plus de ventes du mois', 'monthly', '/trophies/monthly.png', 100, '[{"type": "sales_amount", "operator": "greater_than", "value": 1000000, "period": "monthly"}]', true),
    ('Objectif Quotidien', 'Atteindre l''objectif quotidien 7 jours de suite', 'special', '/trophies/daily.png', 50, '[{"type": "sales_count", "operator": "greater_than", "value": 5, "period": "daily"}]', true),
    ('Client Fidèle', 'Maintenir 10 clients fidèles', 'special', '/trophies/loyal.png', 75, '[{"type": "loyal_customers", "operator": "greater_than", "value": 10, "period": "monthly"}]', true),
    ('Formation Complète', 'Terminer toutes les formations', 'special', '/trophies/training.png', 80, '[{"type": "training_completed", "operator": "equals", "value": 100, "period": "monthly"}]', true)
ON CONFLICT DO NOTHING; 