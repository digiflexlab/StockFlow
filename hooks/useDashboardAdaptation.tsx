import { useMemo } from 'react';
import { useUserRoles } from './useUserRoles';
import { useAuth } from './useAuth';

export interface DashboardAdaptation {
  // Actions rapides adaptatives
  quickActions: Array<{
    label: string;
    icon: any;
    action: () => void;
    color: string;
    roles: string[];
  }>;
  
  // Messages personnalisés
  greeting: string;
  description: string;
  
  // Filtres de données
  dataFilters: {
    includeAllStores: boolean;
    includeAllProducts: boolean;
    storeIds: number[];
  };
  
  // Métriques adaptatives
  metrics: {
    showAllMetrics: boolean;
    showUserMetrics: boolean;
    showStoreMetrics: boolean;
  };
  
  // Permissions d'affichage
  displayPermissions: {
    canViewAnalytics: boolean;
    canViewFinance: boolean;
    canViewReports: boolean;
    canManageInventory: boolean;
    canCreateProducts: boolean;
    canViewAdminConfig: boolean;
  };
}

export const useDashboardAdaptation = (onPageChange: (page: string) => void): DashboardAdaptation => {
  const { profile } = useAuth();
  const { 
    isAdmin, 
    isManager, 
    isSeller,
    canViewReports,
    canViewFinance,
    canManageInventory,
    canCreateProducts
  } = useUserRoles();

  return useMemo(() => {
    const userRole = profile?.role || 'seller';
    const userStoreIds = profile?.store_ids || [];

    // Actions rapides adaptatives
    const quickActions = [
      {
        label: 'Nouvelle vente',
        icon: 'ShoppingCart',
        action: () => onPageChange('sales'),
        color: 'bg-green-600 hover:bg-green-700',
        roles: ['admin', 'manager', 'seller']
      }
    ];

    // Ajouter des actions selon les permissions
    if (canCreateProducts) {
      quickActions.push({
        label: 'Ajouter produit',
        icon: 'Package',
        action: () => onPageChange('products'),
        color: 'bg-blue-600 hover:bg-blue-700',
        roles: ['admin', 'manager']
      });
    }

    if (canManageInventory) {
      quickActions.push({
        label: 'Inventaire',
        icon: 'Package',
        action: () => onPageChange('inventory'),
        color: 'bg-purple-600 hover:bg-purple-700',
        roles: ['admin', 'manager']
      });
    }

    if (canViewReports) {
      quickActions.push({
        label: 'Analytics',
        icon: 'BarChart3',
        action: () => onPageChange('analytics'),
        color: 'bg-indigo-600 hover:bg-indigo-700',
        roles: ['admin', 'manager']
      });
    }

    if (isAdmin) {
      quickActions.push({
        label: 'Configuration',
        icon: 'Settings',
        action: () => onPageChange('admin-config'),
        color: 'bg-gray-600 hover:bg-gray-700',
        roles: ['admin']
      });
    }

    // Filtrer les actions selon le rôle
    const filteredActions = quickActions.filter(action => action.roles.includes(userRole));

    // Messages personnalisés
    const roleLabels = {
      admin: 'Administrateur',
      manager: 'Gérant',
      seller: 'Vendeur'
    };

    const greeting = `Bonjour ${profile?.name?.split(' ')[0] || 'Utilisateur'} ! 👋 (${roleLabels[userRole]})`;

    let description = '';
    if (userRole === 'admin') {
      description = "Vue d'ensemble complète de votre système";
    } else if (userRole === 'manager') {
      description = `Aperçu de vos ${userStoreIds.length} magasin(s) assigné(s)`;
    } else {
      description = "Aperçu de votre activité aujourd'hui";
    }

    // Filtres de données
    const dataFilters = {
      includeAllStores: userRole === 'admin',
      includeAllProducts: userRole === 'admin',
      storeIds: userStoreIds
    };

    // Métriques adaptatives
    const metrics = {
      showAllMetrics: userRole === 'admin',
      showUserMetrics: userRole === 'seller',
      showStoreMetrics: userRole === 'manager'
    };

    // Permissions d'affichage
    const displayPermissions = {
      canViewAnalytics: canViewReports,
      canViewFinance: canViewFinance,
      canViewReports: canViewReports,
      canManageInventory: canManageInventory,
      canCreateProducts: canCreateProducts,
      canViewAdminConfig: isAdmin
    };

    return {
      quickActions: filteredActions,
      greeting,
      description,
      dataFilters,
      metrics,
      displayPermissions
    };
  }, [profile, isAdmin, isManager, isSeller, canViewReports, canViewFinance, canManageInventory, canCreateProducts, onPageChange]);
}; 