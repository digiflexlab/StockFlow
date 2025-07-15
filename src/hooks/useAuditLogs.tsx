
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  };
}

export const useAuditLogs = () => {
  const { profile } = useAuth();

  const { data: auditLogs = [], isLoading, error } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      if (profile?.role !== 'admin') {
        return [];
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: profile?.role === 'admin',
  });

  return {
    auditLogs,
    isLoading,
    error,
  };
};
