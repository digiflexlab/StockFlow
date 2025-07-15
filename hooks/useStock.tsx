
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface StockItem {
  id: number;
  product_id: number;
  store_id: number;
  quantity: number;
  min_threshold: number;
  reserved_quantity: number;
  updated_at: string;
  products?: {
    name: string;
    sku: string;
    current_price: number;
  };
  stores?: {
    name: string;
  };
}

export const useStock = (storeId?: number) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: stock = [], isLoading, error } = useQuery({
    queryKey: ['stock', storeId],
    queryFn: async () => {
      let query = supabase
        .from('stock')
        .select(`
          *,
          products(name, sku, current_price),
          stores(name)
        `);

      // Filtrer par magasin si spécifié
      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      // Filtrer selon les permissions
      if (profile?.role === 'seller' && profile?.store_ids?.length > 0) {
        query = query.in('store_id', profile.store_ids);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return data as StockItem[];
    },
    enabled: !!profile,
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ 
      productId, 
      storeId, 
      quantity, 
      minThreshold 
    }: { 
      productId: number; 
      storeId: number; 
      quantity?: number; 
      minThreshold?: number;
    }) => {
      const updates: any = {};
      if (quantity !== undefined) updates.quantity = quantity;
      if (minThreshold !== undefined) updates.min_threshold = minThreshold;
      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('stock')
        .update(updates)
        .eq('product_id', productId)
        .eq('store_id', storeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({
        title: "Stock mis à jour",
        description: "Les quantités ont été mises à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error('Erreur mise à jour stock:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le stock.",
        variant: "destructive",
      });
    },
  });

  const createStockMutation = useMutation({
    mutationFn: async ({ 
      productId, 
      storeId, 
      quantity, 
      minThreshold = 5 
    }: { 
      productId: number; 
      storeId: number; 
      quantity: number; 
      minThreshold?: number;
    }) => {
      const { error } = await supabase
        .from('stock')
        .insert({
          product_id: productId,
          store_id: storeId,
          quantity,
          min_threshold: minThreshold,
          reserved_quantity: 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({
        title: "Stock créé",
        description: "Le stock a été créé avec succès.",
      });
    },
    onError: (error) => {
      console.error('Erreur création stock:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le stock.",
        variant: "destructive",
      });
    },
  });

  const getProductStock = (productId: number, storeId?: number) => {
    if (storeId) {
      const stockItem = stock.find(s => s.product_id === productId && s.store_id === storeId);
      return stockItem ? stockItem.quantity : 0;
    }
    return stock
      .filter(s => s.product_id === productId)
      .reduce((total, s) => total + s.quantity, 0);
  };

  const getLowStockItems = () => {
    return stock.filter(s => s.quantity <= s.min_threshold);
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: 'Rupture', color: 'bg-red-100 text-red-800' };
    if (quantity <= threshold) return { label: 'Stock faible', color: 'bg-orange-100 text-orange-800' };
    return { label: 'En stock', color: 'bg-green-100 text-green-800' };
  };

  const getStockValue = () => {
    return stock.reduce((total, item) => {
      const price = item.products?.current_price || 0;
      return total + (item.quantity * price);
    }, 0);
  };

  return {
    stock,
    isLoading,
    error,
    getProductStock,
    getLowStockItems,
    getStockStatus,
    getStockValue,
    updateStock: updateStockMutation.mutate,
    createStock: createStockMutation.mutate,
    isUpdating: updateStockMutation.isPending,
    isCreating: createStockMutation.isPending,
  };
};
