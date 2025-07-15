import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Unit, UnitFormData } from '@/types/units';

export const useUnits = () => {
  const queryClient = useQueryClient();

  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Unit[];
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async (unitData: UnitFormData) => {
      const { data, error } = await supabase
        .from('units')
        .insert({
          name: unitData.name.trim(),
          symbol: unitData.symbol.trim().toUpperCase(),
          description: unitData.description?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: "Unité créée",
        description: "L'unité a été créée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de l'unité.",
        variant: "destructive",
      });
    },
  });

  return {
    units,
    isLoading,
    error,
    createUnit: createUnitMutation.mutate,
    isCreating: createUnitMutation.isPending,
  };
}; 