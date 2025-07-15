
import { useUserRoles } from './useUserRoles';
import { useSystemConfig } from './useSystemConfig';
import { useUserPermissions } from './useUserPermissions';

export const usePermissions = () => {
  const userRoles = useUserRoles();
  const systemConfig = useSystemConfig();
  const userPermissions = useUserPermissions();

  return {
    ...userRoles,
    ...systemConfig,
    ...userPermissions,
  };
};

// Export des types pour compatibilité
export type { Permission, SystemConfig, UserPermissions } from '@/types/permissions';
