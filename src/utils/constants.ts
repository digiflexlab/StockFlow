// Constantes pour l'application
export const APP_CONFIG = {
  name: 'StockFlow Pro',
  version: '1.0',
  defaultCurrency: 'XOF',
  defaultTaxRate: 0.20,
  minStockThreshold: 5,
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  SELLER: 'seller',
} as const;

export const SALE_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card', 
  CHECK: 'check',
  TRANSFER: 'transfer',
} as const;

export const STOCK_STATUS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

export const PERMISSION_CATEGORIES = [
  {
    name: 'Gestion des produits',
    key: 'products',
    permissions: [
      { key: 'create', name: 'Créer des produits' },
      { key: 'edit', name: 'Modifier des produits' },
      { key: 'delete', name: 'Supprimer des produits' },
      { key: 'view_all', name: 'Voir tous les produits' },
      { key: 'export', name: 'Exporter les données' }
    ]
  },
  {
    name: 'Gestion des ventes',
    key: 'sales',
    permissions: [
      { key: 'create', name: 'Créer des ventes' },
      { key: 'cancel', name: 'Annuler des ventes' },
      { key: 'refund', name: 'Rembourser des ventes' },
      { key: 'view_all', name: 'Voir toutes les ventes' },
      { key: 'reports', name: 'Accéder aux rapports' }
    ]
  },
  {
    name: 'Gestion des stocks',
    key: 'inventory',
    permissions: [
      { key: 'adjust', name: 'Ajuster les stocks' },
      { key: 'transfer', name: 'Transférer entre magasins' },
      { key: 'view_movements', name: 'Voir les mouvements' },
      { key: 'low_stock_alerts', name: 'Recevoir les alertes de stock' }
    ]
  },
  {
    name: 'Administration',
    key: 'admin',
    permissions: [
      { key: 'manage_users', name: 'Gérer les utilisateurs' },
      { key: 'system_config', name: 'Configuration système' },
      { key: 'view_analytics', name: 'Voir les analyses' },
      { key: 'backup_restore', name: 'Sauvegarde/Restauration' }
    ]
  }
] as const;

export const CURRENCY_OPTIONS = [
  { value: 'XOF', label: 'Franc CFA (XOF)', symbol: 'FCFA' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'USD', label: 'Dollar US ($)', symbol: '$' },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
] as const;