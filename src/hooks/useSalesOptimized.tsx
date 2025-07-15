import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStores } from './useStores';
import { toast } from './use-toast';
import type { Sale, CreateSaleData } from '@/types/sales';

// Types pour l'adaptation automatique
interface RoleSpecificContent {
  title: string;
  subtitle: string;
  quickActions: string[];
  stats: Array<{
    icon: any;
    value: string | number;
    label: string;
    color: string;
  }>;
  filters: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
}

interface SalesContext {
  role: string;
  storeIds: number[];
  storeCount: number;
  permissions: string[];
  isManager: boolean;
  isSeller: boolean;
  isAdmin: boolean;
}

export const useSalesOptimized = () => {
  const { profile } = useAuth();
  const { stores } = useStores();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Contexte utilisateur optimisé
  const context: SalesContext = useMemo(() => {
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

  // Contenu adaptatif selon le rôle
  const roleContent: RoleSpecificContent = useMemo(() => {
    const { role, storeCount } = context;
    
    switch (role) {
      case 'seller':
        return {
          title: `Vos ventes (${storeCount} magasin${storeCount > 1 ? 's' : ''})`,
          subtitle: 'Gérez vos ventes quotidiennes et accédez rapidement à vos outils',
          quickActions: ['Nouvelle vente', 'Caisse', 'Produits populaires', 'Historique'],
          stats: [
            { icon: 'ShoppingCart', value: 0, label: 'Ventes aujourd\'hui', color: 'text-blue-600' },
            { icon: 'DollarSign', value: '0 CFA', label: 'CA du jour', color: 'text-green-600' },
            { icon: 'TrendingUp', value: 0, label: 'Ventes du mois', color: 'text-purple-600' },
            { icon: 'Package', value: '0 CFA', label: 'Panier moyen', color: 'text-orange-600' }
          ],
          filters: [
            {
              key: 'period',
              label: 'Période',
              options: [
                { value: 'today', label: 'Aujourd\'hui' },
                { value: 'week', label: 'Cette semaine' },
                { value: 'month', label: 'Ce mois' },
                { value: '30d', label: '30 derniers jours' }
              ]
            },
            {
              key: 'status',
              label: 'Statut',
              options: [
                { value: 'all', label: 'Tous' },
                { value: 'completed', label: 'Terminées' },
                { value: 'pending', label: 'En attente' }
              ]
            }
          ]
        };

      case 'manager':
        return {
          title: `Gestion des ventes - ${storeCount} magasin${storeCount > 1 ? 's' : ''}`,
          subtitle: 'Supervisez les performances de votre équipe et analysez les tendances',
          quickActions: ['Nouvelle vente', 'Rapports', 'Équipe', 'Objectifs'],
          stats: [
            { icon: 'Users', value: 0, label: 'Vendeurs actifs', color: 'text-blue-600' },
            { icon: 'DollarSign', value: '0 CFA', label: 'CA total', color: 'text-green-600' },
            { icon: 'TrendingUp', value: 0, label: 'Ventes équipe', color: 'text-purple-600' },
            { icon: 'Target', value: '0%', label: 'Objectif atteint', color: 'text-orange-600' }
          ],
          filters: [
            {
              key: 'seller',
              label: 'Vendeur',
              options: [
                { value: 'all', label: 'Tous les vendeurs' },
                { value: 'team', label: 'Mon équipe' }
              ]
            },
            {
              key: 'period',
              label: 'Période',
              options: [
                { value: 'week', label: 'Cette semaine' },
                { value: 'month', label: 'Ce mois' },
                { value: 'quarter', label: 'Ce trimestre' },
                { value: 'year', label: 'Cette année' }
              ]
            }
          ]
        };

      case 'admin':
        return {
          title: 'Gestion globale des ventes',
          subtitle: 'Vue d\'ensemble de toutes les ventes du système et configuration',
          quickActions: ['Nouvelle vente', 'Configuration', 'Rapports globaux', 'Audit'],
          stats: [
            { icon: 'Store', value: 0, label: 'Magasins actifs', color: 'text-blue-600' },
            { icon: 'DollarSign', value: '0 CFA', label: 'CA global', color: 'text-green-600' },
            { icon: 'Users', value: 0, label: 'Vendeurs total', color: 'text-purple-600' },
            { icon: 'TrendingUp', value: '0%', label: 'Croissance', color: 'text-orange-600' }
          ],
          filters: [
            {
              key: 'store',
              label: 'Magasin',
              options: [
                { value: 'all', label: 'Tous les magasins' },
                ...stores.map(store => ({ value: store.id.toString(), label: store.name }))
              ]
            },
            {
              key: 'period',
              label: 'Période',
              options: [
                { value: 'month', label: 'Ce mois' },
                { value: 'quarter', label: 'Ce trimestre' },
                { value: 'year', label: 'Cette année' },
                { value: 'custom', label: 'Personnalisé' }
              ]
            }
          ]
        };

      default:
        return {
          title: 'Gestion des ventes',
          subtitle: 'Accédez à vos ventes',
          quickActions: ['Nouvelle vente'],
          stats: [],
          filters: []
        };
    }
  }, [context, stores]);

  // Requête optimisée selon le rôle
  const getOptimizedSalesQuery = useCallback(() => {
    let query = supabase
      .from('sales')
      .select(`
        *,
        stores(name),
        profiles(name),
        sale_items(count)
      `);

    const { role, storeIds } = context;

    // Filtrage selon le rôle
    if (role === 'seller') {
      // Vendeurs: seulement leurs ventes récentes avec limite
      query = query
        .in('store_id', storeIds)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);
    } else if (role === 'manager') {
      // Managers: ventes de leurs magasins avec plus de détails
      query = query
        .in('store_id', storeIds)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    }
    // Admin: toutes les ventes (pas de filtre)

    // Filtres supplémentaires
    if (selectedStore !== 'all') {
      query = query.eq('store_id', parseInt(selectedStore));
    }

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus);
    }

    // Filtre de période
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    query = query.gte('created_at', startDate.toISOString());

    return query.order('created_at', { ascending: false });
  }, [context, selectedStore, selectedStatus, selectedPeriod]);

  // Requête principale avec cache optimisé
  const {
    data: sales = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['sales-optimized', context.role, context.storeIds, selectedStore, selectedStatus, selectedPeriod, page],
    queryFn: async () => {
      const query = getOptimizedSalesQuery();
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Sale[];
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    gcTime: 10 * 60 * 1000, // Garde en cache 10 minutes
    enabled: !!profile,
  });

  // Statistiques calculées en temps réel
  const calculatedStats = useMemo(() => {
    const filteredSales = sales.filter(sale => {
      const matchesSearch = 
        sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const completedSales = filteredSales.filter(sale => sale.status === 'completed').length;
    const averageCart = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculs spécifiques par rôle
    const { role } = context;
    
    if (role === 'seller') {
      const today = new Date().toDateString();
      const todaySales = filteredSales.filter(sale => 
        new Date(sale.created_at).toDateString() === today
      );
      const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
      
      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();
      const monthSales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
      });

      return [
        { icon: 'ShoppingCart', value: todaySales.length, label: 'Ventes aujourd\'hui', color: 'text-blue-600' },
        { icon: 'DollarSign', value: `${todayRevenue.toLocaleString()} CFA`, label: 'CA du jour', color: 'text-green-600' },
        { icon: 'TrendingUp', value: monthSales.length, label: 'Ventes du mois', color: 'text-purple-600' },
        { icon: 'Package', value: `${averageCart.toLocaleString()} CFA`, label: 'Panier moyen', color: 'text-orange-600' }
      ];
    }

    if (role === 'manager') {
      const activeSellers = new Set(filteredSales.map(sale => sale.seller_id)).size;
      const teamSales = filteredSales.length;
      const targetAchievement = 85; // À calculer selon les objectifs

      return [
        { icon: 'Users', value: activeSellers, label: 'Vendeurs actifs', color: 'text-blue-600' },
        { icon: 'DollarSign', value: `${totalRevenue.toLocaleString()} CFA`, label: 'CA total', color: 'text-green-600' },
        { icon: 'TrendingUp', value: teamSales, label: 'Ventes équipe', color: 'text-purple-600' },
        { icon: 'Target', value: `${targetAchievement}%`, label: 'Objectif atteint', color: 'text-orange-600' }
      ];
    }

    if (role === 'admin') {
      const activeStores = new Set(filteredSales.map(sale => sale.store_id)).size;
      const totalSellers = new Set(filteredSales.map(sale => sale.seller_id)).size;
      const growth = 12.5; // À calculer selon les données historiques

      return [
        { icon: 'Store', value: activeStores, label: 'Magasins actifs', color: 'text-blue-600' },
        { icon: 'DollarSign', value: `${totalRevenue.toLocaleString()} CFA`, label: 'CA global', color: 'text-green-600' },
        { icon: 'Users', value: totalSellers, label: 'Vendeurs total', color: 'text-purple-600' },
        { icon: 'TrendingUp', value: `${growth}%`, label: 'Croissance', color: 'text-orange-600' }
      ];
    }

    return roleContent.stats;
  }, [sales, searchTerm, context, roleContent.stats]);

  // Mutation pour créer une vente
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: CreateSaleData) => {
      if (!profile?.id) throw new Error('Utilisateur non authentifié');

      // Validation des permissions
      if (context.isSeller && !context.storeIds.includes(saleData.store_id)) {
        throw new Error('Vous n\'avez pas la permission de créer une vente dans ce magasin');
      }

      // Générer le numéro de vente
      const saleNumber = `VTE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

      // Créer la vente
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          store_id: saleData.store_id,
          seller_id: profile.id,
          subtotal: saleData.subtotal,
          tax_amount: saleData.tax_amount || 0,
          discount_amount: saleData.discount_amount || 0,
          total: saleData.total,
          status: 'completed',
          payment_method: saleData.payment_method || 'cash',
          customer_name: saleData.customer_name,
          customer_email: saleData.customer_email,
          customer_phone: saleData.customer_phone,
          notes: saleData.notes,
          sale_number: saleNumber,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Créer les articles de vente
      const saleItems = saleData.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Mettre à jour le stock
      for (const item of saleData.items) {
        const { data: currentStock } = await supabase
          .from('stock')
          .select('quantity')
          .eq('product_id', item.product_id)
          .eq('store_id', saleData.store_id)
          .single();

        if (currentStock) {
          const newQuantity = Math.max(0, currentStock.quantity - item.quantity);
          await supabase
            .from('stock')
            .update({ 
              quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('product_id', item.product_id)
            .eq('store_id', saleData.store_id);
        }
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      
      const message = context.isSeller 
        ? 'Vente enregistrée avec succès dans votre caisse'
        : 'Vente créée avec succès';
        
      toast({
        title: "Vente créée",
        description: message,
      });
    },
    onError: (error) => {
      console.error('Erreur création vente:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer la vente.",
        variant: "destructive",
      });
    },
  });

  // Ventes filtrées avec recherche
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = 
        sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [sales, searchTerm]);

  // Magasins disponibles selon les permissions
  const availableStores = useMemo(() => {
    return stores.filter(store => {
      if (context.isAdmin) return true;
      return context.storeIds.includes(store.id);
    });
  }, [stores, context]);

  return {
    // Données
    sales: filteredSales,
    isLoading,
    error,
    
    // Contexte et contenu adaptatif
    context,
    roleContent: {
      ...roleContent,
      stats: calculatedStats
    },
    
    // Filtres et recherche
    searchTerm,
    setSearchTerm,
    selectedStore,
    setSelectedStore,
    selectedStatus,
    setSelectedStatus,
    selectedPeriod,
    setSelectedPeriod,
    
    // Pagination
    page,
    setPage,
    pageSize,
    
    // Actions
    createSale: createSaleMutation.mutate,
    isCreating: createSaleMutation.isPending,
    refetch,
    
    // Données dérivées
    availableStores,
    totalSales: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    
    // Messages personnalisés
    getPersonalizedMessage: () => {
      const { role, storeCount } = context;
      const timeOfDay = new Date().getHours();
      let greeting = '';
      
      if (timeOfDay < 12) greeting = 'Bonjour';
      else if (timeOfDay < 18) greeting = 'Bon après-midi';
      else greeting = 'Bonsoir';
      
      switch (role) {
        case 'seller':
          return `${greeting} ! Prêt(e) pour une journée de vente productive ?`;
        case 'manager':
          return `${greeting} ! Comment se porte votre équipe aujourd'hui ?`;
        case 'admin':
          return `${greeting} ! Vue d'ensemble de vos ${storeCount} magasin${storeCount > 1 ? 's' : ''}`;
        default:
          return `${greeting} !`;
      }
    }
  };
}; 