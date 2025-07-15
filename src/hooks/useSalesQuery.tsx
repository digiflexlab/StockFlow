
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Sale } from '@/types/sales';

export const useSalesQuery = (storeId?: number) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['sales', storeId],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select(`
          *,
          stores(name),
          profiles(name)
        `);

      // Filtrer par magasin si spécifié
      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      // Filtrer selon les permissions utilisateur
      if (profile?.role === 'seller' && profile?.store_ids?.length > 0) {
        query = query.in('store_id', profile.store_ids);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Sale[];
    },
    enabled: !!profile,
  });
};
