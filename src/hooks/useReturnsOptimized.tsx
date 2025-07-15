import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStores } from './useStores';
import { toast } from './use-toast';

// Types pour les retours
export interface Return {
  id: number;
  return_number: string;
  sale_id: number;
  store_id: number;
  processed_by: string;
  customer_name?: string;
  reason?: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  sales?: {
    sale_number: string;
    customer_name?: string;
  };
  stores?: {
    name: string;
  };
  profiles?: {
    name: string;
  };
  return_items?: ReturnItem[];
}

export interface ReturnItem {
  id: number;
  return_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  products?: {
    name: string;
    sku: string;
  };
}

export interface CreateReturnData {
  sale_id: number;
  store_id: number;
  customer_name?: string;
  reason?: string;
  total_amount: number;
  notes?: string;
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

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
  maxAmount: number | null;
  requiresApproval: boolean;
}

interface ReturnsContext {
  role: string;
  storeIds: number[];
  storeCount: number;
  permissions: string[];
  isManager: boolean;
  isSeller: boolean;
  isAdmin: boolean;
}

export const useReturnsOptimized = () => {
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
  const context: ReturnsContext = useMemo(() => {
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
          title: `Retours & Échanges - ${storeCount} magasin${storeCount > 1 ? 's' : ''}`,
          subtitle: 'Traitez les retours de vos ventes rapidement et efficacement',
          quickActions: ['Nouveau retour', 'Historique', 'Remboursements', 'Mes retours'],
          stats: [
            { icon: 'RefreshCw', value: 0, label: 'Retours aujourd\'hui', color: 'text-blue-600' },
            { icon: 'DollarSign', value: '0 XOF', label: 'Montant total', color: 'text-green-600' },
            { icon: 'CheckCircle', value: 0, label: 'Approuvés', color: 'text-purple-600' },
            { icon: 'XCircle', value: 0, label: 'En attente', color: 'text-orange-600' }
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
                { value: 'pending', label: 'En attente' },
                { value: 'approved', label: 'Approuvés' },
                { value: 'rejected', label: 'Rejetés' }
              ]
            }
          ],
          maxAmount: 50000, // Limite en XOF
          requiresApproval: false
        };

      case 'manager':
        return {
          title: `Gestion des Retours - ${storeCount} magasin${storeCount > 1 ? 's' : ''}`,
          subtitle: 'Supervisez les retours de votre équipe et validez les opérations importantes',
          quickActions: ['Nouveau retour', 'Validation', 'Rapports', 'Remboursements'],
          stats: [
            { icon: 'Users', value: 0, label: 'Vendeurs actifs', color: 'text-blue-600' },
            { icon: 'DollarSign', value: '0 XOF', label: 'Montant total', color: 'text-green-600' },
            { icon: 'TrendingUp', value: 0, label: 'Retours équipe', color: 'text-purple-600' },
            { icon: 'AlertCircle', value: 0, label: 'À valider', color: 'text-orange-600' }
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
          ],
          maxAmount: 200000, // Limite en XOF
          requiresApproval: true
        };

      case 'admin':
        return {
          title: 'Gestion Globale des Retours',
          subtitle: 'Vue d\'ensemble de tous les retours du système et configuration des politiques',
          quickActions: ['Nouveau retour', 'Configuration', 'Rapports globaux', 'Audit'],
          stats: [
            { icon: 'Store', value: 0, label: 'Magasins actifs', color: 'text-blue-600' },
            { icon: 'DollarSign', value: '0 XOF', label: 'Montant global', color: 'text-green-600' },
            { icon: 'Users', value: 0, label: 'Vendeurs total', color: 'text-purple-600' },
            { icon: 'TrendingUp', value: '0%', label: 'Taux de retour', color: 'text-orange-600' }
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
          ],
          maxAmount: null, // Pas de limite
          requiresApproval: false
        };

      default:
        return {
          title: 'Retours & Échanges',
          subtitle: 'Gérez les retours et échanges',
          quickActions: ['Nouveau retour'],
          stats: [],
          filters: [],
          maxAmount: 50000,
          requiresApproval: false
        };
    }
  }, [context, stores]);

  // Requête optimisée selon le rôle
  const getOptimizedReturnsQuery = useCallback(() => {
    let query = supabase
      .from('returns')
      .select(`
        *,
        sales(sale_number, customer_name),
        stores(name),
        profiles(name),
        return_items(count)
      `);

    const { role, storeIds } = context;

    // Filtrage selon le rôle
    if (role === 'seller') {
      // Vendeurs: seulement leurs retours récents
      query = query
        .in('store_id', storeIds)
        .eq('processed_by', profile?.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50);
    } else if (role === 'manager') {
      // Managers: retours de leurs magasins
      query = query
        .in('store_id', storeIds)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    }
    // Admin: tous les retours

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
  }, [context, selectedStore, selectedStatus, selectedPeriod, profile?.id]);

  // Requête principale avec cache optimisé
  const {
    data: returns = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['returns-optimized', context.role, context.storeIds, selectedStore, selectedStatus, selectedPeriod, page],
    queryFn: async () => {
      const query = getOptimizedReturnsQuery();
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Return[];
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    gcTime: 10 * 60 * 1000, // Garde en cache 10 minutes
    enabled: !!profile,
  });

  // Statistiques calculées en temps réel
  const calculatedStats = useMemo(() => {
    const filteredReturns = returns.filter(ret => {
      const matchesSearch = 
        ret.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.sales?.sale_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    const totalReturns = filteredReturns.length;
    const totalAmount = filteredReturns.reduce((sum, ret) => sum + ret.total_amount, 0);
    const approvedReturns = filteredReturns.filter(ret => ret.status === 'approved').length;
    const pendingReturns = filteredReturns.filter(ret => ret.status === 'pending').length;

    // Calculs spécifiques par rôle
    const { role } = context;
    
    if (role === 'seller') {
      const today = new Date().toDateString();
      const todayReturns = filteredReturns.filter(ret => 
        new Date(ret.created_at).toDateString() === today
      );
      const todayAmount = todayReturns.reduce((sum, ret) => sum + ret.total_amount, 0);
      
      return [
        { icon: 'RefreshCw', value: todayReturns.length, label: 'Retours aujourd\'hui', color: 'text-blue-600' },
        { icon: 'DollarSign', value: `${todayAmount.toLocaleString()} XOF`, label: 'Montant total', color: 'text-green-600' },
        { icon: 'CheckCircle', value: approvedReturns, label: 'Approuvés', color: 'text-purple-600' },
        { icon: 'XCircle', value: pendingReturns, label: 'En attente', color: 'text-orange-600' }
      ];
    }

    if (role === 'manager') {
      const activeSellers = new Set(filteredReturns.map(ret => ret.processed_by)).size;
      const teamReturns = filteredReturns.length;
      const toValidate = pendingReturns;

      return [
        { icon: 'Users', value: activeSellers, label: 'Vendeurs actifs', color: 'text-blue-600' },
        { icon: 'DollarSign', value: `${totalAmount.toLocaleString()} XOF`, label: 'Montant total', color: 'text-green-600' },
        { icon: 'TrendingUp', value: teamReturns, label: 'Retours équipe', color: 'text-purple-600' },
        { icon: 'AlertCircle', value: toValidate, label: 'À valider', color: 'text-orange-600' }
      ];
    }

    if (role === 'admin') {
      const activeStores = new Set(filteredReturns.map(ret => ret.store_id)).size;
      const totalSellers = new Set(filteredReturns.map(ret => ret.processed_by)).size;
      const returnRate = totalReturns > 0 ? ((totalReturns / 100) * 100).toFixed(1) : '0.0';

      return [
        { icon: 'Store', value: activeStores, label: 'Magasins actifs', color: 'text-blue-600' },
        { icon: 'DollarSign', value: `${totalAmount.toLocaleString()} XOF`, label: 'Montant global', color: 'text-green-600' },
        { icon: 'Users', value: totalSellers, label: 'Vendeurs total', color: 'text-purple-600' },
        { icon: 'TrendingUp', value: `${returnRate}%`, label: 'Taux de retour', color: 'text-orange-600' }
      ];
    }

    return roleContent.stats;
  }, [returns, searchTerm, context, roleContent.stats]);

  // Mutation pour créer un retour
  const createReturnMutation = useMutation({
    mutationFn: async (returnData: CreateReturnData) => {
      if (!profile?.id) throw new Error('Utilisateur non authentifié');

      // Validation des permissions
      if (context.isSeller && !context.storeIds.includes(returnData.store_id)) {
        throw new Error('Vous n\'avez pas la permission de créer un retour dans ce magasin');
      }

      // Validation du montant selon le rôle
      if (roleContent.maxAmount && returnData.total_amount > roleContent.maxAmount) {
        throw new Error(`Le montant maximum autorisé est de ${roleContent.maxAmount.toLocaleString()} XOF`);
      }

      // Générer le numéro de retour
      const returnNumber = `RET-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

      // Déterminer le statut selon les permissions
      const status = roleContent.requiresApproval ? 'pending' : 'approved';

      // Créer le retour
      const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert({
          return_number: returnNumber,
          sale_id: returnData.sale_id,
          store_id: returnData.store_id,
          processed_by: profile.id,
          customer_name: returnData.customer_name,
          reason: returnData.reason,
          total_amount: returnData.total_amount,
          status: status,
          notes: returnData.notes,
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Créer les articles de retour
      if (returnData.items.length > 0) {
        const returnItemsData = returnData.items.map(item => ({
          return_id: returnRecord.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }));

        const { error: itemsError } = await supabase
          .from('return_items')
          .insert(returnItemsData);

        if (itemsError) throw itemsError;
      }

      return returnRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['returns-optimized'] });
      
      const message = context.isSeller 
        ? 'Retour enregistré avec succès'
        : roleContent.requiresApproval
        ? 'Retour créé et en attente d\'approbation'
        : 'Retour approuvé avec succès';
        
      toast({
        title: "Retour créé",
        description: message,
      });
    },
    onError: (error) => {
      console.error('Erreur création retour:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le retour.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour approuver/rejeter un retour
  const updateReturnStatusMutation = useMutation({
    mutationFn: async ({ returnId, status, notes }: { returnId: number; status: 'approved' | 'rejected'; notes?: string }) => {
      if (!profile?.id) throw new Error('Utilisateur non authentifié');

      // Validation des permissions
      if (context.isSeller) {
        throw new Error('Vous n\'avez pas la permission de modifier le statut d\'un retour');
      }

      const { data, error } = await supabase
        .from('returns')
        .update({
          status,
          notes: notes ? `${data?.notes || ''}\n${new Date().toLocaleString()}: ${notes}`.trim() : data?.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', returnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['returns-optimized'] });
      
      toast({
        title: "Statut mis à jour",
        description: `Le retour a été ${data.status === 'approved' ? 'approuvé' : 'rejeté'} avec succès.`,
      });
    },
    onError: (error) => {
      console.error('Erreur mise à jour statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du retour.",
        variant: "destructive",
      });
    },
  });

  // Retours filtrés avec recherche
  const filteredReturns = useMemo(() => {
    return returns.filter(ret => {
      const matchesSearch = 
        ret.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.sales?.sale_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [returns, searchTerm]);

  // Magasins disponibles selon les permissions
  const availableStores = useMemo(() => {
    return stores.filter(store => {
      if (context.isAdmin) return true;
      return context.storeIds.includes(store.id);
    });
  }, [stores, context]);

  return {
    // Données
    returns: filteredReturns,
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
    createReturn: createReturnMutation.mutate,
    isCreating: createReturnMutation.isPending,
    updateReturnStatus: updateReturnStatusMutation.mutate,
    isUpdatingStatus: updateReturnStatusMutation.isPending,
    refetch,
    
    // Données dérivées
    availableStores,
    totalReturns: filteredReturns.length,
    totalAmount: filteredReturns.reduce((sum, ret) => sum + ret.total_amount, 0),
    
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
          return `${greeting} ! Prêt(e) à gérer les retours de vos ventes ?`;
        case 'manager':
          return `${greeting} ! Comment se portent les retours de votre équipe ?`;
        case 'admin':
          return `${greeting} ! Vue d'ensemble des retours de vos ${storeCount} magasin${storeCount > 1 ? 's' : ''}`;
        default:
          return `${greeting} !`;
      }
    },

    // Validation des permissions
    canCreateReturn: (amount: number) => {
      if (context.isAdmin) return true;
      if (roleContent.maxAmount && amount > roleContent.maxAmount) return false;
      return true;
    },

    canApproveReturn: () => {
      return context.isManager || context.isAdmin;
    },

    canViewAllReturns: () => {
      return context.isManager || context.isAdmin;
    }
  };
}; 