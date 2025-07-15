import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from '@/hooks/use-toast';

// Types pour les analytics
interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    growthPercentage: number;
  };
  orders: {
    current: number;
    previous: number;
    completed: number;
    growth: number;
  };
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    growth: number;
  }>;
  storeMetrics: Array<{
    storeId: number;
    storeName: string;
    revenue: number;
    orders: number;
    growth: number;
  }>;
  userMetrics: Array<{
    userId: string;
    userName: string;
    revenue: number;
    orders: number;
    performance: number;
  }>;
  averageOrderValue: number;
  conversionRate: number;
  totalSales: number;
}

interface AnalyticsContext {
  role: string;
  storeIds: number[];
  storeCount: number;
  permissions: string[];
  isManager: boolean;
  isSeller: boolean;
  isAdmin: boolean;
}

interface RoleBasedMessages {
  title: string;
  description: string;
  subtitle: string;
  noDataMessage: string;
  exportMessage: string;
  refreshMessage: string;
}

// Messages adaptatifs selon les rôles
const getRoleBasedMessages = (role: string): RoleBasedMessages => {
  const messages = {
    admin: {
      title: 'Analytics Globaux',
      description: 'Vue d\'ensemble complète de vos performances système',
      subtitle: 'Analyse des performances globales et par magasin',
      noDataMessage: 'Aucune donnée de vente disponible pour cette période',
      exportMessage: 'Export des données globales en cours...',
      refreshMessage: 'Actualisation des métriques globales...'
    },
    manager: {
      title: 'Analytics Magasin',
      description: 'Performance de vos magasins assignés',
      subtitle: 'Analyse des performances par magasin et équipe',
      noDataMessage: 'Aucune donnée de vente disponible pour vos magasins',
      exportMessage: 'Export des données magasin en cours...',
      refreshMessage: 'Actualisation des métriques magasin...'
    },
    seller: {
      title: 'Mes Performances',
      description: 'Vos performances de vente personnelles',
      subtitle: 'Analyse de vos ventes et objectifs',
      noDataMessage: 'Aucune donnée de vente personnelle disponible',
      exportMessage: 'Export de vos données en cours...',
      refreshMessage: 'Actualisation de vos métriques...'
    }
  };

  return messages[role as keyof typeof messages] || messages.seller;
};

// Calcul des métriques de croissance
const calculateGrowth = (current: number, previous: number): { growth: number; percentage: number } => {
  if (previous === 0) {
    return { growth: current, percentage: current > 0 ? 100 : 0 };
  }
  const growth = current - previous;
  const percentage = (growth / previous) * 100;
  return { growth, percentage };
};

// Hook optimisé pour les analytics
export const useAnalyticsOptimized = () => {
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller } = useUserRoles();
  const queryClient = useQueryClient();
  
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedStore, setSelectedStore] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Contexte utilisateur optimisé
  const context: AnalyticsContext = useMemo(() => {
    const role = profile?.role || 'seller';
    const storeIds = profile?.store_ids || [];
    const storeCount = storeIds.length;
    
    return {
      role,
      storeIds,
      storeCount,
      permissions: profile?.permissions || [],
      isManager: role === 'manager',
      isSeller: role === 'seller',
      isAdmin: role === 'admin',
    };
  }, [profile]);

  // Messages adaptatifs
  const messages = useMemo(() => getRoleBasedMessages(context.role), [context.role]);

  // Déterminer les permissions selon le rôle
  const canViewAnalytics = isAdmin || isManager || isSeller;
  const canViewAllStores = isAdmin;
  const canViewUserMetrics = isAdmin || isManager;
  const canExportData = isAdmin || isManager;
  const canViewGrowthMetrics = isAdmin || isManager;

  // Calcul des dates selon la période
  const getDateRange = useCallback((period: string) => {
    const endDate = new Date();
    const startDate = new Date();
    const previousStartDate = new Date();
    
    switch (period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        previousStartDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        previousStartDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        previousStartDate.setDate(startDate.getDate() - 90);
        break;
      case '12months':
        startDate.setMonth(endDate.getMonth() - 12);
        previousStartDate.setMonth(startDate.getMonth() - 12);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
        previousStartDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate, previousStartDate };
  }, []);

  // Query optimisée avec cache intelligent
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', 'optimized', context.role, selectedPeriod, selectedStore],
    queryFn: async () => {
      if (!canViewAnalytics) {
        throw new Error('Accès non autorisé aux analytics');
      }

      const { startDate, endDate, previousStartDate } = getDateRange(selectedPeriod);

      // Requête pour la période actuelle
      let currentQuery = supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            products (name, category_id)
          ),
          stores (name),
          profiles (name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Requête pour la période précédente (pour calculer la croissance)
      let previousQuery = supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            quantity,
            unit_price,
            total_price
          )
        `)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Filtrage selon les permissions
      if (!canViewAllStores) {
        currentQuery = currentQuery.in('store_id', context.storeIds);
        previousQuery = previousQuery.in('store_id', context.storeIds);
      }

      if (selectedStore !== 'all') {
        currentQuery = currentQuery.eq('store_id', parseInt(selectedStore));
        previousQuery = previousQuery.eq('store_id', parseInt(selectedStore));
      }

      // Filtrage par utilisateur pour les sellers
      if (isSeller) {
        currentQuery = currentQuery.eq('seller_id', profile?.id);
        previousQuery = previousQuery.eq('seller_id', profile?.id);
      }

      const [currentResult, previousResult] = await Promise.all([
        currentQuery,
        previousQuery
      ]);

      if (currentResult.error) throw currentResult.error;
      if (previousResult.error) throw previousResult.error;

      const currentSales = currentResult.data || [];
      const previousSales = previousResult.data || [];

      // Calcul des métriques actuelles
      const currentRevenue = currentSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const currentOrders = currentSales.length;
      const currentCompleted = currentSales.filter(sale => sale.status === 'completed').length;

      // Calcul des métriques précédentes
      const previousRevenue = previousSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const previousOrders = previousSales.length;

      // Calcul de la croissance
      const revenueGrowth = calculateGrowth(currentRevenue, previousRevenue);
      const ordersGrowth = calculateGrowth(currentOrders, previousOrders);

      // Calcul des produits populaires
      const productSales: { [key: string]: any } = {};
      currentSales.forEach(sale => {
        sale.sale_items?.forEach(item => {
          const productName = item.products?.name || 'Produit inconnu';
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += item.total_price || 0;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Métriques par magasin (pour admin et manager)
      const storeMetrics = canViewAllStores ? 
        Object.values(currentSales.reduce((acc, sale) => {
          const storeId = sale.store_id;
          const storeName = sale.stores?.name || 'Magasin inconnu';
          
          if (!acc[storeId]) {
            acc[storeId] = {
              storeId,
              storeName,
              revenue: 0,
              orders: 0,
              growth: 0
            };
          }
          
          acc[storeId].revenue += sale.total || 0;
          acc[storeId].orders += 1;
          
          return acc;
        }, {} as any)) : [];

      // Métriques par utilisateur (pour admin et manager)
      const userMetrics = canViewUserMetrics ?
        Object.values(currentSales.reduce((acc, sale) => {
          const userId = sale.seller_id;
          const userName = sale.profiles?.name || 'Utilisateur inconnu';
          
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              userName,
              revenue: 0,
              orders: 0,
              performance: 0
            };
          }
          
          acc[userId].revenue += sale.total || 0;
          acc[userId].orders += 1;
          
          return acc;
        }, {} as any)) : [];

      // Calcul des performances utilisateur
      userMetrics.forEach(user => {
        user.performance = user.orders > 0 ? user.revenue / user.orders : 0;
      });

      const analyticsData: AnalyticsData = {
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: revenueGrowth.growth,
          growthPercentage: revenueGrowth.percentage
        },
        orders: {
          current: currentOrders,
          previous: previousOrders,
          completed: currentCompleted,
          growth: ordersGrowth.growth
        },
        topProducts,
        storeMetrics,
        userMetrics,
        averageOrderValue: currentOrders > 0 ? currentRevenue / currentOrders : 0,
        conversionRate: currentOrders > 0 ? (currentCompleted / currentOrders) * 100 : 0,
        totalSales: currentCompleted
      };

      return analyticsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: canViewAnalytics,
  });

  // Fonction d'export adaptative
  const exportAnalytics = useCallback(async () => {
    if (!canExportData) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour exporter les données.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Simulation d'export (à implémenter)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Export réussi",
        description: messages.exportMessage,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [canExportData, messages.exportMessage]);

  // Fonction de rafraîchissement
  const refreshData = useCallback(async () => {
    toast({
      title: "Actualisation",
      description: messages.refreshMessage,
    });
    await refetch();
  }, [refetch, messages.refreshMessage]);

  // Formatage des devises
  const formatCurrency = useCallback((amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0 XOF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  // Formatage des pourcentages
  const formatPercentage = useCallback((value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }, []);

  return {
    // Données
    analyticsData,
    isLoading,
    error,
    
    // État
    selectedPeriod,
    setSelectedPeriod,
    selectedStore,
    setSelectedStore,
    isExporting,
    
    // Contexte utilisateur
    context,
    messages,
    
    // Permissions
    canViewAnalytics,
    canViewAllStores,
    canViewUserMetrics,
    canExportData,
    canViewGrowthMetrics,
    
    // Actions
    exportAnalytics,
    refreshData,
    
    // Utilitaires
    formatCurrency,
    formatPercentage,
    getDateRange
  };
}; 