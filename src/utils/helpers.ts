import { STOCK_STATUS, USER_ROLES, SALE_STATUS, PAYMENT_METHODS } from './constants';

/**
 * Calcule le statut du stock basé sur la quantité et le seuil minimum
 */
export const getStockStatus = (quantity: number, minThreshold: number = 5) => {
  if (quantity === 0) {
    return {
      status: STOCK_STATUS.OUT_OF_STOCK,
      label: 'Rupture de stock',
      color: 'bg-red-100 text-red-800',
      priority: 'critical'
    };
  }
  
  if (quantity <= minThreshold) {
    return {
      status: STOCK_STATUS.LOW,
      label: 'Stock faible',
      color: 'bg-yellow-100 text-yellow-800',
      priority: 'warning'
    };
  }
  
  if (quantity <= minThreshold * 2) {
    return {
      status: STOCK_STATUS.MEDIUM,
      label: 'Stock moyen',
      color: 'bg-blue-100 text-blue-800',
      priority: 'info'
    };
  }
  
  return {
    status: STOCK_STATUS.HIGH,
    label: 'Stock suffisant',
    color: 'bg-green-100 text-green-800',
    priority: 'success'
  };
};

/**
 * Vérifie si un produit est expiré
 */
export const isExpired = (expirationDate: string | null): boolean => {
  if (!expirationDate) return false;
  return new Date(expirationDate) < new Date();
};

/**
 * Vérifie si un produit expire bientôt (dans les 30 jours)
 */
export const isExpiringSoon = (expirationDate: string | null, daysThreshold: number = 30): boolean => {
  if (!expirationDate) return false;
  
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= daysThreshold && diffDays > 0;
};

/**
 * Génère un badge de statut pour les ventes
 */
export const getSaleStatusBadge = (status: string) => {
  const statusConfig = {
    [SALE_STATUS.PENDING]: { 
      color: 'bg-yellow-100 text-yellow-800', 
      label: 'En attente' 
    },
    [SALE_STATUS.COMPLETED]: { 
      color: 'bg-green-100 text-green-800', 
      label: 'Terminée' 
    },
    [SALE_STATUS.CANCELLED]: { 
      color: 'bg-red-100 text-red-800', 
      label: 'Annulée' 
    },
    [SALE_STATUS.REFUNDED]: { 
      color: 'bg-blue-100 text-blue-800', 
      label: 'Remboursée' 
    },
  };
  
  return statusConfig[status] || { 
    color: 'bg-gray-100 text-gray-800', 
    label: status 
  };
};

/**
 * Traduit les méthodes de paiement
 */
export const getPaymentMethodLabel = (method: string): string => {
  const methods = {
    [PAYMENT_METHODS.CASH]: 'Espèces',
    [PAYMENT_METHODS.CARD]: 'Carte',
    [PAYMENT_METHODS.CHECK]: 'Chèque',
    [PAYMENT_METHODS.TRANSFER]: 'Virement'
  };
  return methods[method] || method;
};

/**
 * Traduit les rôles utilisateur
 */
export const getRoleLabel = (role: string): string => {
  const roleLabels = {
    [USER_ROLES.ADMIN]: 'Administrateur',
    [USER_ROLES.MANAGER]: 'Gérant',
    [USER_ROLES.SELLER]: 'Vendeur'
  };
  return roleLabels[role] || role;
};

/**
 * Génère une couleur de badge pour les rôles
 */
export const getRoleBadgeColor = (role: string): string => {
  const colors = {
    [USER_ROLES.ADMIN]: 'bg-red-100 text-red-800',
    [USER_ROLES.MANAGER]: 'bg-blue-100 text-blue-800',
    [USER_ROLES.SELLER]: 'bg-green-100 text-green-800'
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};

/**
 * Calcule la TVA
 */
export const calculateTax = (amount: number, taxRate: number = 0.20): number => {
  return amount * taxRate;
};

/**
 * Calcule le total avec TVA
 */
export const calculateTotal = (subtotal: number, taxAmount: number, discount: number = 0): number => {
  return Math.max(0, subtotal + taxAmount - discount);
};

/**
 * Filtre les éléments selon les permissions utilisateur
 */
export const filterByUserPermissions = <T extends { roles?: string[] }>(
  items: T[], 
  userRole: string
): T[] => {
  return items.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );
};

/**
 * Génère un ID unique simple
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Compare deux objets pour détecter les changements
 */
export const hasChanged = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) !== JSON.stringify(obj2);
};

/**
 * Debounce une fonction
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
};

/**
 * Groupe des éléments par une propriété
 */
export const groupBy = <T, K extends keyof T>(
  array: T[], 
  key: K
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    groups[groupKey] = groups[groupKey] || [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};