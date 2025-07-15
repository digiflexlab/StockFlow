import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from '@/hooks/use-toast';

// Types pour les rapports
interface ProductReport {
  name: string;
  sales: number;
  revenue: number;
  category?: string;
  margin?: number;
  growth?: number;
}

interface SellerReport {
  name: string;
  sales: number;
  revenue: number;
  averageOrderValue: number;
  growth?: number;
  target?: number;
  performance?: number;
}

interface StoreReport {
  storeId: number;
  storeName: string;
  sales: number;
  revenue: number;
  averageOrderValue: number;
  growth?: number;
  performance?: number;
}

interface OverviewReport {
  revenue: {
    total: number;
    previous: number;
    growth: number;
    growthPercentage: number;
  };
  transactions: {
    total: number;
    completed: number;
    cancelled: number;
    growth: number;
  };
  averageOrderValue: {
    current: number;
    previous: number;
    growth: number;
  };
  topProducts: ProductReport[];
  topSellers: SellerReport[];
  storePerformance: StoreReport[];
}

interface GrowthReport {
  period: string;
  revenue: number;
  transactions: number;
  growth: {
    revenue: number;
    transactions: number;
  };
  trends: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

interface ReportsData {
  overview: OverviewReport;
  products: ProductReport[];
  sellers: SellerReport[];
  stores: StoreReport[];
  growth: GrowthReport;
  userMetrics?: {
    personalSales: number;
    personalRevenue: number;
    target: number;
    performance: number;
  };
}

interface ReportsContext {
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
  noAccessMessage: string;
}

// Messages adaptatifs selon les rôles
const getRoleBasedMessages = (role: string): RoleBasedMessages => {
  const messages = {
    admin: {
      title: 'Rapports Globaux',
      description: 'Vue d\'ensemble complète du système',
      subtitle: 'Analyse des performances globales et par magasin',
      noDataMessage: 'Aucune donnée disponible pour cette période',
      exportMessage: 'Export des rapports globaux en cours...',
      refreshMessage: 'Actualisation des rapports globaux...',
      noAccessMessage: 'Accès non autorisé aux rapports'
    },
    manager: {
      title: 'Rapports Magasin',
      description: 'Rapports de vos magasins assignés',
      subtitle: 'Analyse des performances par magasin et équipe',
      noDataMessage: 'Aucune donnée disponible pour vos magasins',
      exportMessage: 'Export des rapports magasin en cours...',
      refreshMessage: 'Actualisation des rapports magasin...',
      noAccessMessage: 'Accès non autorisé aux rapports'
    },
    seller: {
      title: 'Mes Rapports',
      description: 'Vos rapports personnels',
      subtitle: 'Analyse de vos performances individuelles',
      noDataMessage: 'Aucune donnée personnelle disponible',
      exportMessage: 'Export de vos rapports en cours...',
      refreshMessage: 'Actualisation de vos rapports...',
      noAccessMessage: 'Accès non autorisé aux rapports'
    }
  };

  return messages[role as keyof typeof messages] || messages.seller;
};

// Types de rapports adaptatifs selon les rôles
const getRoleBasedReportTypes = (role: string) => {
  const baseTypes = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: 'BarChart3', roles: ['admin', 'manager', 'seller'] },
    { id: 'products', label: 'Performances produits', icon: 'Package', roles: ['admin', 'manager'] },
    { id: 'sellers', label: 'Performance vendeurs', icon: 'Users', roles: ['admin', 'manager'] },
  ];

  if (role === 'admin') {
    baseTypes.push(
      { id: 'stores', label: 'Performance magasins', icon: 'Building2', roles: ['admin'] },
      { id: 'growth', label: 'Croissance & tendances', icon: 'TrendingUp', roles: ['admin'] },
      { id: 'comparison', label: 'Comparaisons', icon: 'BarChart3', roles: ['admin'] }
    );
  }

  if (role === 'manager') {
    baseTypes.push(
      { id: 'team', label: 'Performance équipe', icon: 'Users', roles: ['manager'] },
      { id: 'growth', label: 'Croissance magasin', icon: 'TrendingUp', roles: ['manager'] }
    );
  }

  if (role === 'seller') {
    baseTypes.push(
      { id: 'personal', label: 'Mes performances', icon: 'Target', roles: ['seller'] },
      { id: 'goals', label: 'Mes objectifs', icon: 'Flag', roles: ['seller'] }
    );
  }

  return baseTypes.filter(type => type.roles.includes(role));
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

// Hook optimisé pour les rapports
export const useReportsOptimized = () => {
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller } = useUserRoles();
  const queryClient = useQueryClient();
  
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [selectedStore, setSelectedStore] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Contexte utilisateur optimisé
  const context: ReportsContext = useMemo(() => {
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

  // Types de rapports adaptatifs
  const reportTypes = useMemo(() => getRoleBasedReportTypes(context.role), [context.role]);

  // Déterminer les permissions selon le rôle
  const canViewReports = isAdmin || isManager || isSeller;
  const canViewAllStores = isAdmin;
  const canViewUserMetrics = isAdmin || isManager;
  const canExportData = isAdmin || isManager;
  const canViewGrowthMetrics = isAdmin || isManager;
  const canViewStoreMetrics = isAdmin || isManager;
  const canViewPersonalMetrics = isSeller;

  // Calcul des dates selon la période
  const getDateRange = useCallback((period: string) => {
    const endDate = new Date();
    const startDate = new Date();
    const previousStartDate = new Date();
    
    switch (period) {
      case '1month':
        startDate.setMonth(endDate.getMonth() - 1);
        previousStartDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(endDate.getMonth() - 3);
        previousStartDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(endDate.getMonth() - 6);
        previousStartDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        previousStartDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 6);
        previousStartDate.setMonth(startDate.getMonth() - 6);
    }

    return { startDate, endDate, previousStartDate };
  }, []);

  // Query optimisée pour les données de rapports
  const { data: reportsData, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'optimized', context.role, selectedPeriod, selectedReport, selectedStore],
    queryFn: async () => {
      if (!canViewReports) {
        throw new Error('Accès non autorisé aux rapports');
      }

      const { startDate, endDate, previousStartDate } = getDateRange(selectedPeriod);

      // Requête pour les ventes de la période actuelle
      let currentSalesQuery = supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            products (name, category_id)
          ),
          profiles!sales_seller_id_fkey (name),
          stores (name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Requête pour les ventes de la période précédente
      let previousSalesQuery = supabase
        .from('sales')
        .select('*')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Filtrage selon les permissions
      if (!canViewAllStores) {
        currentSalesQuery = currentSalesQuery.in('store_id', context.storeIds);
        previousSalesQuery = previousSalesQuery.in('store_id', context.storeIds);
      }

      if (selectedStore !== 'all') {
        currentSalesQuery = currentSalesQuery.eq('store_id', parseInt(selectedStore));
        previousSalesQuery = previousSalesQuery.eq('store_id', parseInt(selectedStore));
      }

      // Filtrage par utilisateur pour les sellers
      if (isSeller) {
        currentSalesQuery = currentSalesQuery.eq('seller_id', profile?.id);
        previousSalesQuery = previousSalesQuery.eq('seller_id', profile?.id);
      }

      const [currentSalesResult, previousSalesResult] = await Promise.all([
        currentSalesQuery,
        previousSalesQuery
      ]);

      if (currentSalesResult.error) throw currentSalesResult.error;
      if (previousSalesResult.error) throw previousSalesResult.error;

      const currentSales = currentSalesResult.data || [];
      const previousSales = previousSalesResult.data || [];

      // Calcul des métriques actuelles
      const currentRevenue = currentSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const currentTransactions = currentSales.length;
      const currentCompletedSales = currentSales.filter(sale => sale.status === 'completed').length;
      const currentAverageOrderValue = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;

      // Calcul des métriques précédentes
      const previousRevenue = previousSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const previousTransactions = previousSales.length;
      const previousCompletedSales = previousSales.filter(sale => sale.status === 'completed').length;
      const previousAverageOrderValue = previousTransactions > 0 ? previousRevenue / previousTransactions : 0;

      // Calcul de la croissance
      const revenueGrowth = calculateGrowth(currentRevenue, previousRevenue);
      const transactionsGrowth = calculateGrowth(currentTransactions, previousTransactions);
      const averageOrderValueGrowth = calculateGrowth(currentAverageOrderValue, previousAverageOrderValue);

      // Top produits
      const productSales: { [key: string]: ProductReport } = {};
      currentSales.forEach(sale => {
        sale.sale_items?.forEach(item => {
          const productName = item.products?.name || 'Produit inconnu';
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              sales: 0,
              revenue: 0,
              category: item.products?.category_id?.toString()
            };
          }
          productSales[productName].sales += item.quantity;
          productSales[productName].revenue += item.total_price || 0;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Top vendeurs
      const sellerPerformance: { [key: string]: SellerReport } = {};
      currentSales.forEach(sale => {
        const sellerName = sale.profiles?.name || 'Vendeur inconnu';
        if (!sellerPerformance[sellerName]) {
          sellerPerformance[sellerName] = {
            name: sellerName,
            sales: 0,
            revenue: 0,
            averageOrderValue: 0
          };
        }
        sellerPerformance[sellerName].sales += 1;
        sellerPerformance[sellerName].revenue += sale.total || 0;
      });

      // Calculer le panier moyen par vendeur
      Object.values(sellerPerformance).forEach(seller => {
        seller.averageOrderValue = seller.sales > 0 ? seller.revenue / seller.sales : 0;
      });

      const topSellers = Object.values(sellerPerformance)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Performance par magasin (pour admin et manager)
      const storePerformance: { [key: number]: StoreReport } = {};
      if (canViewStoreMetrics) {
        currentSales.forEach(sale => {
          const storeId = sale.store_id;
          const storeName = sale.stores?.name || 'Magasin inconnu';
          
          if (!storePerformance[storeId]) {
            storePerformance[storeId] = {
              storeId,
              storeName,
              sales: 0,
              revenue: 0,
              averageOrderValue: 0
            };
          }
          
          storePerformance[storeId].sales += 1;
          storePerformance[storeId].revenue += sale.total || 0;
        });

        // Calculer le panier moyen par magasin
        Object.values(storePerformance).forEach(store => {
          store.averageOrderValue = store.sales > 0 ? store.revenue / store.sales : 0;
        });
      }

      const stores = Object.values(storePerformance);

      // Métriques personnelles pour les sellers
      let userMetrics = undefined;
      if (canViewPersonalMetrics) {
        const personalSales = currentSales.length;
        const personalRevenue = currentRevenue;
        const target = 100000; // Objectif fictif
        const performance = target > 0 ? (personalRevenue / target) * 100 : 0;

        userMetrics = {
          personalSales,
          personalRevenue,
          target,
          performance
        };
      }

      // Rapport de croissance
      const growthReport: GrowthReport = {
        period: selectedPeriod,
        revenue: currentRevenue,
        transactions: currentTransactions,
        growth: {
          revenue: revenueGrowth.growth,
          transactions: transactionsGrowth.growth
        },
        trends: [] // À implémenter avec des données temporelles
      };

      const reportsData: ReportsData = {
        overview: {
          revenue: {
            total: currentRevenue,
            previous: previousRevenue,
            growth: revenueGrowth.growth,
            growthPercentage: revenueGrowth.percentage
          },
          transactions: {
            total: currentTransactions,
            completed: currentCompletedSales,
            cancelled: currentTransactions - currentCompletedSales,
            growth: transactionsGrowth.growth
          },
          averageOrderValue: {
            current: currentAverageOrderValue,
            previous: previousAverageOrderValue,
            growth: averageOrderValueGrowth.growth
          },
          topProducts,
          topSellers,
          storePerformance: stores
        },
        products: topProducts,
        sellers: topSellers,
        stores,
        growth: growthReport,
        userMetrics
      };

      return reportsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: canViewReports,
  });

  // Fonction d'export adaptative
  const exportReport = useCallback(async (format: string) => {
    if (!canExportData) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour exporter les rapports.",
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
        description: "Impossible d'exporter les rapports.",
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

  // Périodes disponibles
  const periods = [
    { id: '1month', label: 'Dernier mois' },
    { id: '3months', label: '3 derniers mois' },
    { id: '6months', label: '6 derniers mois' },
    { id: '1year', label: 'Dernière année' }
  ];

  return {
    // Données
    reportsData,
    isLoading,
    error,
    
    // État
    selectedPeriod,
    setSelectedPeriod,
    selectedReport,
    setSelectedReport,
    selectedStore,
    setSelectedStore,
    isExporting,
    
    // Contexte utilisateur
    context,
    messages,
    reportTypes,
    periods,
    
    // Permissions
    canViewReports,
    canViewAllStores,
    canViewUserMetrics,
    canExportData,
    canViewGrowthMetrics,
    canViewStoreMetrics,
    canViewPersonalMetrics,
    
    // Actions
    exportReport,
    refreshData,
    
    // Utilitaires
    formatCurrency,
    formatPercentage,
    getDateRange
  };
}; 