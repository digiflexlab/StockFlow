import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from '@/hooks/use-toast';

// Types pour les utilisateurs
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'seller';
  store_ids: number[];
  permissions: string[];
  is_active?: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    admin: number;
    manager: number;
    seller: number;
  };
  byStore: { [storeId: number]: number };
  recentActivity: number;
  newThisMonth: number;
}

interface UserActivity {
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: Record<string, unknown>;
}

interface UsersContext {
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
  createMessage: string;
  updateMessage: string;
  deleteMessage: string;
  noAccessMessage: string;
  teamMessage: string;
}

// Messages adaptatifs selon les rôles
const getRoleBasedMessages = (role: string): RoleBasedMessages => {
  const messages = {
    admin: {
      title: 'Gestion Globale des Utilisateurs',
      description: 'Gestion complète de tous les utilisateurs du système',
      subtitle: 'Créez, modifiez et gérez les utilisateurs et leurs permissions',
      noDataMessage: 'Aucun utilisateur dans le système',
      createMessage: 'Création d\'un nouvel utilisateur...',
      updateMessage: 'Mise à jour de l\'utilisateur...',
      deleteMessage: 'Suppression de l\'utilisateur...',
      noAccessMessage: 'Accès non autorisé à la gestion des utilisateurs',
      teamMessage: 'Tous les utilisateurs du système'
    },
    manager: {
      title: 'Gestion de l\'Équipe',
      description: 'Gestion de votre équipe et des utilisateurs assignés',
      subtitle: 'Supervisez votre équipe et gérez leurs permissions',
      noDataMessage: 'Aucun membre dans votre équipe',
      createMessage: 'Ajout d\'un membre à l\'équipe...',
      updateMessage: 'Mise à jour du membre...',
      deleteMessage: 'Retrait du membre...',
      noAccessMessage: 'Accès non autorisé à la gestion des utilisateurs',
      teamMessage: 'Votre équipe'
    },
    seller: {
      title: 'Mon Profil',
      description: 'Gestion de votre profil personnel',
      subtitle: 'Modifiez vos informations et préférences',
      noDataMessage: 'Aucune information de profil disponible',
      createMessage: 'Création du profil...',
      updateMessage: 'Mise à jour du profil...',
      deleteMessage: 'Suppression du profil...',
      noAccessMessage: 'Accès non autorisé à la gestion des utilisateurs',
      teamMessage: 'Mon profil'
    }
  };

  return messages[role as keyof typeof messages] || messages.seller;
};

// Types d'actions adaptatifs selon les rôles
const getRoleBasedActions = (role: string) => {
  const baseActions = [
    { id: 'view', label: 'Voir', icon: 'Eye', roles: ['admin', 'manager', 'seller'] },
    { id: 'edit', label: 'Modifier', icon: 'Edit', roles: ['admin', 'manager', 'seller'] },
  ];

  if (role === 'admin') {
    baseActions.push(
      { id: 'create', label: 'Créer', icon: 'Plus', roles: ['admin'] },
      { id: 'delete', label: 'Supprimer', icon: 'Trash', roles: ['admin'] },
      { id: 'permissions', label: 'Permissions', icon: 'Shield', roles: ['admin'] },
      { id: 'activity', label: 'Activité', icon: 'Activity', roles: ['admin'] }
    );
  }

  if (role === 'manager') {
    baseActions.push(
      { id: 'team', label: 'Équipe', icon: 'Users', roles: ['manager'] },
      { id: 'performance', label: 'Performance', icon: 'TrendingUp', roles: ['manager'] }
    );
  }

  return baseActions.filter(action => action.roles.includes(role));
};

// Calcul des métriques utilisateur
const calculateUserStats = (users: User[], context: UsersContext): UserStats => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats: UserStats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    byRole: {
      admin: users.filter(u => u.role === 'admin').length,
      manager: users.filter(u => u.role === 'manager').length,
      seller: users.filter(u => u.role === 'seller').length
    },
    byStore: {},
    recentActivity: 0,
    newThisMonth: users.filter(u => new Date(u.created_at) >= thisMonth).length
  };

  // Calcul par magasin
  users.forEach(user => {
    user.store_ids?.forEach(storeId => {
      stats.byStore[storeId] = (stats.byStore[storeId] || 0) + 1;
    });
  });

  // Calcul de l'activité récente (dernière connexion < 7 jours)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  stats.recentActivity = users.filter(u => 
    u.last_login && new Date(u.last_login) >= sevenDaysAgo
  ).length;

  return stats;
};

// Hook optimisé pour les utilisateurs
export const useUsersOptimized = () => {
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller, canCreateUsers, canEditUsers, canDeleteUsers } = useUserRoles();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStore, setSelectedStore] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Contexte utilisateur optimisé
  const context: UsersContext = useMemo(() => {
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

  // Types d'actions adaptatifs
  const actions = useMemo(() => getRoleBasedActions(context.role), [context.role]);

  // Déterminer les permissions selon le rôle
  const canViewUsers = isAdmin || isManager || isSeller;
  const canViewAllUsers = isAdmin;
  const canViewTeamUsers = isManager;
  const canViewOwnProfile = isSeller;
  const canManagePermissions = isAdmin;
  const canViewActivity = isAdmin || isManager;

  // Query optimisée pour les données utilisateurs
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users', 'optimized', context.role, selectedRole, selectedStore],
    queryFn: async () => {
      if (!canViewUsers) {
        throw new Error('Accès non autorisé aux utilisateurs');
      }

      let usersQuery = supabase
        .from('profiles')
        .select(`
          *,
          stores (id, name)
        `)
        .order('created_at', { ascending: false });

      // Filtrage selon les permissions
      if (!canViewAllUsers) {
        if (canViewTeamUsers) {
          // Managers voient leur équipe (utilisateurs des magasins assignés)
          usersQuery = usersQuery.contains('store_ids', context.storeIds);
        } else if (canViewOwnProfile) {
          // Sellers voient seulement leur profil
          usersQuery = usersQuery.eq('id', profile?.id);
        }
      }

      // Filtrage par rôle
      if (selectedRole !== 'all') {
        usersQuery = usersQuery.eq('role', selectedRole);
      }

      // Filtrage par magasin
      if (selectedStore !== 'all') {
        usersQuery = usersQuery.contains('store_ids', [parseInt(selectedStore)] as number[]);
      }

      const { data: usersData, error: usersError } = await usersQuery;
      if (usersError) throw usersError;

      return usersData || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: canViewUsers,
  });

  // Query pour les statistiques
  const { data: userStats } = useQuery({
    queryKey: ['users', 'stats', context.role],
    queryFn: async () => {
      if (!canViewUsers) return null;

      let statsQuery = supabase
        .from('profiles')
        .select('*');

      // Filtrage selon les permissions
      if (!canViewAllUsers) {
        if (canViewTeamUsers) {
          statsQuery = statsQuery.contains('store_ids', context.storeIds);
        } else if (canViewOwnProfile) {
          statsQuery = statsQuery.eq('id', profile?.id);
        }
      }

      const { data: statsData, error: statsError } = await statsQuery;
      if (statsError) throw statsError;

      return calculateUserStats(statsData || [], context);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: canViewUsers,
  });

  // Query pour l'activité récente
  const { data: recentActivity } = useQuery({
    queryKey: ['users', 'activity', context.role],
    queryFn: async () => {
      if (!canViewActivity) return [];

      // Simulation d'activité récente (à implémenter avec une vraie table)
      const activity: UserActivity[] = [];
      
      if (users) {
        users.slice(0, 5).forEach(user => {
          activity.push({
            userId: user.id,
            userName: user?.name,
            action: 'Connexion',
            timestamp: new Date().toISOString(),
            details: { ip: '192.168.1.1', device: 'Chrome' }
          });
        });
      }

      return activity;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: canViewActivity && !!users,
  });

  // Mutation pour créer un utilisateur
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      if (!canCreateUsers) {
        throw new Error('Permission refusée');
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          name: userData.name,
          email: userData.email,
          role: userData.role,
          store_ids: userData.store_ids || [],
          permissions: userData.permissions || [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Utilisateur créé",
        description: messages.createMessage,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'utilisateur.",
        variant: "destructive",
      });
    }
  });

  // Mutation pour mettre à jour un utilisateur
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<User> }) => {
      if (!canEditUsers) {
        throw new Error('Permission refusée');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          store_ids: userData.store_ids || [],
          permissions: userData.permissions || [],
          is_active: userData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Utilisateur mis à jour",
        description: messages.updateMessage,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'utilisateur.",
        variant: "destructive",
      });
    }
  });

  // Mutation pour supprimer un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!canDeleteUsers) {
        throw new Error('Permission refusée');
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Utilisateur supprimé",
        description: messages.deleteMessage,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      });
    }
  });

  // Fonctions d'action
  const createUser = useCallback(async (userData: Partial<User>) => {
    setIsCreating(true);
    try {
      await createUserMutation.mutateAsync(userData);
    } finally {
      setIsCreating(false);
    }
  }, [createUserMutation]);

  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    setIsUpdating(true);
    try {
      await updateUserMutation.mutateAsync({ userId, userData });
    } finally {
      setIsUpdating(false);
    }
  }, [updateUserMutation]);

  const deleteUser = useCallback(async (userId: string) => {
    setIsDeleting(true);
    try {
      await deleteUserMutation.mutateAsync(userId);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteUserMutation]);

  // Fonction de rafraîchissement
  const refreshData = useCallback(async () => {
    toast({
      title: "Actualisation",
      description: "Actualisation des données utilisateurs...",
    });
    await refetch();
  }, [refetch]);

  // Filtrage des utilisateurs
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      const matchesSearch = user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || user?.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  // Utilitaires
  const getRoleLabel = useCallback((role: string) => {
    const roleLabels = {
      admin: 'Administrateur',
      manager: 'Gérant',
      seller: 'Vendeur'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  }, []);

  const getRoleBadgeColor = useCallback((role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      seller: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  const getInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }, []);

  // Rôles disponibles
  const availableRoles = useMemo(() => [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'admin', label: 'Administrateurs' },
    { value: 'manager', label: 'Gérants' },
    { value: 'seller', label: 'Vendeurs' }
  ], []);

  return {
    // Données
    users: filteredUsers,
    userStats,
    recentActivity,
    isLoading,
    error,
    
    // État
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    selectedStore,
    setSelectedStore,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Contexte utilisateur
    context,
    messages,
    actions,
    
    // Permissions
    canViewUsers,
    canViewAllUsers,
    canViewTeamUsers,
    canViewOwnProfile,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canManagePermissions,
    canViewActivity,
    
    // Actions
    createUser,
    updateUser,
    deleteUser,
    refreshData,
    
    // Utilitaires
    getRoleLabel,
    getRoleBadgeColor,
    getInitials,
    availableRoles
  };
}; 
