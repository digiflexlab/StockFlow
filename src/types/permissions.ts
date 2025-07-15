
export interface Permission {
  id: string;
  user_id: string;
  permission_type: string;
  permission_key: string;
  is_granted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemConfig {
  id: string;
  config_key: string;
  config_value: any;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  // Produits
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  
  // Fournisseurs
  canCreateSuppliers: boolean;
  canEditSuppliers: boolean;
  canDeleteSuppliers: boolean;
  
  // Magasins
  canCreateStores: boolean;
  canEditStores: boolean;
  canDeleteStores: boolean;
  
  // Utilisateurs
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  
  // Ventes
  canCreateSales: boolean;
  canEditSales: boolean;
  canDeleteSales: boolean;
  
  // Rapports et finances
  canViewReports: boolean;
  canViewFinance: boolean;
  canManageInventory: boolean;
}
