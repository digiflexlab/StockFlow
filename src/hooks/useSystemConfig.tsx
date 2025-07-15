
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserRoles } from './useUserRoles';
import type { SystemConfig } from '@/types/permissions';

export const useSystemConfig = () => {
  const { isAdmin } = useUserRoles();
  const queryClient = useQueryClient();

  const { data: systemConfig = [], isLoading: configLoading } = useQuery({
    queryKey: ['system_config'],
    queryFn: async () => {
      if (!isAdmin) return [];
      
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('config_key');

      if (error) throw error;
      return data as SystemConfig[];
    },
    enabled: isAdmin,
  });

  const updateSystemConfigMutation = useMutation({
    mutationFn: async ({ configKey, configValue }: { configKey: string; configValue: any }) => {
      const { data, error } = await supabase
        .from('system_config')
        .upsert({
          config_key: configKey,
          config_value: configValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'config_key'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_config'] });
      toast({
        title: "Configuration mise à jour",
        description: "La configuration système a été modifiée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de la configuration.",
        variant: "destructive",
      });
    },
  });

  const updateSystemConfig = (configKey: string, configValue: any) => {
    updateSystemConfigMutation.mutate({ configKey, configValue });
  };

  return {
    systemConfig,
    isLoading: configLoading,
    updateSystemConfig,
  };
};
