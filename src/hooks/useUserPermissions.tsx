
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserRoles } from './useUserRoles';
import type { Permission } from '@/types/permissions';

export const useUserPermissions = () => {
  const { isAdmin } = useUserRoles();
  const queryClient = useQueryClient();

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['user_permissions'],
    queryFn: async () => {
      if (!isAdmin) return [];
      
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .order('created_at');

      if (error) throw error;
      return data as Permission[];
    },
    enabled: isAdmin,
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      permissionType, 
      permissionKey, 
      isGranted 
    }: { 
      userId: string;
      permissionType: string;
      permissionKey: string;
      isGranted: boolean;
    }) => {
      const { data, error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: userId,
          permission_type: permissionType,
          permission_key: permissionKey,
          is_granted: isGranted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,permission_type,permission_key'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_permissions'] });
      toast({
        title: "Permission mise à jour",
        description: "La permission utilisateur a été modifiée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de la permission.",
        variant: "destructive",
      });
    },
  });

  const updatePermission = (
    userId: string, 
    permissionType: string, 
    permissionKey: string, 
    isGranted: boolean
  ) => {
    updatePermissionMutation.mutate({ userId, permissionType, permissionKey, isGranted });
  };

  return {
    permissions,
    isLoading: permissionsLoading,
    updatePermission,
  };
};
