import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { USER_ROLES, PERMISSION_CATEGORIES } from '@/utils/constants';

// Types améliorés
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'seller';
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalStores: number;
  activeUsers: number;
  totalRevenue: number;
  averageOrderValue: number;
  lowStockProducts: number;
}

export interface SystemConfig {
  id: string;
  config_key: string;
  config_value: any;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_type: string;
  permission_key: string;
  is_granted: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminConfigSettings {
  general: {
    companyName: string;
    defaultCurrency: string;
    language: string;
    timezone: string;
    dateFormat: string;
  };
  features: {
    enableSalesModule: boolean;
    enableReturnsModule: boolean;
    enableMultiStore: boolean;
    allowProductDeletion: boolean;
    enableAuditLog: boolean;
    enableNotifications: boolean;
  };
  security: {
    requireTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    enableIpWhitelist: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    lowStockAlerts: boolean;
    salesAlerts: boolean;
    systemAlerts: boolean;
  };
}

interface UseAdminConfigOptimizedReturn {
  // État
  users: SystemUser[];
  systemStats: SystemStats;
  systemConfig: SystemConfig[];
  permissions: UserPermission[];
  settings: AdminConfigSettings;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Actions
  updateUserRole: (userId: string, newRole: string) => Promise<void>;
  updateUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  updatePermission: (userId: string, permissionType: string, permissionKey: string, isGranted: boolean) => Promise<void>;
  updateSystemConfig: (configKey: string, configValue: any) => Promise<void>;
  updateSettings: (category: keyof AdminConfigSettings, key: string, value: any) => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Utilitaires
  canManageUsers: boolean;
  canManagePermissions: boolean;
  canManageSystemConfig: boolean;
  getUserPermissions: (userId: string) => UserPermission[];
  validateRoleChange: (currentRole: string, newRole: string) => string | null;
  getConfigValue: (key: string, defaultValue?: any) => any;
}

const DEFAULT_SETTINGS: AdminConfigSettings = {
  general: {
    companyName: 'StockFlow Pro',
    defaultCurrency: 'XOF',
    language: 'fr',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY'
  },
  features: {
    enableSalesModule: true,
    enableReturnsModule: true,
    enableMultiStore: true,
    allowProductDeletion: false,
    enableAuditLog: true,
    enableNotifications: true
  },
  security: {
    requireTwoFactor: false,
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    enableIpWhitelist: false
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    salesAlerts: true,
    systemAlerts: true
  }
};

export const useAdminConfigOptimized = (): UseAdminConfigOptimizedReturn => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  // États locaux
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Permissions
  const canManageUsers = useMemo(() => profile?.role === 'admin', [profile?.role]);
  const canManagePermissions = useMemo(() => profile?.role === 'admin', [profile?.role]);
  const canManageSystemConfig = useMemo(() => profile?.role === 'admin', [profile?.role]);

  // Validation des rôles
  const validateRoleChange = useCallback((currentRole: string, newRole: string): string | null => {
    if (!Object.values(USER_ROLES).includes(newRole as any)) {
      return 'Rôle invalide sélectionné';
    }
    
    if (currentRole === 'admin' && newRole !== 'admin') {
      return 'Impossible de rétrograder un administrateur';
    }
    
    if (newRole === 'admin' && currentRole !== 'admin') {
      return 'Élévation de privilèges nécessite une validation';
    }
    
    return null;
  }, []);

  // Chargement des utilisateurs
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      if (!canManageUsers) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SystemUser[];
    },
    enabled: canManageUsers,
  });

  // Chargement des statistiques système
  const { data: systemStats = {
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalStores: 0,
    activeUsers: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    lowStockProducts: 0
  }, isLoading: statsLoading } = useQuery({
    queryKey: ['system_stats'],
    queryFn: async () => {
      if (!canManageSystemConfig) return systemStats;
      
      const [
        usersCount,
        productsCount,
        salesCount,
        storesCount,
        activeUsersCount,
        revenueData,
        lowStockCount
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('sales').select('id,total_amount', { count: 'exact' }),
        supabase.from('stores').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('sales').select('total_amount').eq('status', 'completed'),
        supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock_quantity', 10)
      ]);

      const totalRevenue = revenueData.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const averageOrderValue = salesCount.data && salesCount.data.length > 0 
        ? totalRevenue / salesCount.data.length 
        : 0;

      return {
        totalUsers: usersCount.count || 0,
        totalProducts: productsCount.count || 0,
        totalSales: salesCount.count || 0,
        totalStores: storesCount.count || 0,
        activeUsers: activeUsersCount.count || 0,
        totalRevenue,
        averageOrderValue,
        lowStockProducts: lowStockCount.count || 0
      };
    },
    enabled: canManageSystemConfig,
    refetchInterval: 300000, // Rafraîchir toutes les 5 minutes
  });

  // Chargement de la configuration système
  const { data: systemConfig = [], isLoading: configLoading } = useQuery({
    queryKey: ['system_config'],
    queryFn: async () => {
      if (!canManageSystemConfig) return [];
      
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('config_key');

      if (error) throw error;
      return data as SystemConfig[];
    },
    enabled: canManageSystemConfig,
  });

  // Chargement des permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['user_permissions'],
    queryFn: async () => {
      if (!canManagePermissions) return [];
      
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .order('created_at');

      if (error) throw error;
      return data as UserPermission[];
    },
    enabled: canManagePermissions,
  });

  // Récupération des paramètres depuis la configuration
  const settings = useMemo(() => {
    const config = {
      general: getConfigValue('general_settings', DEFAULT_SETTINGS.general),
      features: getConfigValue('feature_flags', DEFAULT_SETTINGS.features),
      security: getConfigValue('security_settings', DEFAULT_SETTINGS.security),
      notifications: getConfigValue('notification_settings', DEFAULT_SETTINGS.notifications)
    };
    
    return config as AdminConfigSettings;
  }, [systemConfig]);

  // Fonction utilitaire pour récupérer une valeur de configuration
  const getConfigValue = useCallback((key: string, defaultValue: any = {}) => {
    const config = systemConfig.find(c => c.config_key === key);
    return config ? config.config_value : defaultValue;
  }, [systemConfig]);

  // Récupération des permissions d'un utilisateur
  const getUserPermissions = useCallback((userId: string): UserPermission[] => {
    return permissions.filter(p => p.user_id === userId);
  }, [permissions]);

  // Mutation pour mettre à jour le rôle d'un utilisateur
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('Utilisateur introuvable');

      const validationError = validateRoleChange(user.role, newRole);
      if (validationError) throw new Error(validationError);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole as 'admin' | 'manager' | 'seller', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;
      return { userId, newRole };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast({
        title: "Rôle mis à jour",
        description: `Le rôle de l'utilisateur a été modifié vers ${data.newRole}.`,
      });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification du rôle.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour le statut d'un utilisateur
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: isActive, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;
      return { userId, isActive };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast({
        title: "Statut mis à jour",
        description: `L'utilisateur a été ${data.isActive ? 'activé' : 'désactivé'}.`,
      });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification du statut.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour les permissions
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      permissionType, 
      permissionKey, 
      isGranted 
    }: { 
      userId: string;
      permissionType: string;
      permissionKey: string;
      isGranted: boolean;
    }) => {
      const { data, error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: userId,
          permission_type: permissionType,
          permission_key: permissionKey,
          is_granted: isGranted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,permission_type,permission_key'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_permissions'] });
      toast({
        title: "Permission mise à jour",
        description: "La permission utilisateur a été modifiée avec succès.",
      });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de la permission.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour la configuration système
  const updateSystemConfigMutation = useMutation({
    mutationFn: async ({ configKey, configValue }: { configKey: string; configValue: any }) => {
      const { data, error } = await supabase
        .from('system_config')
        .upsert({
          config_key: configKey,
          config_value: configValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'config_key'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_config'] });
      toast({
        title: "Configuration mise à jour",
        description: "La configuration système a été modifiée avec succès.",
      });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de la configuration.",
        variant: "destructive",
      });
    },
  });

  // Actions
  const updateUserRole = useCallback(async (userId: string, newRole: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      await updateUserRoleMutation.mutateAsync({ userId, newRole });
    } finally {
      setIsUpdating(false);
    }
  }, [updateUserRoleMutation]);

  const updateUserStatus = useCallback(async (userId: string, isActive: boolean) => {
    setIsUpdating(true);
    setError(null);
    try {
      await updateUserStatusMutation.mutateAsync({ userId, isActive });
    } finally {
      setIsUpdating(false);
    }
  }, [updateUserStatusMutation]);

  const updatePermission = useCallback(async (
    userId: string, 
    permissionType: string, 
    permissionKey: string, 
    isGranted: boolean
  ) => {
    setIsUpdating(true);
    setError(null);
    try {
      await updatePermissionMutation.mutateAsync({ userId, permissionType, permissionKey, isGranted });
    } finally {
      setIsUpdating(false);
    }
  }, [updatePermissionMutation]);

  const updateSystemConfig = useCallback(async (configKey: string, configValue: any) => {
    setIsUpdating(true);
    setError(null);
    try {
      await updateSystemConfigMutation.mutateAsync({ configKey, configValue });
    } finally {
      setIsUpdating(false);
    }
  }, [updateSystemConfigMutation]);

  const updateSettings = useCallback(async (category: keyof AdminConfigSettings, key: string, value: any) => {
    const currentSettings = settings[category];
    const updatedSettings = { ...currentSettings, [key]: value };
    
    let configKey: string;
    switch (category) {
      case 'general':
        configKey = 'general_settings';
        break;
      case 'features':
        configKey = 'feature_flags';
        break;
      case 'security':
        configKey = 'security_settings';
        break;
      case 'notifications':
        configKey = 'notification_settings';
        break;
      default:
        throw new Error('Catégorie de paramètres invalide');
    }
    
    await updateSystemConfig(configKey, updatedSettings);
  }, [settings, updateSystemConfig]);

  const refreshData = useCallback(async () => {
    setError(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin_users'] }),
      queryClient.invalidateQueries({ queryKey: ['system_stats'] }),
      queryClient.invalidateQueries({ queryKey: ['system_config'] }),
      queryClient.invalidateQueries({ queryKey: ['user_permissions'] })
    ]);
  }, [queryClient]);

  // États de chargement
  const isLoading = usersLoading || statsLoading || configLoading || permissionsLoading;

  return {
    // État
    users,
    systemStats,
    systemConfig,
    permissions,
    settings,
    isLoading,
    isUpdating,
    error,
    
    // Actions
    updateUserRole,
    updateUserStatus,
    updatePermission,
    updateSystemConfig,
    updateSettings,
    refreshData,
    
    // Utilitaires
    canManageUsers,
    canManagePermissions,
    canManageSystemConfig,
    getUserPermissions,
    validateRoleChange,
    getConfigValue,
  };
}; 