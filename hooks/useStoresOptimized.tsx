import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

// Types pour les magasins
export interface Store {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    email: string;
  };
  _count?: {
    products: number;
    sales: number;
    employees: number;
  };
}

export interface StoreFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  manager_id?: string;
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
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageEmployees: boolean;
}

interface StoresContext {
  role: string;
  storeIds: number[];
  storeCount: number;
  permissions: string[];
  isManager: boolean;
  isSeller: boolean;
  isAdmin: boolean;
}

export const useStoresOptimized = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Contexte utilisateur optimisé
  const context: StoresContext = useMemo(() => {
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
          title: `Mes Magasins - ${storeCount} magasin${storeCount > 1 ? 's' : ''}`,
          subtitle: 'Accédez aux informations de vos magasins assignés',
          quickActions: ['Voir mes magasins', 'Statistiques', 'Contact', 'Historique'],
          stats: [
            { icon: 'Building2', value: storeCount, label: 'Magasins assignés', color: 'text-blue-600' },
            { icon: 'Users', value: 0, label: 'Employés total', color: 'text-green-600' },
            { icon: 'TrendingUp', value: '0%', label: 'Performance', color: 'text-purple-600' },
            { icon: 'Clock', value: 0, label: 'Activités récentes', color: 'text-orange-600' }
          ],
          filters: [
            {
              key: 'status',
              label: 'Statut',
              options: [
                { value: 'all', label: 'Tous' },
                { value: 'active', label: 'Actifs' },
                { value: 'inactive', label: 'Inactifs' }
              ]
            }
          ],
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canManageEmployees: false
        };

      case 'manager':
        return {
          title: `Gestion des Magasins - ${storeCount} magasin${storeCount > 1 ? 's' : ''}`,
          subtitle: 'Supervisez vos magasins et gérez votre équipe',
          quickActions: ['Nouveau magasin', 'Gestion équipe', 'Rapports', 'Configuration'],
          stats: [
            { icon: 'Building2', value: storeCount, label: 'Magasins gérés', color: 'text-blue-600' },
            { icon: 'Users', value: 0, label: 'Employés total', color: 'text-green-600' },
            { icon: 'TrendingUp', value: '0%', label: 'Performance globale', color: 'text-purple-600' },
            { icon: 'AlertCircle', value: 0, label: 'Alertes', color: 'text-orange-600' }
          ],
          filters: [
            {
              key: 'status',
              label: 'Statut',
              options: [
                { value: 'all', label: 'Tous' },
                { value: 'active', label: 'Actifs' },
                { value: 'inactive', label: 'Inactifs' }
              ]
            },
            {
              key: 'performance',
              label: 'Performance',
              options: [
                { value: 'all', label: 'Toutes' },
                { value: 'high', label: 'Élevée' },
                { value: 'medium', label: 'Moyenne' },
                { value: 'low', label: 'Faible' }
              ]
            }
          ],
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canManageEmployees: true
        };

      case 'admin':
        return {
          title: 'Gestion Globale des Magasins',
          subtitle: 'Vue d\'ensemble de tous les magasins du système',
          quickActions: ['Nouveau magasin', 'Configuration', 'Rapports globaux', 'Audit'],
          stats: [
            { icon: 'Building2', value: 0, label: 'Total magasins', color: 'text-blue-600' },
            { icon: 'Users', value: 0, label: 'Employés total', color: 'text-green-600' },
            { icon: 'TrendingUp', value: '0%', label: 'Performance globale', color: 'text-purple-600' },
            { icon: 'Settings', value: 0, label: 'Configurations', color: 'text-orange-600' }
          ],
          filters: [
            {
              key: 'status',
              label: 'Statut',
              options: [
                { value: 'all', label: 'Tous' },
                { value: 'active', label: 'Actifs' },
                { value: 'inactive', label: 'Inactifs' }
              ]
            },
            {
              key: 'region',
              label: 'Région',
              options: [
                { value: 'all', label: 'Toutes' },
                { value: 'north', label: 'Nord' },
                { value: 'south', label: 'Sud' },
                { value: 'east', label: 'Est' },
                { value: 'west', label: 'Ouest' }
              ]
            }
          ],
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canManageEmployees: true
        };

      default:
        return {
          title: 'Gestion des Magasins',
          subtitle: 'Gérez vos magasins',
          quickActions: ['Nouveau magasin'],
          stats: [],
          filters: [],
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canManageEmployees: false
        };
    }
  }, [context]);

  // Requête optimisée selon le rôle
  const getOptimizedStoresQuery = useCallback(() => {
    let query = supabase
      .from('stores')
      .select(`
        *,
        profiles(name, email)
      `);

    const { role, storeIds } = context;

    // Filtrage selon le rôle
    if (role === 'seller') {
      // Pour les vendeurs: seulement leurs magasins assignés
      query = query
        .in('id', storeIds)
        .eq('is_active', true)
        .limit(10);
    } else if (role === 'manager') {
      // Pour les managers: leurs magasins avec plus de détails
      query = query
        .in('id', storeIds)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
    }
    // Admin: tous les magasins

    // Filtres supplémentaires
    if (selectedStatus !== 'all') {
      query = query.eq('is_active', selectedStatus === 'active');
    }

    return query.order('name');
  }, [context, selectedStatus]);

  // Requête principale avec cache optimisé
  const {
    data: stores = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['stores-optimized', context.role, context.storeIds, selectedStatus, selectedPeriod, page],
    queryFn: async () => {
      const query = getOptimizedStoresQuery();
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Store[];
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    gcTime: 10 * 60 * 1000, // Garde en cache 10 minutes
    enabled: !!profile,
  });

  // Statistiques calculées en temps réel
  const calculatedStats = useMemo(() => {
    const filteredStores = stores.filter(store => {
      const matchesSearch = 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });

    const totalStores = filteredStores.length;
    const activeStores = filteredStores.filter(store => store.is_active).length;
    const inactiveStores = totalStores - activeStores;

    // Calculs spécifiques par rôle
    const { role } = context;
    
    if (role === 'seller') {
      const performance = totalStores > 0 ? Math.round((activeStores / totalStores) * 100) : 0;
      const recentActivities = filteredStores.filter(store => 
        new Date(store.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      return [
        { icon: 'Building2', value: totalStores, label: 'Magasins assignés', color: 'text-blue-600' },
        { icon: 'Users', value: 0, label: 'Employés total', color: 'text-green-600' },
        { icon: 'TrendingUp', value: `${performance}%`, label: 'Performance', color: 'text-purple-600' },
        { icon: 'Clock', value: recentActivities, label: 'Activités récentes', color: 'text-orange-600' }
      ];
    }

    if (role === 'manager') {
      const performance = totalStores > 0 ? Math.round((activeStores / totalStores) * 100) : 0;
      const alerts = filteredStores.filter(store => !store.is_active).length;
      
      return [
        { icon: 'Building2', value: totalStores, label: 'Magasins gérés', color: 'text-blue-600' },
        { icon: 'Users', value: 0, label: 'Employés total', color: 'text-green-600' },
        { icon: 'TrendingUp', value: `${performance}%`, label: 'Performance globale', color: 'text-purple-600' },
        { icon: 'AlertCircle', value: alerts, label: 'Alertes', color: 'text-orange-600' }
      ];
    }

    if (role === 'admin') {
      const performance = totalStores > 0 ? Math.round((activeStores / totalStores) * 100) : 0;
      const configurations = totalStores; // Nombre de magasins = configurations possibles
      
      return [
        { icon: 'Building2', value: totalStores, label: 'Total magasins', color: 'text-blue-600' },
        { icon: 'Users', value: 0, label: 'Employés total', color: 'text-green-600' },
        { icon: 'TrendingUp', value: `${performance}%`, label: 'Performance globale', color: 'text-purple-600' },
        { icon: 'Settings', value: configurations, label: 'Configurations', color: 'text-orange-600' }
      ];
    }

    return roleContent.stats;
  }, [stores, searchTerm, context, roleContent.stats]);

  // Mutation pour créer un magasin
  const createStoreMutation = useMutation({
    mutationFn: async (storeData: StoreFormData) => {
      if (!profile?.id) throw new Error('Utilisateur non authentifié');

      // Validation des permissions
      if (!roleContent.canCreate) {
        throw new Error('Vous n\'avez pas la permission de créer des magasins');
      }

      const { data, error } = await supabase
        .from('stores')
        .insert({
          name: storeData.name.trim(),
          address: storeData.address?.trim() || null,
          phone: storeData.phone?.trim() || null,
          email: storeData.email?.trim() || null,
          manager_id: storeData.manager_id || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stores-optimized'] });
      
      toast({
        title: "Magasin créé",
        description: `Le magasin "${data.name}" a été créé avec succès.`,
      });
    },
    onError: (error) => {
      console.error('Erreur création magasin:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le magasin.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour modifier un magasin
  const updateStoreMutation = useMutation({
    mutationFn: async ({ id, storeData }: { id: number; storeData: StoreFormData }) => {
      if (!profile?.id) throw new Error('Utilisateur non authentifié');

      // Validation des permissions
      if (!roleContent.canEdit) {
        throw new Error('Vous n\'avez pas la permission de modifier des magasins');
      }

      // Validation spécifique pour les managers
      if (context.isManager && !context.storeIds.includes(id)) {
        throw new Error('Vous ne pouvez modifier que vos magasins assignés');
      }

      const { data, error } = await supabase
        .from('stores')
        .update({
          name: storeData.name.trim(),
          address: storeData.address?.trim() || null,
          phone: storeData.phone?.trim() || null,
          email: storeData.email?.trim() || null,
          manager_id: storeData.manager_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stores-optimized'] });
      
      toast({
        title: "Magasin modifié",
        description: `Le magasin "${data.name}" a été modifié avec succès.`,
      });
    },
    onError: (error) => {
      console.error('Erreur modification magasin:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de modifier le magasin.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer un magasin
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: number) => {
      if (!profile?.id) throw new Error('Utilisateur non authentifié');

      // Validation des permissions
      if (!roleContent.canDelete) {
        throw new Error('Vous n\'avez pas la permission de supprimer des magasins');
      }

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;
      return storeId;
    },
    onSuccess: (storeId) => {
      queryClient.invalidateQueries({ queryKey: ['stores-optimized'] });
      
      toast({
        title: "Magasin supprimé",
        description: "Le magasin a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      console.error('Erreur suppression magasin:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le magasin.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour changer le statut d'un magasin
  const toggleStoreStatusMutation = useMutation({
    mutationFn: async (storeId: number) => {
      if (!profile?.id) throw new Error('Utilisateur non authentifié');

      // Validation des permissions
      if (!roleContent.canEdit) {
        throw new Error('Vous n\'avez pas la permission de modifier des magasins');
      }

      // Validation spécifique pour les managers
      if (context.isManager && !context.storeIds.includes(storeId)) {
        throw new Error('Vous ne pouvez modifier que vos magasins assignés');
      }

      const store = stores.find(s => s.id === storeId);
      if (!store) throw new Error('Magasin introuvable');

      const { data, error } = await supabase
        .from('stores')
        .update({ 
          is_active: !store.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stores-optimized'] });
      
      toast({
        title: data.is_active ? "Magasin activé" : "Magasin désactivé",
        description: `${data.name} a été ${data.is_active ? 'activé' : 'désactivé'}.`,
      });
    },
    onError: (error) => {
      console.error('Erreur changement statut:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de changer le statut du magasin.",
        variant: "destructive",
      });
    },
  });

  // Magasins filtrés avec recherche
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (store.email && store.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  }, [stores, searchTerm]);

  return {
    // Données
    stores: filteredStores,
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
    selectedStatus,
    setSelectedStatus,
    selectedPeriod,
    setSelectedPeriod,
    
    // Pagination
    page,
    setPage,
    pageSize,
    
    // Actions
    createStore: createStoreMutation.mutate,
    isCreating: createStoreMutation.isPending,
    updateStore: updateStoreMutation.mutate,
    isUpdating: updateStoreMutation.isPending,
    deleteStore: deleteStoreMutation.mutate,
    isDeleting: deleteStoreMutation.isPending,
    toggleStoreStatus: toggleStoreStatusMutation.mutate,
    isTogglingStatus: toggleStoreStatusMutation.isPending,
    refetch,
    
    // Données dérivées
    totalStores: filteredStores.length,
    activeStores: filteredStores.filter(store => store.is_active).length,
    inactiveStores: filteredStores.filter(store => !store.is_active).length,
    
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
          return `${greeting} ! Accédez aux informations de vos ${storeCount} magasin${storeCount > 1 ? 's' : ''} assigné${storeCount > 1 ? 's' : ''}.`;
        case 'manager':
          return `${greeting} ! Gérez vos ${storeCount} magasin${storeCount > 1 ? 's' : ''} et supervisez votre équipe.`;
        case 'admin':
          return `${greeting} ! Vue d'ensemble de tous les magasins du système.`;
        default:
          return `${greeting} !`;
      }
    },

    // Validation des permissions
    canCreateStore: () => roleContent.canCreate,
    canEditStore: (storeId?: number) => {
      if (!roleContent.canEdit) return false;
      if (context.isAdmin) return true;
      if (context.isManager && storeId) {
        return context.storeIds.includes(storeId);
      }
      return true;
    },
    canDeleteStore: () => roleContent.canDelete,
    canManageEmployees: () => roleContent.canManageEmployees
  };
}; 