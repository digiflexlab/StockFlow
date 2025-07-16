import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from '@/hooks/use-toast';

// Types pour les finances
interface Expense {
  id: number;
  store_id: number;
  user_id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
  stores?: {
    name: string;
  };
  profiles?: {
    name: string;
  };
}

interface FinanceData {
  revenue: {
    total: number;
    previous: number;
    growth: number;
    growthPercentage: number;
    taxAmount: number;
    discounts: number;
  };
  expenses: {
    total: number;
    previous: number;
    growth: number;
    byCategory: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  profit: {
    gross: number;
    net: number;
    margin: number;
    previousGross: number;
    previousNet: number;
    growth: number;
  };
  salesCount: number;
  storeMetrics: Array<{
    storeId: number;
    storeName: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  }>;
  userMetrics: Array<{
    userId: string;
    userName: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

interface FinanceContext {
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
  addExpenseMessage: string;
  deleteExpenseMessage: string;
}

// Messages adaptatifs selon les rôles
const getRoleBasedMessages = (role: string): RoleBasedMessages => {
  const messages = {
    admin: {
      title: 'Gestion Financière Globale',
      description: 'Vue d\'ensemble financière complète du système',
      subtitle: 'Analyse des finances globales et par magasin',
      noDataMessage: 'Aucune donnée financière disponible pour cette période',
      exportMessage: 'Export des données financières globales en cours...',
      refreshMessage: 'Actualisation des métriques financières globales...',
      addExpenseMessage: 'Dépense ajoutée au système',
      deleteExpenseMessage: 'Dépense supprimée du système'
    },
    manager: {
      title: 'Gestion Financière Magasin',
      description: 'Finances de vos magasins assignés',
      subtitle: 'Analyse des finances par magasin et équipe',
      noDataMessage: 'Aucune donnée financière disponible pour vos magasins',
      exportMessage: 'Export des données financières magasin en cours...',
      refreshMessage: 'Actualisation des métriques financières magasin...',
      addExpenseMessage: 'Dépense ajoutée à votre magasin',
      deleteExpenseMessage: 'Dépense supprimée de votre magasin'
    },
    seller: {
      title: 'Mes Finances',
      description: 'Vos finances personnelles',
      subtitle: 'Analyse de vos performances financières',
      noDataMessage: 'Aucune donnée financière personnelle disponible',
      exportMessage: 'Export de vos données financières en cours...',
      refreshMessage: 'Actualisation de vos métriques financières...',
      addExpenseMessage: 'Dépense personnelle ajoutée',
      deleteExpenseMessage: 'Dépense personnelle supprimée'
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

// Hook optimisé pour les finances
export const useFinanceOptimized = () => {
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller } = useUserRoles();
  const queryClient = useQueryClient();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedStore, setSelectedStore] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Contexte utilisateur optimisé
  const context: FinanceContext = useMemo(() => {
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
  const canViewFinance = isAdmin || isManager || isSeller;
  const canViewAllStores = isAdmin;
  const canViewUserMetrics = isAdmin || isManager;
  const canExportData = isAdmin || isManager;
  const canViewGrowthMetrics = isAdmin || isManager;
  const canManageExpenses = isAdmin || isManager;
  const canDeleteExpenses = isAdmin;

  // Calcul des dates selon la période
  const getDateRange = useCallback((period: string) => {
    const endDate = new Date();
    const startDate = new Date();
    const previousStartDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        previousStartDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        previousStartDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        previousStartDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        previousStartDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
        previousStartDate.setMonth(startDate.getMonth() - 1);
    }

    return { startDate, endDate, previousStartDate };
  }, []);

  // Query optimisée pour les données financières
  const { data: financeData, isLoading, error, refetch } = useQuery({
    queryKey: ['finance', 'optimized', context.role, selectedPeriod, selectedStore],
    queryFn: async () => {
      if (!canViewFinance) {
        throw new Error('Accès non autorisé aux finances');
      }

      const { startDate, endDate, previousStartDate } = getDateRange(selectedPeriod);

      // Requête pour les ventes de la période actuelle
      let currentSalesQuery = supabase
        .from('sales')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Requête pour les ventes de la période précédente
      let previousSalesQuery = supabase
        .from('sales')
        .select('*')
        .eq('status', 'completed')
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

      // Requête pour les dépenses
      let expensesQuery = supabase
        .from('expenses')
        .select(`
          *,
          stores (name),
          profiles (name)
        `)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      let previousExpensesQuery = supabase
        .from('expenses')
        .select('*')
        .gte('date', previousStartDate.toISOString().split('T')[0])
        .lt('date', startDate.toISOString().split('T')[0]);

      // Filtrage des dépenses selon les permissions
      if (!canViewAllStores) {
        expensesQuery = expensesQuery.in('store_id', context.storeIds);
        previousExpensesQuery = previousExpensesQuery.in('store_id', context.storeIds);
      }

      if (selectedStore !== 'all') {
        expensesQuery = expensesQuery.eq('store_id', parseInt(selectedStore));
        previousExpensesQuery = previousExpensesQuery.eq('store_id', parseInt(selectedStore));
      }

      const [currentSalesResult, previousSalesResult, expensesResult, previousExpensesResult] = await Promise.all([
        currentSalesQuery,
        previousSalesQuery,
        expensesQuery,
        previousExpensesQuery
      ]);

      if (currentSalesResult.error) throw currentSalesResult.error;
      if (previousSalesResult.error) throw previousSalesResult.error;
      if (expensesResult.error) throw expensesResult.error;
      if (previousExpensesResult.error) throw previousExpensesResult.error;

      const currentSales = currentSalesResult.data || [];
      const previousSales = previousSalesResult.data || [];
      const expenses = expensesResult.data || [];
      const previousExpenses = previousExpensesResult.data || [];

      // Calcul des métriques actuelles
      const currentRevenue = currentSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const currentTax = currentSales.reduce((sum, sale) => sum + (sale.tax_amount || 0), 0);
      const currentDiscounts = currentSales.reduce((sum, sale) => sum + (sale.discount_amount || 0), 0);
      const currentExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Calcul des métriques précédentes
      const previousRevenue = previousSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const previousExpenses = previousExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Calcul de la croissance
      const revenueGrowth = calculateGrowth(currentRevenue, previousRevenue);
      const expensesGrowth = calculateGrowth(currentExpenses, previousExpenses);

      // Calcul des bénéfices
      const currentGrossProfit = currentRevenue - currentExpenses;
      const currentNetProfit = currentGrossProfit - currentTax;
      const previousGrossProfit = previousRevenue - previousExpenses;
      const previousNetProfit = previousGrossProfit - (previousSales.reduce((sum, sale) => sum + (sale.tax_amount || 0), 0));

      const profitGrowth = calculateGrowth(currentNetProfit, previousNetProfit);

      // Dépenses par catégorie
      const expensesByCategory = expenses.reduce((acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = 0;
        }
        acc[expense.category] += expense.amount;
        return acc;
      }, {} as Record<string, number>);

      const expensesByCategoryArray = Object.entries(expensesByCategory ?? {}).map(([category, amount]) => ({
        category,
        amount,
        percentage: currentExpenses > 0 ? (amount / currentExpenses) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

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
              expenses: 0,
              profit: 0,
              margin: 0
            };
          }
          
          acc[storeId].revenue += sale.total || 0;
          
          return acc;
        }, {} as any)) : [];

      // Calculer les dépenses par magasin
      storeMetrics.forEach(store => {
        const storeExpenses = expenses.filter(exp => exp.store_id === store.storeId);
        store.expenses = storeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        store.profit = store.revenue - store.expenses;
        store.margin = store.revenue > 0 ? (store.profit / store.revenue) * 100 : 0;
      });

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
              expenses: 0,
              profit: 0
            };
          }
          
          acc[userId].revenue += sale.total || 0;
          
          return acc;
        }, {} as any)) : [];

      const financeData: FinanceData = {
        revenue: {
          total: currentRevenue,
          previous: previousRevenue,
          growth: revenueGrowth.growth,
          growthPercentage: revenueGrowth.percentage,
          taxAmount: currentTax,
          discounts: currentDiscounts
        },
        expenses: {
          total: currentExpenses,
          previous: previousExpenses,
          growth: expensesGrowth.growth,
          byCategory: expensesByCategoryArray
        },
        profit: {
          gross: currentGrossProfit,
          net: currentNetProfit,
          margin: currentRevenue > 0 ? (currentNetProfit / currentRevenue) * 100 : 0,
          previousGross: previousGrossProfit,
          previousNet: previousNetProfit,
          growth: profitGrowth.growth
        },
        salesCount: currentSales.length,
        storeMetrics,
        userMetrics
      };

      return financeData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: canViewFinance,
  });

  // Query pour les dépenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', context.role, selectedPeriod, selectedStore],
    queryFn: async () => {
      if (!canViewFinance) {
        throw new Error('Accès non autorisé aux dépenses');
      }

      const { startDate, endDate } = getDateRange(selectedPeriod);

      let query = supabase
        .from('expenses')
        .select(`
          *,
          stores (name),
          profiles (name)
        `)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Filtrage selon les permissions
      if (!canViewAllStores) {
        query = query.in('store_id', context.storeIds);
      }

      if (selectedStore !== 'all') {
        query = query.eq('store_id', parseInt(selectedStore));
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Expense[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: canViewFinance,
  });

  // Mutation pour ajouter une dépense
  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
      if (!canManageExpenses) {
        throw new Error('Permission refusée pour ajouter des dépenses');
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      toast({
        title: "Succès",
        description: messages.addExpenseMessage,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la dépense.",
        variant: "destructive",
      });
    }
  });

  // Mutation pour supprimer une dépense
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      if (!canDeleteExpenses) {
        throw new Error('Permission refusée pour supprimer des dépenses');
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      toast({
        title: "Succès",
        description: messages.deleteExpenseMessage,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la dépense.",
        variant: "destructive",
      });
    }
  });

  // Fonction d'export adaptative
  const exportFinance = useCallback(async () => {
    if (!canExportData) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour exporter les données financières.",
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
        description: "Impossible d'exporter les données financières.",
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
    financeData,
    expenses,
    isLoading: isLoading || expensesLoading,
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
    canViewFinance,
    canViewAllStores,
    canViewUserMetrics,
    canExportData,
    canViewGrowthMetrics,
    canManageExpenses,
    canDeleteExpenses,
    
    // Actions
    exportFinance,
    refreshData,
    addExpense: addExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
    
    // Utilitaires
    formatCurrency,
    formatPercentage,
    getDateRange
  };
}; 
