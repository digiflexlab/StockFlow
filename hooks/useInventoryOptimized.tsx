import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserRoles } from './useUserRoles';
import { useAuth } from './useAuth';

export interface InventorySession {
  id: number;
  name: string;
  store_id: number;
  created_by: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  stores?: {
    name: string;
  };
  inventory_items?: InventoryItem[];
  created_by_profile?: {
    name: string;
    role: string;
  };
}

export interface InventoryItem {
  id: number;
  session_id: number;
  product_id: number;
  expected_quantity: number;
  counted_quantity: number | null;
  difference: number | null;
  is_adjusted: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
    sku: string;
  };
}

export interface InventoryMetrics {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalItems: number;
  countedItems: number;
  adjustedItems: number;
  averageAccuracy: number;
  recentActivity: number;
}

export interface RoleBasedMessages {
  startSuccess: string;
  updateSuccess: string;
  completeSuccess: string;
  adjustSuccess: string;
  errorMessage: string;
  noAccessMessage: string;
  emptyStateMessage: string;
  loadingMessage: string;
}

const getRoleBasedMessages = (role: string): RoleBasedMessages => {
  switch (role) {
    case 'admin':
      return {
        startSuccess: "Session d'inventaire créée avec audit trail activé.",
        updateSuccess: "Comptage mis à jour. Changements enregistrés.",
        completeSuccess: "Inventaire finalisé avec rapport complet.",
        adjustSuccess: "Stock ajusté avec traçabilité complète.",
        errorMessage: "Erreur administrative. Vérifiez les logs.",
        noAccessMessage: "Accès administrateur requis pour l'inventaire.",
        emptyStateMessage: "Aucune session d'inventaire. Commencez par créer votre premier inventaire.",
        loadingMessage: "Chargement des données d'inventaire..."
      };
    case 'manager':
      return {
        startSuccess: "Nouvelle session d'inventaire démarrée pour votre magasin.",
        updateSuccess: "Comptage actualisé pour votre inventaire.",
        completeSuccess: "Inventaire terminé avec succès.",
        adjustSuccess: "Stock ajusté selon les comptages.",
        errorMessage: "Erreur lors de la gestion de l'inventaire.",
        noAccessMessage: "Permissions de gestion d'inventaire requises.",
        emptyStateMessage: "Aucune session d'inventaire disponible. Créez votre premier inventaire.",
        loadingMessage: "Récupération de vos sessions d'inventaire..."
      };
    case 'seller':
      return {
        startSuccess: "Session d'inventaire enregistrée pour consultation.",
        updateSuccess: "Comptage mis à jour pour consultation.",
        completeSuccess: "Inventaire marqué comme terminé.",
        adjustSuccess: "Ajustement de stock effectué.",
        errorMessage: "Erreur lors de l'opération d'inventaire.",
        noAccessMessage: "Accès en lecture seule autorisé pour l'inventaire.",
        emptyStateMessage: "Aucune session d'inventaire à consulter. Contactez votre manager.",
        loadingMessage: "Consultation des sessions d'inventaire..."
      };
    default:
      return {
        startSuccess: "Session d'inventaire créée.",
        updateSuccess: "Comptage mis à jour.",
        completeSuccess: "Inventaire terminé.",
        adjustSuccess: "Stock ajusté.",
        errorMessage: "Une erreur est survenue.",
        noAccessMessage: "Accès non autorisé.",
        emptyStateMessage: "Aucune session d'inventaire disponible.",
        loadingMessage: "Chargement..."
      };
  }
};

export const useInventoryOptimized = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller } = useUserRoles();
  const userRole = profile?.role || 'seller';
  const messages = getRoleBasedMessages(userRole);

  // Déterminer les permissions selon le rôle
  const canViewInventory = isAdmin || isManager || isSeller;
  const canCreateInventory = isAdmin || isManager;
  const canEditInventory = isAdmin || isManager;
  const canCompleteInventory = isAdmin || isManager;
  const canAdjustStock = isAdmin || isManager;
  const canViewMetrics = isAdmin || isManager;
  const canViewAllStores = isAdmin;
  const canViewAudit = isAdmin;

  // Query optimisée avec cache intelligent
  const { data: inventorySessions = [], isLoading, error } = useQuery({
    queryKey: ['inventory', 'sessions', 'optimized', userRole],
    queryFn: async () => {
      if (!canViewInventory) {
        throw new Error(messages.noAccessMessage);
      }

      let query = supabase
        .from('inventory_sessions')
        .select(`
          *,
          stores (name),
          created_by_profile:profiles!inventory_sessions_created_by_fkey (name, role),
          inventory_items (
            *,
            products (name, sku)
          )
        `)
        .order('created_at', { ascending: false });

      // Restriction par magasin pour les non-admin
      if (!canViewAllStores) {
        query = query.eq('store_id', profile?.store_ids?.[0] || 0);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as InventorySession[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: canViewInventory,
  });

  // Session active
  const activeSession = inventorySessions.find(session => session.status === 'active');

  // Métriques calculées
  const metrics: InventoryMetrics = {
    totalSessions: inventorySessions.length,
    activeSessions: inventorySessions.filter(s => s.status === 'active').length,
    completedSessions: inventorySessions.filter(s => s.status === 'completed').length,
    totalItems: inventorySessions.reduce((acc, session) => 
      acc + (session.inventory_items?.length || 0), 0),
    countedItems: inventorySessions.reduce((acc, session) => 
      acc + (session.inventory_items?.filter(item => item.counted_quantity !== null).length || 0), 0),
    adjustedItems: inventorySessions.reduce((acc, session) => 
      acc + (session.inventory_items?.filter(item => item.is_adjusted).length || 0), 0),
    averageAccuracy: calculateAverageAccuracy(inventorySessions),
    recentActivity: inventorySessions.filter(s => {
      const updatedAt = new Date(s.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return updatedAt > weekAgo;
    }).length
  };

  // Mutation de création de session avec validation des permissions
  const createInventorySessionMutation = useMutation({
    mutationFn: async ({ name, storeId }: { name: string; storeId: number }) => {
      if (!canCreateInventory) {
        throw new Error(messages.noAccessMessage);
      }

      // Vérifier qu'il n'y a pas déjà une session active pour ce magasin
      const { data: existingSession } = await supabase
        .from('inventory_sessions')
        .select('id')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .single();

      if (existingSession) {
        throw new Error("Une session d'inventaire est déjà active pour ce magasin.");
      }

      const { data: session, error } = await supabase
        .from('inventory_sessions')
        .insert({
          name,
          store_id: storeId,
          created_by: profile?.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Créer les éléments d'inventaire automatiquement
      await createInventoryItems(session.id, storeId);

      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Succès",
        description: messages.startSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || messages.errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation de mise à jour du comptage
  const updateCountMutation = useMutation({
    mutationFn: async ({ itemId, count }: { itemId: number; count: number }) => {
      if (!canEditInventory) {
        throw new Error(messages.noAccessMessage);
      }

      // Récupérer l'item pour calculer la différence
      const { data: item } = await supabase
        .from('inventory_items')
        .select('expected_quantity')
        .eq('id', itemId)
        .single();

      if (!item) throw new Error("Item d'inventaire non trouvé");

      const difference = count - item.expected_quantity;

      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          counted_quantity: count,
          difference: difference,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      // Log d'audit pour admin
      if (canViewAudit) {
        await supabase.from('audit_logs').insert({
          user_id: profile?.id,
          action: 'UPDATE_INVENTORY_COUNT',
          table_name: 'inventory_items',
          record_id: itemId.toString(),
          new_values: { counted_quantity: count, difference },
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Succès",
        description: messages.updateSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || messages.errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation d'ajustement de stock
  const adjustStockMutation = useMutation({
    mutationFn: async ({ itemId }: { itemId: number }) => {
      if (!canAdjustStock) {
        throw new Error(messages.noAccessMessage);
      }

      // Récupérer l'item et la session
      const { data: item } = await supabase
        .from('inventory_items')
        .select(`
          *,
          inventory_sessions!inner (store_id)
        `)
        .eq('id', itemId)
        .single();

      if (!item || item.counted_quantity === null) {
        throw new Error("Item non compté ou non trouvé");
      }

      // Marquer comme ajusté
      const { error: adjustError } = await supabase
        .from('inventory_items')
        .update({
          is_adjusted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (adjustError) throw adjustError;

      // Mettre à jour le stock réel
      const { error: stockError } = await supabase
        .from('stock')
        .update({
          quantity: item.counted_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', item.product_id)
        .eq('store_id', item.inventory_sessions.store_id);

      if (stockError) throw stockError;

      // Enregistrer le mouvement de stock
      await supabase.from('stock_movements').insert({
        product_id: item.product_id,
        store_id: item.inventory_sessions.store_id,
        movement_type: 'inventory_adjustment',
        quantity_change: item.counted_quantity - item.expected_quantity,
        reference_id: itemId,
        reference_type: 'inventory',
        user_id: profile?.id,
        notes: `Ajustement d'inventaire: ${item.expected_quantity} → ${item.counted_quantity}`
      });

      // Log d'audit pour admin
      if (canViewAudit) {
        await supabase.from('audit_logs').insert({
          user_id: profile?.id,
          action: 'ADJUST_INVENTORY_STOCK',
          table_name: 'inventory_items',
          record_id: itemId.toString(),
          new_values: { 
            is_adjusted: true, 
            stock_quantity: item.counted_quantity 
          },
        });
      }

      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Succès",
        description: messages.adjustSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || messages.errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation de finalisation d'inventaire
  const completeInventoryMutation = useMutation({
    mutationFn: async ({ sessionId }: { sessionId: number }) => {
      if (!canCompleteInventory) {
        throw new Error(messages.noAccessMessage);
      }

      const { data, error } = await supabase
        .from('inventory_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      // Log d'audit pour admin
      if (canViewAudit) {
        await supabase.from('audit_logs').insert({
          user_id: profile?.id,
          action: 'COMPLETE_INVENTORY',
          table_name: 'inventory_sessions',
          record_id: sessionId.toString(),
          new_values: { status: 'completed', completed_at: new Date().toISOString() },
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Succès",
        description: messages.completeSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || messages.errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fonction helper pour créer les éléments d'inventaire
  const createInventoryItems = async (sessionId: number, storeId: number) => {
    const { data: stockData } = await supabase
      .from('stock')
      .select(`
        product_id,
        quantity,
        products (name, sku)
      `)
      .eq('store_id', storeId);

    if (stockData && stockData.length > 0) {
      const inventoryItems = stockData.map(stock => ({
        session_id: sessionId,
        product_id: stock.product_id,
        expected_quantity: stock.quantity || 0
      }));

      await supabase
        .from('inventory_items')
        .insert(inventoryItems);
    }
  };

  // Fonction helper pour calculer la précision moyenne
  const calculateAverageAccuracy = (sessions: InventorySession[]): number => {
    const allItems = sessions.flatMap(session => session.inventory_items || []);
    const countedItems = allItems.filter(item => item.counted_quantity !== null);
    
    if (countedItems.length === 0) return 0;
    
    const totalAccuracy = countedItems.reduce((acc, item) => {
      const accuracy = Math.abs(item.difference || 0) / item.expected_quantity;
      return acc + (1 - accuracy);
    }, 0);
    
    return (totalAccuracy / countedItems.length) * 100;
  };

  // Fonctions d'export selon le rôle
  const exportInventoryReport = async (sessionId: number, format: 'csv' | 'json' = 'csv') => {
    if (!canViewInventory) {
      toast({
        title: "Accès refusé",
        description: messages.noAccessMessage,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data } = await supabase
        .from('inventory_items')
        .select(`
          *,
          products (name, sku),
          inventory_sessions (name, stores (name))
        `)
        .eq('session_id', sessionId);

      if (format === 'csv') {
        const csvContent = [
          'Produit,SKU,Quantité attendue,Quantité comptée,Différence,Ajusté',
          ...data.map(item => 
            `${item.products?.name || ''},${item.products?.sku || ''},${item.expected_quantity},${item.counted_quantity || 0},${item.difference || 0},${item.is_adjusted ? 'Oui' : 'Non'}`
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventaire_${sessionId}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventaire_${sessionId}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }

      toast({
        title: "Export réussi",
        description: `Rapport d'inventaire exporté en ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le rapport",
        variant: "destructive",
      });
    }
  };

  return {
    // Données
    inventorySessions,
    activeSession,
    metrics,
    isLoading,
    error,
    
    // Permissions
    canViewInventory,
    canCreateInventory,
    canEditInventory,
    canCompleteInventory,
    canAdjustStock,
    canViewMetrics,
    canViewAllStores,
    canViewAudit,
    
    // Rôle et messages
    userRole,
    messages,
    
    // Mutations
    createInventorySession: createInventorySessionMutation.mutate,
    updateCount: updateCountMutation.mutate,
    adjustStock: adjustStockMutation.mutate,
    completeInventory: completeInventoryMutation.mutate,
    isCreating: createInventorySessionMutation.isPending,
    isUpdating: updateCountMutation.isPending,
    isAdjusting: adjustStockMutation.isPending,
    isCompleting: completeInventoryMutation.isPending,
    
    // Fonctionnalités avancées
    exportInventoryReport,
    
    // Performance
    refetch: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  };
}; 