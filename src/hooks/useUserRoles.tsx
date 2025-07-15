
import { useAuth } from '@/hooks/useAuth';
import type { UserPermissions } from '@/types/permissions';

export const useUserRoles = (): UserPermissions & { isAdmin: boolean; isManager: boolean; isSeller: boolean } => {
  const { profile } = useAuth();

  // Permissions basées sur les rôles
  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const isSeller = profile?.role === 'seller';

  // Permissions simplifiées et cohérentes
  const permissions: UserPermissions = {
    // Produits
    canCreateProducts: isAdmin || isManager,
    canEditProducts: isAdmin || isManager,
    canDeleteProducts: isAdmin,
    
    // Fournisseurs
    canCreateSuppliers: isAdmin || isManager,
    canEditSuppliers: isAdmin || isManager,
    canDeleteSuppliers: isAdmin,
    
    // Magasins
    canCreateStores: isAdmin,
    canEditStores: isAdmin || isManager,
    canDeleteStores: isAdmin,
    
    // Utilisateurs
    canCreateUsers: isAdmin,
    canEditUsers: isAdmin,
    canDeleteUsers: isAdmin,
    
    // Ventes
    canCreateSales: isAdmin || isManager || isSeller,
    canEditSales: isAdmin || isManager,
    canDeleteSales: isAdmin,
    
    // Rapports et finances
    canViewReports: isAdmin || isManager,
    canViewFinance: isAdmin || isManager,
    canManageInventory: isAdmin || isManager,
  };

  return {
    ...permissions,
    isAdmin,
    isManager,
    isSeller,
  };
};
