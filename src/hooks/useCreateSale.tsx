
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { createSaleWithItems, updateStockAfterSale } from '@/services/saleService';
import type { CreateSaleData } from '@/types/sales';

export const useCreateSale = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleData: CreateSaleData) => {
      if (!profile?.id) throw new Error('Utilisateur non authentifié');

      // Créer la vente et ses articles
      const sale = await createSaleWithItems(saleData, profile.id);

      // Mettre à jour le stock
      await updateStockAfterSale(saleData.items, saleData.store_id);

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({
        title: "Vente créée",
        description: "La vente a été enregistrée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Erreur création vente:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la vente.",
        variant: "destructive",
      });
    },
  });
};
