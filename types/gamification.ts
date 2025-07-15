// Types pour le système de gamification

export interface GamificationConfig {
  id: string;
  name: string;
  description: string;
  category: 'achievement' | 'daily_goal' | 'penalty' | 'bonus';
  points: number;
  is_active: boolean;
  conditions: GamificationCondition[];
  created_at: string;
  updated_at: string;
}

export interface GamificationCondition {
  id: string;
  config_id: string;
  type: 'sales_count' | 'sales_amount' | 'products_sold' | 'customer_satisfaction' | 'attendance' | 'training_completed';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: number | string | number[];
  unit?: string;
  description: string;
}

export interface UserGamification {
  id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  current_avatar: string;
  badges: UserBadge[];
  achievements: UserAchievement[];
  daily_goals: UserDailyGoal[];
  monthly_stats: UserMonthlyStats;
  consecutive_best_seller_count: number; // Nombre de fois consécutives comme meilleur vendeur
  last_best_seller_month?: string; // Dernier mois où l'utilisateur était meilleur vendeur
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: 'bronze' | 'silver' | 'gold' | 'diamond' | 'platinum';
  badge_name: string;
  badge_description: string;
  earned_at: string;
  is_active: boolean;
  is_manager_only: boolean; // Indique si le badge est réservé aux managers
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achievement_name: string;
  achievement_description: string;
  points_earned: number;
  earned_at: string;
  is_active: boolean;
}

export interface UserDailyGoal {
  id: string;
  user_id: string;
  goal_date: string;
  goal_type: 'sales_count' | 'sales_amount' | 'products_sold' | 'customer_satisfaction';
  target_value: number;
  current_value: number;
  is_completed: boolean;
  points_earned: number;
  completed_at?: string;
}

export interface UserMonthlyStats {
  id: string;
  user_id: string;
  month: string; // Format: YYYY-MM
  total_sales: number;
  total_amount: number;
  total_products_sold: number;
  average_satisfaction: number;
  total_points_earned: number;
  total_points_lost: number;
  net_points: number;
  rank: number;
  is_top_seller: boolean;
  is_best_seller: boolean; // Meilleur vendeur du mois
}

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  user_avatar: string;
  total_points: number;
  current_level: number;
  monthly_sales: number;
  monthly_amount: number;
  rank: number;
  badge_count: number;
  achievement_count: number;
  user_role: string; // Pour différencier managers et vendeurs
}

export interface AvatarLevel {
  level: number;
  name: string;
  description: string;
  avatar_url: string;
  required_points: number;
  benefits: string[];
  is_unlocked: boolean;
}

export interface Trophy {
  id: string;
  name: string;
  description: string;
  category: 'monthly' | 'quarterly' | 'yearly' | 'special' | 'consecutive';
  icon_url: string;
  points_reward: number;
  criteria: TrophyCriteria[];
  is_active: boolean;
  applies_to_all_users: boolean; // Tous les types d'utilisateurs peuvent l'obtenir
}

export interface TrophyCriteria {
  id: string;
  trophy_id: string;
  type: 'sales_count' | 'sales_amount' | 'customer_satisfaction' | 'attendance' | 'training' | 'best_seller_count';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: number | number[];
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface GamificationEvent {
  id: string;
  user_id: string;
  event_type: 'points_earned' | 'points_lost' | 'badge_earned' | 'achievement_unlocked' | 'level_up' | 'trophy_won' | 'admin_points_adjustment' | 'no_sales_penalty';
  event_data: {
    points?: number;
    badge_type?: string;
    achievement_name?: string;
    new_level?: number;
    trophy_name?: string;
    reason?: string;
    admin_id?: string; // ID de l'admin qui a ajusté les points
  };
  created_at: string;
}

// Types pour la configuration admin
export interface GamificationAdminConfig {
  // Points de base
  base_points: {
    sale_completed: number;
    product_sold: number;
    customer_satisfaction: number;
    training_completed: number;
    perfect_attendance: number;
  };
  
  // Multiplicateurs
  multipliers: {
    weekend_sale: number;
    holiday_sale: number;
    premium_product: number;
    new_customer: number;
    repeat_customer: number;
  };
  
  // Pénalités
  penalties: {
    late_arrival: number;
    customer_complaint: number;
    product_return: number;
    missed_target: number;
    training_missed: number;
    no_sales_daily: number; // Pénalité pour absence de ventes quotidiennes
  };
  
  // Objectifs quotidiens
  daily_goals: {
    sales_count: number;
    sales_amount: number;
    products_sold: number;
    customer_satisfaction: number;
  };
  
  // Configuration admin
  admin_config: {
    point_adjustment_cooldown_hours: number; // Délai entre les ajustements de points (20h)
    max_daily_point_adjustment: number; // Maximum de points qu'un admin peut ajuster par jour
    auto_penalty_no_sales: boolean; // Activer la pénalité automatique pour absence de ventes
    manager_badge_requirements: {
      total_sales_threshold: number; // Seuil de ventes totales pour les badges managers
      sales_count_threshold: number; // Seuil de nombre de ventes pour les badges managers
    };
  };
  
  // Niveaux d'avatar
  avatar_levels: AvatarLevelConfig[];
  
  // Badges
  badges: BadgeConfig[];
  
  // Trophées
  trophies: TrophyConfig[];
}

export interface AvatarLevelConfig {
  level: number;
  name: string;
  required_points: number;
  avatar_url: string;
  benefits: string[];
}

export interface BadgeConfig {
  type: 'bronze' | 'silver' | 'gold' | 'diamond' | 'platinum';
  name: string;
  description: string;
  icon_url: string;
  required_points: number;
  is_active: boolean;
  is_manager_only: boolean; // Badges réservés aux managers
  manager_requirements?: {
    total_sales: number;
    sales_count: number;
  };
}

export interface TrophyConfig {
  name: string;
  description: string;
  category: 'monthly' | 'quarterly' | 'yearly' | 'special' | 'consecutive';
  icon_url: string;
  points_reward: number;
  criteria: TrophyCriteriaConfig[];
  is_active: boolean;
  applies_to_all_users: boolean; // Tous les types d'utilisateurs peuvent l'obtenir
}

export interface TrophyCriteriaConfig {
  type: 'sales_count' | 'sales_amount' | 'customer_satisfaction' | 'attendance' | 'training' | 'best_seller_count';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: number | number[];
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface GamificationNotification {
  id: string;
  user_id: string;
  type: 'achievement' | 'badge' | 'level_up' | 'trophy' | 'daily_goal' | 'penalty' | 'admin_adjustment' | 'no_sales_penalty';
  title: string;
  message: string;
  icon_url?: string;
  points?: number;
  is_read: boolean;
  created_at: string;
}

// Types pour les actions admin
export interface AdminPointAdjustment {
  id: string;
  admin_id: string;
  user_id: string;
  points_adjusted: number;
  reason: string;
  adjustment_type: 'add' | 'subtract';
  created_at: string;
  cooldown_until?: string; // Quand l'admin pourra à nouveau ajuster les points
}

export interface GamificationStats {
  total_users: number;
  active_users: number;
  total_points_awarded: number;
  total_achievements: number;
  total_badges: number;
  top_performers: LeaderboardEntry[];
  recent_achievements: UserAchievement[];
  system_health: {
    average_points_per_user: number;
    achievement_rate: number;
    engagement_rate: number;
  };
}

export interface GamificationReport {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  total_points_awarded: number;
  total_points_lost: number;
  net_points: number;
  achievements_unlocked: number;
  badges_earned: number;
  level_ups: number;
  trophies_won: number;
  top_performers: LeaderboardEntry[];
  most_engaged_users: string[];
  system_performance: {
    average_daily_points: number;
    completion_rate: number;
    satisfaction_score: number;
  };
} 