
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ErrorDetails {
  action: string;
  table: string;
  error: any;
  recordId?: string;
  context?: Record<string, any>;
}

export const useErrorHandler = () => {
  const logError = async (details: ErrorDetails) => {
    try {
      // Log côté client pour debugging
      console.error(`[${details.action}] Error in ${details.table}:`, details.error, details.context);

      // Créer un log d'audit pour les erreurs critiques
      if (details.error?.code || details.error?.message?.includes('RLS')) {
        await supabase.rpc('create_audit_log', {
          p_action: `ERROR_${details.action}`,
          p_table_name: details.table,
          p_record_id: details.recordId || null,
          p_new_values: { 
            error_code: details.error?.code,
            error_message: details.error?.message,
            context: details.context 
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  const handleError = async (details: ErrorDetails) => {
    await logError(details);

    // Messages d'erreur personnalisés selon le type
    let userMessage = "Une erreur inattendue s'est produite.";
    
    if (details.error?.code === '23505') {
      userMessage = "Cette donnée existe déjà dans le système.";
    } else if (details.error?.code === '23503') {
      userMessage = "Impossible d'effectuer cette action car des données liées existent.";
    } else if (details.error?.code === '23514') {
      userMessage = "Les données saisies ne respectent pas les contraintes requises.";
    } else if (details.error?.message?.includes('RLS')) {
      userMessage = "Vous n'avez pas les permissions nécessaires pour cette action.";
    } else if (details.error?.message?.includes('violates check constraint')) {
      userMessage = "Les données saisies ne sont pas valides.";
    }

    toast({
      title: "Erreur",
      description: userMessage,
      variant: "destructive",
    });
  };

  return { handleError, logError };
};
