
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/products';

export const useProducts = () => {
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id(name),
          suppliers:supplier_id(name),
          units:unit_id(name, symbol)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
  });

  return {
    products,
    isLoading,
    error,
  };
};

// Export des types pour compatibilité
export type { Product, ProductFormData } from '@/types/products';
