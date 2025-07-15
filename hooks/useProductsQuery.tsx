
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Product } from '@/types/products';

export const useProductsQuery = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['products', profile?.role, profile?.store_ids],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories:category_id(name),
          suppliers:supplier_id(name)
        `)
        .eq('is_active', true);

      // Filtrer selon le rôle et les magasins assignés
      if (profile?.role === 'seller' && profile?.store_ids?.length > 0) {
        // Pour les sellers, ne montrer que les produits avec stock dans leurs magasins
        const { data: stockData, error: stockError } = await supabase
          .from('stock')
          .select('product_id')
          .in('store_id', profile.store_ids)
          .gt('quantity', 0);

        if (stockError) throw stockError;

        if (stockData && stockData.length > 0) {
          const productIds = [...new Set(stockData.map(item => item.product_id))];
          query = query.in('id', productIds);
        } else {
          // Si aucun stock, retourner un tableau vide
          return [];
        }
      } else if (profile?.role === 'manager' && profile?.store_ids?.length > 0) {
        // Pour les managers, optimiser en récupérant les produits avec stock dans leurs magasins
        // mais aussi les produits sans stock pour une vue complète
        const { data: stockData, error: stockError } = await supabase
          .from('stock')
          .select('product_id, store_id, quantity')
          .in('store_id', profile.store_ids);

        if (stockError) throw stockError;

        // Créer un set des produits avec stock pour optimisation
        const productsWithStock = new Set(stockData?.map(item => item.product_id) || []);
        
        // Ajouter des métadonnées pour l'affichage adaptatif
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Enrichir les données avec les informations de stock par magasin
        return data.map(product => ({
          ...product,
          _stockByStore: stockData?.filter(stock => stock.product_id === product.id) || [],
          _hasStockInAssignedStores: productsWithStock.has(product.id)
        })) as Product[];
      }
      // Admin voit tous les produits (pas de filtre)

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
