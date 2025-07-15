
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Store {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export const useStores = () => {
  const queryClient = useQueryClient();

  const { data: stores = [], isLoading, error } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Store[];
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: async (storeData: StoreFormData) => {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          name: storeData.name.trim(),
          address: storeData.address?.trim() || null,
          phone: storeData.phone?.trim() || null,
          email: storeData.email?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({
        title: "Magasin créé",
        description: "Le magasin a été créé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du magasin.",
        variant: "destructive",
      });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async ({ id, storeData }: { id: number; storeData: StoreFormData }) => {
      const { data, error } = await supabase
        .from('stores')
        .update({
          name: storeData.name.trim(),
          address: storeData.address?.trim() || null,
          phone: storeData.phone?.trim() || null,
          email: storeData.email?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({
        title: "Magasin modifié",
        description: "Le magasin a été modifié avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification du magasin.",
        variant: "destructive",
      });
    },
  });

  return {
    stores,
    isLoading,
    error,
    createStore: createStoreMutation.mutate,
    updateStore: updateStoreMutation.mutate,
    isCreating: createStoreMutation.isPending,
    isUpdating: updateStoreMutation.isPending,
  };
};
