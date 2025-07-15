import { supabase } from '@/integrations/supabase/client';
import type {
  GamificationEvent,
  UserGamification,
  UserBadge,
  UserAchievement,
  UserDailyGoal,
  GamificationAdminConfig
} from '@/types/gamification';

export class GamificationService {
  private static instance: GamificationService;
  private config: GamificationAdminConfig | null = null;

  private constructor() {}

  static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  // Charger la configuration
  async loadConfig(): Promise<GamificationAdminConfig> {
    if (this.config) return this.config;

    const { data, error } = await supabase
      .from('gamification_config')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Configuration par défaut si aucune n'existe
    this.config = data || {
      base_points: {
        sale_completed: 10,
        product_sold: 5,
        customer_satisfaction: 15,
        training_completed: 20,
        perfect_attendance: 25
      },
      multipliers: {
        weekend_sale: 1.5,
        holiday_sale: 2.0,
        premium_product: 1.3,
        new_customer: 1.2,
        repeat_customer: 1.1
      },
      penalties: {
        late_arrival: -10,
        customer_complaint: -20,
        product_return: -15,
        missed_target: -25,
        training_missed: -30
      },
      daily_goals: {
        sales_count: 5,
        sales_amount: 50000,
        products_sold: 20,
        customer_satisfaction: 4.5
      },
      avatar_levels: [
        { level: 1, name: "Débutant", required_points: 0, avatar_url: "/avatars/level1.png", benefits: ["Accès de base"] },
        { level: 2, name: "Vendeur", required_points: 100, avatar_url: "/avatars/level2.png", benefits: ["Badge Bronze"] },
        { level: 3, name: "Vendeur Confirmé", required_points: 300, avatar_url: "/avatars/level3.png", benefits: ["Badge Argent"] },
        { level: 4, name: "Expert", required_points: 600, avatar_url: "/avatars/level4.png", benefits: ["Badge Or"] },
        { level: 5, name: "Maître Vendeur", required_points: 1000, avatar_url: "/avatars/level5.png", benefits: ["Badge Diamant"] }
      ],
      badges: [
        { type: "bronze", name: "Bronze", description: "Premier pas", icon_url: "/badges/bronze.png", required_points: 100, is_active: true },
        { type: "silver", name: "Argent", description: "Vendeur confirmé", icon_url: "/badges/silver.png", required_points: 300, is_active: true },
        { type: "gold", name: "Or", description: "Expert vendeur", icon_url: "/badges/gold.png", required_points: 600, is_active: true },
        { type: "diamond", name: "Diamant", description: "Maître vendeur", icon_url: "/badges/diamond.png", required_points: 1000, is_active: true },
        { type: "platinum", name: "Platine", description: "Légende", icon_url: "/badges/platinum.png", required_points: 2000, is_active: true }
      ],
      trophies: []
    };

    return this.config;
  }

  // Initialiser la gamification pour un utilisateur
  async initializeUserGamification(userId: string): Promise<UserGamification> {
    const config = await this.loadConfig();
    
    const { data, error } = await supabase
      .from('user_gamification')
      .insert({
        user_id: userId,
        total_points: 0,
        current_level: 1,
        current_avatar: config.avatar_levels[0].avatar_url,
        badges: [],
        achievements: [],
        daily_goals: [],
        monthly_stats: {
          month: new Date().toISOString().slice(0, 7),
          total_sales: 0,
          total_amount: 0,
          total_products_sold: 0,
          average_satisfaction: 0,
          total_points_earned: 0,
          total_points_lost: 0,
          net_points: 0,
          rank: 0,
          is_top_seller: false
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Ajouter des points à un utilisateur
  async addPoints(userId: string, points: number, reason: string, eventData?: any): Promise<void> {
    const config = await this.loadConfig();
    
    // Récupérer les données actuelles
    const { data: currentData } = await supabase
      .from('user_gamification')
      .select('total_points, current_level')
      .eq('user_id', userId)
      .single();

    if (!currentData) {
      await this.initializeUserGamification(userId);
    }

    const newTotalPoints = (currentData?.total_points || 0) + points;
    const newLevel = this.calculateLevel(newTotalPoints, config.avatar_levels);

    // Mettre à jour les points
    const { error: updateError } = await supabase
      .from('user_gamification')
      .upsert({
        user_id: userId,
        total_points: newTotalPoints,
        current_level: newLevel,
        current_avatar: config.avatar_levels[newLevel - 1]?.avatar_url || config.avatar_levels[0].avatar_url,
        updated_at: new Date().toISOString()
      });

    if (updateError) throw updateError;

    // Enregistrer l'événement
    await this.recordEvent(userId, 'points_earned', {
      points,
      reason,
      ...eventData
    });

    // Vérifier les badges
    await this.checkAndAwardBadges(userId, newTotalPoints);

    // Vérifier les trophées
    await this.checkAndAwardTrophies(userId);

    // Vérifier le passage de niveau
    if (newLevel > (currentData?.current_level || 1)) {
      await this.handleLevelUp(userId, newLevel);
    }
  }

  // Soustraire des points à un utilisateur
  async subtractPoints(userId: string, points: number, reason: string, eventData?: any): Promise<void> {
    const config = await this.loadConfig();
    
    const { data: currentData } = await supabase
      .from('user_gamification')
      .select('total_points, current_level')
      .eq('user_id', userId)
      .single();

    if (!currentData) return;

    const newTotalPoints = Math.max(0, currentData.total_points - points);
    const newLevel = this.calculateLevel(newTotalPoints, config.avatar_levels);

    // Mettre à jour les points
    const { error: updateError } = await supabase
      .from('user_gamification')
      .update({
        total_points: newTotalPoints,
        current_level: newLevel,
        current_avatar: config.avatar_levels[newLevel - 1]?.avatar_url || config.avatar_levels[0].avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Enregistrer l'événement
    await this.recordEvent(userId, 'points_lost', {
      points,
      reason,
      ...eventData
    });
  }

  // Gérer une vente complétée
  async handleSaleCompleted(userId: string, saleData: {
    amount: number;
    productCount: number;
    isWeekend: boolean;
    isHoliday: boolean;
    hasPremiumProducts: boolean;
    isNewCustomer: boolean;
    isRepeatCustomer: boolean;
  }): Promise<void> {
    const config = await this.loadConfig();
    
    let totalPoints = config.base_points.sale_completed;
    let multiplier = 1.0;
    const reasons: string[] = ['Vente complétée'];

    // Appliquer les multiplicateurs
    if (saleData.isWeekend) {
      multiplier *= config.multipliers.weekend_sale;
      reasons.push('Bonus weekend');
    }

    if (saleData.isHoliday) {
      multiplier *= config.multipliers.holiday_sale;
      reasons.push('Bonus jour férié');
    }

    if (saleData.hasPremiumProducts) {
      multiplier *= config.multipliers.premium_product;
      reasons.push('Produits premium');
    }

    if (saleData.isNewCustomer) {
      multiplier *= config.multipliers.new_customer;
      reasons.push('Nouveau client');
    }

    if (saleData.isRepeatCustomer) {
      multiplier *= config.multipliers.repeat_customer;
      reasons.push('Client fidèle');
    }

    // Points pour les produits vendus
    const productPoints = saleData.productCount * config.base_points.product_sold;
    totalPoints += productPoints;

    // Appliquer le multiplicateur final
    const finalPoints = Math.round(totalPoints * multiplier);

    await this.addPoints(userId, finalPoints, reasons.join(', '), {
      sale_amount: saleData.amount,
      product_count: saleData.productCount,
      multiplier,
      base_points: totalPoints
    });

    // Mettre à jour les objectifs quotidiens
    await this.updateDailyGoal(userId, 'sales_count', 1);
    await this.updateDailyGoal(userId, 'sales_amount', saleData.amount);
    await this.updateDailyGoal(userId, 'products_sold', saleData.productCount);
  }

  // Gérer la satisfaction client
  async handleCustomerSatisfaction(userId: string, satisfaction: number): Promise<void> {
    const config = await this.loadConfig();
    
    if (satisfaction >= 4.5) {
      const points = config.base_points.customer_satisfaction;
      await this.addPoints(userId, points, 'Excellente satisfaction client', {
        satisfaction_score: satisfaction
      });
    }

    // Mettre à jour l'objectif quotidien
    await this.updateDailyGoal(userId, 'customer_satisfaction', satisfaction);
  }

  // Gérer un retour de produit
  async handleProductReturn(userId: string, returnData: {
    amount: number;
    productCount: number;
    reason: string;
  }): Promise<void> {
    const config = await this.loadConfig();
    
    const penalty = config.penalties.product_return;
    await this.subtractPoints(userId, Math.abs(penalty), 'Retour de produit', {
      return_amount: returnData.amount,
      return_product_count: returnData.productCount,
      return_reason: returnData.reason
    });
  }

  // Gérer une plainte client
  async handleCustomerComplaint(userId: string, complaintData: {
    severity: 'low' | 'medium' | 'high';
    description: string;
  }): Promise<void> {
    const config = await this.loadConfig();
    
    let penalty = config.penalties.customer_complaint;
    
    // Ajuster la pénalité selon la gravité
    if (complaintData.severity === 'high') {
      penalty *= 1.5;
    } else if (complaintData.severity === 'low') {
      penalty *= 0.5;
    }

    await this.subtractPoints(userId, Math.abs(penalty), 'Plainte client', {
      complaint_severity: complaintData.severity,
      complaint_description: complaintData.description
    });
  }

  // Mettre à jour un objectif quotidien
  async updateDailyGoal(userId: string, goalType: string, value: number): Promise<void> {
    const config = await this.loadConfig();
    const today = new Date().toISOString().split('T')[0];
    
    // Récupérer l'objectif actuel
    const { data: currentGoal } = await supabase
      .from('user_daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_date', today)
      .eq('goal_type', goalType)
      .single();

    if (currentGoal) {
      const newValue = currentGoal.current_value + value;
      const isCompleted = newValue >= currentGoal.target_value;
      const pointsEarned = isCompleted && !currentGoal.is_completed ? 10 : 0;

      await supabase
        .from('user_daily_goals')
        .update({
          current_value: newValue,
          is_completed: isCompleted,
          points_earned: currentGoal.points_earned + pointsEarned,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', currentGoal.id);

      if (pointsEarned > 0) {
        await this.addPoints(userId, pointsEarned, `Objectif quotidien ${goalType} atteint`);
      }
    } else {
      // Créer un nouvel objectif
      const targetValue = config.daily_goals[goalType as keyof typeof config.daily_goals] || 0;
      
      await supabase
        .from('user_daily_goals')
        .insert({
          user_id: userId,
          goal_date: today,
          goal_type: goalType,
          target_value: targetValue,
          current_value: value,
          is_completed: value >= targetValue,
          points_earned: value >= targetValue ? 10 : 0,
          completed_at: value >= targetValue ? new Date().toISOString() : null
        });
    }
  }

  // Vérifier et attribuer les badges
  async checkAndAwardBadges(userId: string, totalPoints: number): Promise<void> {
    const config = await this.loadConfig();
    
    const eligibleBadges = config.badges.filter(badge => 
      badge.is_active && totalPoints >= badge.required_points
    );

    for (const badge of eligibleBadges) {
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_type', badge.type)
        .single();

      if (!existingBadge) {
        // Attribuer le badge
        await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_type: badge.type,
            badge_name: badge.name,
            badge_description: badge.description,
            earned_at: new Date().toISOString(),
            is_active: true
          });

        // Enregistrer l'événement
        await this.recordEvent(userId, 'badge_earned', {
          badge_type: badge.type,
          badge_name: badge.name
        });

        // Créer une notification
        await this.createNotification(userId, 'badge', {
          title: `Nouveau Badge : ${badge.name}`,
          message: `Félicitations ! Vous avez gagné le badge ${badge.name}`,
          icon_url: badge.icon_url
        });
      }
    }
  }

  // Vérifier et attribuer les trophées
  async checkAndAwardTrophies(userId: string): Promise<void> {
    const config = await this.loadConfig();
    
    // Logique pour vérifier les critères des trophées
    // À implémenter selon les besoins spécifiques
    for (const trophy of config.trophies) {
      if (!trophy.is_active) continue;

      // Vérifier si l'utilisateur a déjà gagné ce trophée
      const { data: existingTrophy } = await supabase
        .from('user_trophies')
        .select('id')
        .eq('user_id', userId)
        .eq('trophy_name', trophy.name)
        .single();

      if (!existingTrophy) {
        // Vérifier les critères du trophée
        const isEligible = await this.checkTrophyCriteria(userId, trophy);
        
        if (isEligible) {
          // Attribuer le trophée
          await supabase
            .from('user_trophies')
            .insert({
              user_id: userId,
              trophy_name: trophy.name,
              trophy_description: trophy.description,
              points_reward: trophy.points_reward,
              earned_at: new Date().toISOString(),
              is_active: true
            });

          // Ajouter les points de récompense
          await this.addPoints(userId, trophy.points_reward, `Trophée gagné : ${trophy.name}`);

          // Enregistrer l'événement
          await this.recordEvent(userId, 'trophy_won', {
            trophy_name: trophy.name,
            points_reward: trophy.points_reward
          });

          // Créer une notification
          await this.createNotification(userId, 'trophy', {
            title: `Trophée Gagné : ${trophy.name}`,
            message: `Félicitations ! Vous avez gagné le trophée ${trophy.name}`,
            icon_url: trophy.icon_url,
            points: trophy.points_reward
          });
        }
      }
    }
  }

  // Vérifier les critères d'un trophée
  private async checkTrophyCriteria(userId: string, trophy: any): Promise<boolean> {
    // Implémentation basique - à étendre selon les besoins
    for (const criterion of trophy.criteria) {
      switch (criterion.type) {
        case 'sales_amount':
          // Vérifier le montant des ventes
          const { data: salesData } = await supabase
            .from('sales')
            .select('total_amount')
            .eq('user_id', userId)
            .gte('created_at', this.getPeriodStartDate(criterion.period));

          const totalSales = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
          
          if (criterion.operator === 'greater_than' && totalSales < criterion.value) {
            return false;
          }
          break;

        case 'sales_count':
          // Vérifier le nombre de ventes
          const { count: salesCount } = await supabase
            .from('sales')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .gte('created_at', this.getPeriodStartDate(criterion.period));

          if (criterion.operator === 'greater_than' && (salesCount || 0) < criterion.value) {
            return false;
          }
          break;

        // Ajouter d'autres types de critères selon les besoins
      }
    }
    
    return true;
  }

  // Gérer le passage de niveau
  private async handleLevelUp(userId: string, newLevel: number): Promise<void> {
    const config = await this.loadConfig();
    const levelInfo = config.avatar_levels.find(level => level.level === newLevel);
    
    if (levelInfo) {
      // Enregistrer l'événement
      await this.recordEvent(userId, 'level_up', {
        new_level: newLevel,
        level_name: levelInfo.name
      });

      // Créer une notification
      await this.createNotification(userId, 'level_up', {
        title: `Niveau Supérieur : ${levelInfo.name}`,
        message: `Félicitations ! Vous avez atteint le niveau ${levelInfo.name}`,
        icon_url: levelInfo.avatar_url
      });
    }
  }

  // Enregistrer un événement
  private async recordEvent(userId: string, eventType: string, eventData: any): Promise<void> {
    await supabase
      .from('gamification_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        created_at: new Date().toISOString()
      });
  }

  // Créer une notification
  private async createNotification(userId: string, type: string, data: any): Promise<void> {
    await supabase
      .from('gamification_notifications')
      .insert({
        user_id: userId,
        type,
        title: data.title,
        message: data.message,
        icon_url: data.icon_url,
        points: data.points,
        is_read: false,
        created_at: new Date().toISOString()
      });
  }

  // Calculer le niveau basé sur les points
  private calculateLevel(points: number, levels: any[]): number {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].required_points) {
        return levels[i].level;
      }
    }
    return 1;
  }

  // Obtenir la date de début d'une période
  private getPeriodStartDate(period: string): string {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).toISOString();
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1).toISOString();
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  }

  // Mettre à jour les statistiques mensuelles
  async updateMonthlyStats(userId: string): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Calculer les statistiques du mois
    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount, items')
      .eq('user_id', userId)
      .gte('created_at', `${currentMonth}-01`)
      .lt('created_at', `${currentMonth}-32`);

    const totalSales = sales?.length || 0;
    const totalAmount = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
    const totalProducts = sales?.reduce((sum, sale) => sum + (sale.items?.length || 0), 0) || 0;

    // Mettre à jour les statistiques
    await supabase
      .from('user_gamification')
      .update({
        monthly_stats: {
          month: currentMonth,
          total_sales: totalSales,
          total_amount: totalAmount,
          total_products_sold: totalProducts,
          average_satisfaction: 0, // À calculer si disponible
          total_points_earned: 0, // À calculer
          total_points_lost: 0, // À calculer
          net_points: 0, // À calculer
          rank: 0, // À calculer
          is_top_seller: false // À calculer
        }
      })
      .eq('user_id', userId);
  }

  // Calculer le classement mensuel
  async calculateMonthlyRankings(): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Récupérer tous les utilisateurs avec leurs statistiques
    const { data: users } = await supabase
      .from('user_gamification')
      .select('user_id, monthly_stats')
      .not('monthly_stats', 'is', null);

    if (!users) return;

    // Trier par montant des ventes
    const sortedUsers = users
      .filter(user => user.monthly_stats?.month === currentMonth)
      .sort((a, b) => (b.monthly_stats?.total_amount || 0) - (a.monthly_stats?.total_amount || 0));

    // Mettre à jour les rangs
    for (let i = 0; i < sortedUsers.length; i++) {
      const user = sortedUsers[i];
      const rank = i + 1;
      const isTopSeller = rank <= 3;

      await supabase
        .from('user_gamification')
        .update({
          monthly_stats: {
            ...user.monthly_stats,
            rank,
            is_top_seller: isTopSeller
          }
        })
        .eq('user_id', user.user_id);
    }
  }
}

// Export de l'instance singleton
export const gamificationService = GamificationService.getInstance(); 