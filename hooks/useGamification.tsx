import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type {
  UserGamification,
  UserBadge,
  UserAchievement,
  UserDailyGoal,
  UserMonthlyStats,
  LeaderboardEntry,
  AvatarLevel,
  Trophy,
  GamificationEvent,
  GamificationNotification,
  GamificationStats,
  GamificationAdminConfig,
  AdminPointAdjustment
} from '@/types/gamification';

export const useGamification = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Configuration par défaut avec les nouveaux paramètres
  const defaultConfig: GamificationAdminConfig = {
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
      training_missed: -30,
      no_sales_daily: -15 // Pénalité pour absence de ventes quotidiennes
    },
    daily_goals: {
      sales_count: 5,
      sales_amount: 50000,
      products_sold: 20,
      customer_satisfaction: 4.5
    },
    admin_config: {
      point_adjustment_cooldown_hours: 20, // 20 heures de délai
      max_daily_point_adjustment: 100, // Maximum 100 points par jour
      auto_penalty_no_sales: true, // Activer la pénalité automatique
      manager_badge_requirements: {
        total_sales_threshold: 1000, // 1000 ventes totales pour les badges managers
        sales_count_threshold: 50 // 50 ventes pour les badges managers
      }
    },
    avatar_levels: [
      { level: 1, name: "Débutant", required_points: 0, avatar_url: "/avatars/level1.png", benefits: ["Accès de base"] },
      { level: 2, name: "Vendeur", required_points: 100, avatar_url: "/avatars/level2.png", benefits: ["Badge Bronze"] },
      { level: 3, name: "Vendeur Confirmé", required_points: 300, avatar_url: "/avatars/level3.png", benefits: ["Badge Argent"] },
      { level: 4, name: "Expert", required_points: 600, avatar_url: "/avatars/level4.png", benefits: ["Badge Or"] },
      { level: 5, name: "Maître Vendeur", required_points: 1000, avatar_url: "/avatars/level5.png", benefits: ["Badge Diamant"] }
    ],
    badges: [
      { 
        type: "bronze", 
        name: "Bronze", 
        description: "Premier pas", 
        icon_url: "/badges/bronze.png", 
        required_points: 100, 
        is_active: true,
        is_manager_only: false
      },
      { 
        type: "silver", 
        name: "Argent", 
        description: "Vendeur confirmé", 
        icon_url: "/badges/silver.png", 
        required_points: 300, 
        is_active: true,
        is_manager_only: false
      },
      { 
        type: "gold", 
        name: "Or", 
        description: "Expert vendeur", 
        icon_url: "/badges/gold.png", 
        required_points: 600, 
        is_active: true,
        is_manager_only: false
      },
      { 
        type: "diamond", 
        name: "Diamant", 
        description: "Maître vendeur", 
        icon_url: "/badges/diamond.png", 
        required_points: 1000, 
        is_active: true,
        is_manager_only: false
      },
      { 
        type: "platinum", 
        name: "Platine", 
        description: "Légende", 
        icon_url: "/badges/platinum.png", 
        required_points: 2000, 
        is_active: true,
        is_manager_only: false
      },
      // Badges réservés aux managers
      { 
        type: "manager_bronze", 
        name: "Manager Bronze", 
        description: "Manager débutant", 
        icon_url: "/badges/manager_bronze.png", 
        required_points: 500, 
        is_active: true,
        is_manager_only: true,
        manager_requirements: {
          total_sales: 1000,
          sales_count: 50
        }
      },
      { 
        type: "manager_silver", 
        name: "Manager Argent", 
        description: "Manager confirmé", 
        icon_url: "/badges/manager_silver.png", 
        required_points: 1000, 
        is_active: true,
        is_manager_only: true,
        manager_requirements: {
          total_sales: 2000,
          sales_count: 100
        }
      },
      { 
        type: "manager_gold", 
        name: "Manager Or", 
        description: "Manager expert", 
        icon_url: "/badges/manager_gold.png", 
        required_points: 2000, 
        is_active: true,
        is_manager_only: true,
        manager_requirements: {
          total_sales: 5000,
          sales_count: 250
        }
      }
    ],
    trophies: [
      {
        name: "Meilleur Vendeur du Mois",
        description: "Vendeur avec le plus de ventes du mois",
        category: "monthly",
        icon_url: "/trophies/monthly.png",
        points_reward: 100,
        criteria: [
          { type: "sales_amount", operator: "greater_than", value: 1000000, period: "monthly" }
        ],
        is_active: true,
        applies_to_all_users: true
      },
      {
        name: "Meilleur Vendeur 5 fois consécutives",
        description: "Être meilleur vendeur 5 mois consécutifs",
        category: "consecutive",
        icon_url: "/trophies/consecutive5.png",
        points_reward: 500,
        criteria: [
          { type: "best_seller_count", operator: "greater_than", value: 5, period: "monthly" }
        ],
        is_active: true,
        applies_to_all_users: true
      },
      {
        name: "Meilleur Vendeur 15 fois consécutives",
        description: "Être meilleur vendeur 15 mois consécutifs",
        category: "consecutive",
        icon_url: "/trophies/consecutive15.png",
        points_reward: 1500,
        criteria: [
          { type: "best_seller_count", operator: "greater_than", value: 15, period: "monthly" }
        ],
        is_active: true,
        applies_to_all_users: true
      },
      {
        name: "Objectif Quotidien",
        description: "Atteindre l'objectif quotidien 7 jours de suite",
        category: "special",
        icon_url: "/trophies/daily.png",
        points_reward: 50,
        criteria: [
          { type: "sales_count", operator: "greater_than", value: 5, period: "daily" }
        ],
        is_active: true,
        applies_to_all_users: true
      }
    ]
  };

  // Récupérer la configuration de gamification
  const { data: config = defaultConfig } = useQuery({
    queryKey: ['gamification_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || defaultConfig;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Récupérer les données de gamification de l'utilisateur
  const { data: userGamification, isLoading: userLoading } = useQuery({
    queryKey: ['user_gamification', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from('user_gamification')
        .select(`
          *,
          badges (*),
          achievements (*),
          daily_goals (*),
          monthly_stats (*)
        `)
        .eq('user_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!profile?.id,
  });

  // Récupérer le classement
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['gamification_leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_gamification')
        .select(`
          user_id,
          total_points,
          current_level,
          current_avatar,
          profiles!inner(name),
          badges(count),
          achievements(count)
        `)
        .order('total_points', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data.map((entry, index) => ({
        user_id: entry.user_id,
        user_name: entry.profiles.name,
        user_avatar: entry.current_avatar,
        total_points: entry.total_points,
        current_level: entry.current_level,
        monthly_sales: 0, // À calculer
        monthly_amount: 0, // À calculer
        rank: index + 1,
        badge_count: entry.badges?.[0]?.count || 0,
        achievement_count: entry.achievements?.[0]?.count || 0
      })) as LeaderboardEntry[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Récupérer les notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['gamification_notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('gamification_notifications')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Initialiser la gamification pour un nouvel utilisateur
  const initializeUserGamification = useMutation({
    mutationFn: async (userId: string) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_gamification'] });
      toast({
        title: "Gamification initialisée",
        description: "Votre profil de gamification a été créé avec succès !",
      });
    },
  });

  // Ajouter des points
  const addPoints = useMutation({
    mutationFn: async ({ userId, points, reason }: { userId: string; points: number; reason: string }) => {
      // Mettre à jour les points
      const { data: currentData } = await supabase
        .from('user_gamification')
        .select('total_points, current_level')
        .eq('user_id', userId)
        .single();

      if (!currentData) {
        await initializeUserGamification.mutateAsync(userId);
      }

      const newTotalPoints = (currentData?.total_points || 0) + points;
      const newLevel = calculateLevel(newTotalPoints, config.avatar_levels);

      const { data, error } = await supabase
        .from('user_gamification')
        .upsert({
          user_id: userId,
          total_points: newTotalPoints,
          current_level: newLevel,
          current_avatar: config.avatar_levels[newLevel - 1]?.avatar_url || config.avatar_levels[0].avatar_url,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Enregistrer l'événement
      await supabase
        .from('gamification_events')
        .insert({
          user_id: userId,
          event_type: 'points_earned',
          event_data: { points, reason },
          created_at: new Date().toISOString()
        });

      // Vérifier les badges
      await checkAndAwardBadges(userId, newTotalPoints);

      // Vérifier les trophées
      await checkAndAwardTrophies(userId);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user_gamification'] });
      queryClient.invalidateQueries({ queryKey: ['gamification_leaderboard'] });
      
      toast({
        title: "Points ajoutés !",
        description: `+${data.total_points} points gagnés !`,
      });
    },
  });

  // Soustraire des points
  const subtractPoints = useMutation({
    mutationFn: async ({ userId, points, reason }: { userId: string; points: number; reason: string }) => {
      const { data: currentData } = await supabase
        .from('user_gamification')
        .select('total_points, current_level')
        .eq('user_id', userId)
        .single();

      if (!currentData) return null;

      const newTotalPoints = Math.max(0, currentData.total_points - points);
      const newLevel = calculateLevel(newTotalPoints, config.avatar_levels);

      const { data, error } = await supabase
        .from('user_gamification')
        .update({
          total_points: newTotalPoints,
          current_level: newLevel,
          current_avatar: config.avatar_levels[newLevel - 1]?.avatar_url || config.avatar_levels[0].avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer l'événement
      await supabase
        .from('gamification_events')
        .insert({
          user_id: userId,
          event_type: 'points_lost',
          event_data: { points, reason },
          created_at: new Date().toISOString()
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_gamification'] });
      queryClient.invalidateQueries({ queryKey: ['gamification_leaderboard'] });
    },
  });

  // Marquer les notifications comme lues
  const markNotificationAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('gamification_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification_notifications'] });
    },
  });

  // Calculer le niveau basé sur les points
  const calculateLevel = useCallback((points: number, levels: any[]): number => {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].required_points) {
        return levels[i].level;
      }
    }
    return 1;
  }, []);

  // Vérifier et attribuer les badges
  const checkAndAwardBadges = useCallback(async (userId: string, totalPoints: number) => {
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

        // Créer une notification
        await supabase
          .from('gamification_notifications')
          .insert({
            user_id: userId,
            type: 'badge',
            title: `Nouveau Badge : ${badge.name}`,
            message: `Félicitations ! Vous avez gagné le badge ${badge.name}`,
            icon_url: badge.icon_url,
            is_read: false,
            created_at: new Date().toISOString()
          });
      }
    }
  }, [config.badges]);

  // Vérifier et attribuer les trophées
  const checkAndAwardTrophies = useCallback(async (userId: string) => {
    // Logique pour vérifier les critères des trophées
    // À implémenter selon les besoins spécifiques
  }, []);

  // Mettre à jour les objectifs quotidiens
  const updateDailyGoals = useCallback(async (userId: string, goalType: string, value: number) => {
    const today = new Date().toISOString().split('T')[0];
    
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
        await addPoints.mutateAsync({
          userId,
          points: pointsEarned,
          reason: `Objectif quotidien ${goalType} atteint`
        });
      }
    }
  }, [addPoints]);

  // Statistiques calculées
  const stats = useMemo(() => {
    if (!userGamification) return null;

    const currentLevel = config.avatar_levels.find(level => level.level === userGamification.current_level);
    const nextLevel = config.avatar_levels.find(level => level.level === userGamification.current_level + 1);
    
    const progressToNextLevel = nextLevel 
      ? ((userGamification.total_points - currentLevel.required_points) / (nextLevel.required_points - currentLevel.required_points)) * 100
      : 100;

    return {
      currentLevel,
      nextLevel,
      progressToNextLevel,
      totalBadges: userGamification.badges?.length || 0,
      totalAchievements: userGamification.achievements?.length || 0,
      rank: leaderboard.find(entry => entry.user_id === profile?.id)?.rank || 0
    };
  }, [userGamification, config.avatar_levels, leaderboard, profile?.id]);

  // Initialiser automatiquement si nécessaire
  useEffect(() => {
    if (profile?.id && !userGamification && !isInitialized) {
      setIsInitialized(true);
      initializeUserGamification.mutate(profile.id);
    }
  }, [profile?.id, userGamification, isInitialized, initializeUserGamification]);

  // === NOUVELLES FONCTIONNALITÉS ===

  // Ajustement de points par l'admin avec cooldown
  const adminAdjustPoints = useMutation({
    mutationFn: async ({ 
      targetUserId, 
      points, 
      reason, 
      adjustmentType 
    }: { 
      targetUserId: string; 
      points: number; 
      reason: string; 
      adjustmentType: 'add' | 'subtract' 
    }) => {
      if (!profile?.id) throw new Error('Admin non connecté');

      // Vérifier le cooldown
      const { data: lastAdjustment } = await supabase
        .from('admin_point_adjustments')
        .select('created_at')
        .eq('admin_id', profile.id)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastAdjustment) {
        const cooldownHours = config.admin_config.point_adjustment_cooldown_hours;
        const lastAdjustmentTime = new Date(lastAdjustment.created_at);
        const cooldownUntil = new Date(lastAdjustmentTime.getTime() + (cooldownHours * 60 * 60 * 1000));
        
        if (new Date() < cooldownUntil) {
          throw new Error(`Vous devez attendre ${cooldownHours} heures entre les ajustements de points`);
        }
      }

      // Vérifier la limite quotidienne
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAdjustments } = await supabase
        .from('admin_point_adjustments')
        .select('points_adjusted')
        .eq('admin_id', profile.id)
        .gte('created_at', today);

      const totalToday = todayAdjustments?.reduce((sum, adj) => sum + Math.abs(adj.points_adjusted), 0) || 0;
      if (totalToday + points > config.admin_config.max_daily_point_adjustment) {
        throw new Error(`Limite quotidienne d'ajustement de points dépassée`);
      }

      // Appliquer l'ajustement
      const { data: currentData } = await supabase
        .from('user_gamification')
        .select('total_points, current_level')
        .eq('user_id', targetUserId)
        .single();

      if (!currentData) throw new Error('Utilisateur non trouvé');

      const newTotalPoints = adjustmentType === 'add' 
        ? currentData.total_points + points
        : Math.max(0, currentData.total_points - points);

      const newLevel = calculateLevel(newTotalPoints, config.avatar_levels);

      const { data, error } = await supabase
        .from('user_gamification')
        .update({
          total_points: newTotalPoints,
          current_level: newLevel,
          current_avatar: config.avatar_levels[newLevel - 1]?.avatar_url || config.avatar_levels[0].avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer l'ajustement admin
      await supabase
        .from('admin_point_adjustments')
        .insert({
          admin_id: profile.id,
          user_id: targetUserId,
          points_adjusted: points,
          reason,
          adjustment_type: adjustmentType,
          created_at: new Date().toISOString()
        });

      // Enregistrer l'événement
      await supabase
        .from('gamification_events')
        .insert({
          user_id: targetUserId,
          event_type: 'admin_points_adjustment',
          event_data: { 
            points: adjustmentType === 'add' ? points : -points, 
            reason,
            admin_id: profile.id
          },
          created_at: new Date().toISOString()
        });

      // Créer une notification
      await supabase
        .from('gamification_notifications')
        .insert({
          user_id: targetUserId,
          type: 'admin_adjustment',
          title: `Points ${adjustmentType === 'add' ? 'ajoutés' : 'soustraits'}`,
          message: `${adjustmentType === 'add' ? '+' : '-'}${points} points - ${reason}`,
          points: adjustmentType === 'add' ? points : -points,
          is_read: false,
          created_at: new Date().toISOString()
        });

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user_gamification'] });
      queryClient.invalidateQueries({ queryKey: ['gamification_leaderboard'] });
      
      toast({
        title: "Points ajustés !",
        description: `${variables.adjustmentType === 'add' ? '+' : '-'}${variables.points} points pour l'utilisateur`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Pénalité automatique pour absence de ventes quotidiennes
  const applyNoSalesPenalty = useMutation({
    mutationFn: async (userId: string) => {
      if (!config.admin_config.auto_penalty_no_sales) return null;

      const today = new Date().toISOString().split('T')[0];
      
      // Vérifier s'il y a eu des ventes aujourd'hui
      const { data: todaySales } = await supabase
        .from('sales')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', today)
        .limit(1);

      if (todaySales && todaySales.length > 0) return null; // Pas de pénalité si des ventes existent

      // Vérifier si la pénalité a déjà été appliquée aujourd'hui
      const { data: existingPenalty } = await supabase
        .from('gamification_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'no_sales_penalty')
        .gte('created_at', today)
        .single();

      if (existingPenalty) return null; // Pénalité déjà appliquée

      const penaltyPoints = Math.abs(config.penalties.no_sales_daily);

      // Appliquer la pénalité
      const { data: currentData } = await supabase
        .from('user_gamification')
        .select('total_points, current_level')
        .eq('user_id', userId)
        .single();

      if (!currentData) return null;

      const newTotalPoints = Math.max(0, currentData.total_points - penaltyPoints);
      const newLevel = calculateLevel(newTotalPoints, config.avatar_levels);

      const { data, error } = await supabase
        .from('user_gamification')
        .update({
          total_points: newTotalPoints,
          current_level: newLevel,
          current_avatar: config.avatar_levels[newLevel - 1]?.avatar_url || config.avatar_levels[0].avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer l'événement
      await supabase
        .from('gamification_events')
        .insert({
          user_id: userId,
          event_type: 'no_sales_penalty',
          event_data: { 
            points: -penaltyPoints, 
            reason: 'Aucune vente aujourd\'hui'
          },
          created_at: new Date().toISOString()
        });

      // Créer une notification
      await supabase
        .from('gamification_notifications')
        .insert({
          user_id: userId,
          type: 'no_sales_penalty',
          title: "Pénalité quotidienne",
          message: `-${penaltyPoints} points pour absence de ventes aujourd'hui`,
          points: -penaltyPoints,
          is_read: false,
          created_at: new Date().toISOString()
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_gamification'] });
      queryClient.invalidateQueries({ queryKey: ['gamification_leaderboard'] });
    }
  });

  // Vérifier et attribuer les badges managers
  const checkAndAwardManagerBadges = useCallback(async (userId: string, userRole: string) => {
    if (userRole !== 'manager') return; // Seuls les managers peuvent obtenir ces badges

    // Récupérer les statistiques de ventes du manager
    const { data: salesStats } = await supabase
      .from('sales')
      .select('id, total_amount')
      .eq('user_id', userId);

    if (!salesStats) return;

    const totalSales = salesStats.length;
    const totalAmount = salesStats.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

    // Vérifier les badges managers
    const managerBadges = config.badges.filter(badge => 
      badge.is_active && badge.is_manager_only && badge.manager_requirements
    );

    for (const badge of managerBadges) {
      if (!badge.manager_requirements) continue;

      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_type', badge.type)
        .single();

      if (existingBadge) continue; // Badge déjà obtenu

      // Vérifier les critères
      const meetsSalesCount = totalSales >= badge.manager_requirements.sales_count;
      const meetsTotalSales = totalAmount >= badge.manager_requirements.total_sales;

      if (meetsSalesCount && meetsTotalSales) {
        await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_type: badge.type,
            badge_name: badge.name,
            badge_description: badge.description,
            earned_at: new Date().toISOString(),
            is_active: true,
            is_manager_only: true
          });

        // Créer une notification
        await supabase
          .from('gamification_notifications')
          .insert({
            user_id: userId,
            type: 'badge',
            title: `Nouveau Badge Manager : ${badge.name}`,
            message: `Félicitations ! Vous avez gagné le badge manager ${badge.name}`,
            icon_url: badge.icon_url,
            is_read: false,
            created_at: new Date().toISOString()
          });
      }
    }
  }, [config.badges]);

  // Mettre à jour le statut de meilleur vendeur du mois
  const updateBestSellerStatus = useCallback(async (userId: string, month: string) => {
    // Vérifier si l'utilisateur est le meilleur vendeur du mois
    const { data: monthlyStats } = await supabase
      .from('user_monthly_stats')
      .select('*')
      .eq('month', month)
      .order('total_amount', { ascending: false })
      .limit(1)
      .single();

    if (monthlyStats && monthlyStats.user_id === userId) {
      // Mettre à jour le statut de meilleur vendeur
      await supabase
        .from('user_monthly_stats')
        .update({ is_best_seller: true })
        .eq('user_id', userId)
        .eq('month', month);

      // Mettre à jour le compteur consécutif
      const { data: userGamification } = await supabase
        .from('user_gamification')
        .select('consecutive_best_seller_count, last_best_seller_month')
        .eq('user_id', userId)
        .single();

      if (userGamification) {
        const lastMonth = userGamification.last_best_seller_month;
        const isConsecutive = lastMonth && isConsecutiveMonth(lastMonth, month);
        
        const newConsecutiveCount = isConsecutive 
          ? userGamification.consecutive_best_seller_count + 1 
          : 1;

        await supabase
          .from('user_gamification')
          .update({
            consecutive_best_seller_count: newConsecutiveCount,
            last_best_seller_month: month
          })
          .eq('user_id', userId);

        // Vérifier les trophées de consécutifs
        await checkConsecutiveTrophies(userId, newConsecutiveCount);
      }
    }
  }, []);

  // Vérifier les trophées de consécutifs
  const checkConsecutiveTrophies = useCallback(async (userId: string, consecutiveCount: number) => {
    const consecutiveTrophies = config.trophies.filter(trophy => 
      trophy.is_active && trophy.category === 'consecutive'
    );

    for (const trophy of consecutiveTrophies) {
      const criteria = trophy.criteria.find(c => c.type === 'best_seller_count');
      if (!criteria) continue;

      if (consecutiveCount >= criteria.value) {
        // Vérifier si le trophée a déjà été obtenu
        const { data: existingTrophy } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_name', trophy.name)
          .single();

        if (!existingTrophy) {
          // Attribuer le trophée
          await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_name: trophy.name,
              achievement_description: trophy.description,
              points_earned: trophy.points_reward,
              earned_at: new Date().toISOString(),
              is_active: true
            });

          // Ajouter les points
          await addPoints.mutateAsync({
            userId,
            points: trophy.points_reward,
            reason: `Trophée : ${trophy.name}`
          });

          // Créer une notification
          await supabase
            .from('gamification_notifications')
            .insert({
              user_id: userId,
              type: 'trophy',
              title: `Nouveau Trophée : ${trophy.name}`,
              message: `Félicitations ! Vous avez gagné le trophée ${trophy.name}`,
              icon_url: trophy.icon_url,
              points: trophy.points_reward,
              is_read: false,
              created_at: new Date().toISOString()
            });
        }
      }
    }
  }, [config.trophies, addPoints]);

  // Fonction utilitaire pour vérifier si deux mois sont consécutifs
  const isConsecutiveMonth = (month1: string, month2: string): boolean => {
    const [year1, month1Num] = month1.split('-').map(Number);
    const [year2, month2Num] = month2.split('-').map(Number);
    
    if (year1 === year2) {
      return month2Num === month1Num + 1;
    } else if (year2 === year1 + 1) {
      return month1Num === 12 && month2Num === 1;
    }
    return false;
  };

  return {
    // Données
    userGamification,
    leaderboard,
    notifications,
    config,
    stats,
    
    // États de chargement
    userLoading,
    leaderboardLoading,
    notificationsLoading,
    
    // Actions
    addPoints: addPoints.mutate,
    subtractPoints: subtractPoints.mutate,
    updateDailyGoals,
    markNotificationAsRead: markNotificationAsRead.mutate,
    
    // Utilitaires
    calculateLevel,
    checkAndAwardBadges,
    checkAndAwardTrophies,
    adminAdjustPoints: adminAdjustPoints.mutate,
    applyNoSalesPenalty: applyNoSalesPenalty.mutate,
    checkAndAwardManagerBadges,
    updateBestSellerStatus,
    checkConsecutiveTrophies
  };
}; 