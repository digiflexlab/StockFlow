
import { useSalesQuery } from './useSalesQuery';
import { useCreateSale } from './useCreateSale';
import { getSaleItems } from '@/services/saleService';

export const useSales = (storeId?: number) => {
  const { data: sales = [], isLoading, error } = useSalesQuery(storeId);
  const createSaleMutation = useCreateSale();

  return {
    sales,
    isLoading,
    error,
    createSale: createSaleMutation.mutate,
    isCreating: createSaleMutation.isPending,
    getSaleItems,
  };
};

// Export des types pour compatibilité
export type { Sale, SaleItem } from '@/types/sales';
