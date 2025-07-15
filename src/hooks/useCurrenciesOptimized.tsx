import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';

// Types pour les devises
export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate: number;
  is_base: boolean;
  is_active: boolean;
  last_updated: string;
  created_at: string;
}

export interface CreateCurrencyData {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  is_base?: boolean;
  is_active?: boolean;
}

export interface UpdateCurrencyData {
  code?: string;
  name?: string;
  symbol?: string;
  rate?: number;
  is_base?: boolean;
  is_active?: boolean;
}

export interface CurrencyContext {
  role: string;
  permissions: string[];
  isAdmin: boolean;
  isManager: boolean;
  isSeller: boolean;
  canManageCurrencies: boolean;
  canViewCurrencies: boolean;
  canUpdateRates: boolean;
  canDeleteCurrencies: boolean;
}

export interface CurrencyMetrics {
  totalCurrencies: number;
  activeCurrencies: number;
  baseCurrency: string;
  lastUpdate: string;
  conversionCount: number;
}

// Messages adaptatifs par rôle
const getRoleBasedMessages = (role: string) => ({
  loading: {
    admin: "Chargement des devises et configuration système...",
    manager: "Récupération des devises disponibles...",
    seller: "Chargement des taux de change...",
    default: "Chargement des devises..."
  },
  empty: {
    admin: "Aucune devise configurée. Créez la première devise pour commencer.",
    manager: "Aucune devise disponible. Contactez l'administrateur.",
    seller: "Aucune devise configurée pour les conversions.",
    default: "Aucune devise configurée."
  },
  error: {
    admin: "Erreur lors du chargement. Vérifiez la configuration système.",
    manager: "Impossible de charger les devises. Contactez l'administrateur.",
    seller: "Erreur de connexion aux taux de change.",
    default: "Erreur lors du chargement des devises."
  },
  success: {
    create: {
      admin: "Devise créée avec succès. Configuration mise à jour.",
      manager: "Devise ajoutée au système.",
      seller: "Nouvelle devise disponible pour les conversions.",
      default: "Devise créée avec succès."
    },
    update: {
      admin: "Devise mise à jour. Tous les calculs ont été ajustés.",
      manager: "Modifications enregistrées.",
      seller: "Taux de change mis à jour.",
      default: "Devise mise à jour avec succès."
    },
    delete: {
      admin: "Devise supprimée. Vérifiez les impacts sur les données existantes.",
      manager: "Devise retirée du système.",
      seller: "Devise non disponible pour les conversions.",
      default: "Devise supprimée avec succès."
    }
  }
});

// Hook optimisé pour les devises
export const useCurrenciesOptimized = () => {
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller } = useUserRoles();
  const queryClient = useQueryClient();
  
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [conversionHistory, setConversionHistory] = useState<Array<{
    from: string;
    to: string;
    amount: number;
    result: number;
    timestamp: Date;
  }>>([]);

  // Contexte utilisateur optimisé
  const context: CurrencyContext = useMemo(() => {
    const role = profile?.role || 'seller';
    const permissions = profile?.permissions || [];
    
    return {
      role,
      permissions,
      isAdmin,
      isManager,
      isSeller,
      canManageCurrencies: isAdmin || isManager,
      canViewCurrencies: true, // Tous les utilisateurs peuvent voir
      canUpdateRates: isAdmin || isManager,
      canDeleteCurrencies: isAdmin,
    };
  }, [profile, isAdmin, isManager, isSeller]);

  // Messages adaptatifs
  const messages = useMemo(() => getRoleBasedMessages(context.role), [context.role]);

  // Métriques des devises
  const metrics: CurrencyMetrics = useMemo(() => {
    const currencies = queryClient.getQueryData<Currency[]>(['currencies']) || [];
    const baseCurrency = currencies.find(c => c.is_base);
    
    return {
      totalCurrencies: currencies.length,
      activeCurrencies: currencies.filter(c => c.is_active).length,
      baseCurrency: baseCurrency?.code || 'XOF',
      lastUpdate: baseCurrency?.last_updated || 'Jamais',
      conversionCount: conversionHistory.length,
    };
  }, [queryClient, conversionHistory]);

  // Récupérer toutes les devises avec cache
  const {
    data: currencies = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('is_base', { ascending: false })
        .order('code');

      if (error) throw error;

      if (data && data.length === 0) {
        // Créer les devises par défaut si aucune n'existe
        await createDefaultCurrencies();
        return await refetch();
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Devise de base
  const baseCurrency = useMemo(() => 
    currencies.find(c => c.is_base) || null, 
    [currencies]
  );

  // Créer les devises par défaut
  const createDefaultCurrencies = useCallback(async () => {
    try {
      const defaultCurrencies = [
        {
          code: 'XOF',
          name: 'Franc CFA (BCEAO)',
          symbol: 'CFA',
          rate: 1.0,
          is_base: true,
          is_active: true,
        },
        {
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          rate: 0.00152,
          is_base: false,
          is_active: true,
        },
        {
          code: 'USD',
          name: 'Dollar Américain',
          symbol: '$',
          rate: 0.00165,
          is_base: false,
          is_active: true,
        }
      ];

      const { error } = await supabase
        .from('currencies')
        .insert(defaultCurrencies);

      if (error) throw error;

      toast({
        title: "Devises initialisées",
        description: messages.success.create[context.role as keyof typeof messages.success.create] || messages.success.create.default,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Impossible de créer les devises par défaut.",
        variant: "destructive",
      });
      throw err;
    }
  }, [messages, context.role]);

  // Mutation pour créer une devise
  const createCurrencyMutation = useMutation({
    mutationFn: async (currencyData: CreateCurrencyData) => {
      if (!context.canManageCurrencies) {
        throw new Error('Permissions insuffisantes pour créer une devise');
      }

      const { data, error } = await supabase
        .from('currencies')
        .insert([currencyData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currencies'], (old: Currency[] = []) => [...old, data]);
      toast({
        title: "Devise créée",
        description: messages.success.create[context.role as keyof typeof messages.success.create] || messages.success.create.default,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer la devise.",
        variant: "destructive",
      });
    }
  });

  // Mutation pour mettre à jour une devise
  const updateCurrencyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateCurrencyData }) => {
      if (!context.canManageCurrencies) {
        throw new Error('Permissions insuffisantes pour modifier une devise');
      }

      const { data, error } = await supabase
        .from('currencies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currencies'], (old: Currency[] = []) => 
        old.map(c => c.id === data.id ? data : c)
      );
      
      if (data.is_base) {
        queryClient.setQueryData(['baseCurrency'], data);
      }

      toast({
        title: "Devise mise à jour",
        description: messages.success.update[context.role as keyof typeof messages.success.update] || messages.success.update.default,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour la devise.",
        variant: "destructive",
      });
    }
  });

  // Mutation pour supprimer une devise
  const deleteCurrencyMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!context.canDeleteCurrencies) {
        throw new Error('Permissions insuffisantes pour supprimer une devise');
      }

      const currency = currencies.find(c => c.id === id);
      if (!currency) throw new Error('Devise non trouvée');
      if (currency.is_base) throw new Error('Impossible de supprimer la devise de base');

      const { error } = await supabase
        .from('currencies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return currency;
    },
    onSuccess: (deletedCurrency) => {
      queryClient.setQueryData(['currencies'], (old: Currency[] = []) => 
        old.filter(c => c.id !== deletedCurrency.id)
      );
      
      toast({
        title: "Devise supprimée",
        description: messages.success.delete[context.role as keyof typeof messages.success.delete] || messages.success.delete.default,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer la devise.",
        variant: "destructive",
      });
    }
  });

  // Basculer le statut d'une devise
  const toggleCurrencyStatus = useCallback(async (id: number) => {
    if (!context.canManageCurrencies) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour modifier les devises.",
        variant: "destructive",
      });
      return;
    }

    const currency = currencies.find(c => c.id === id);
    if (!currency) return;

    updateCurrencyMutation.mutate({
      id,
      updates: { is_active: !currency.is_active }
    });
  }, [currencies, context.canManageCurrencies, updateCurrencyMutation]);

  // Mettre à jour les taux de change
  const updateExchangeRates = useCallback(async () => {
    if (!context.canUpdateRates) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour mettre à jour les taux.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulation de mise à jour des taux
      const updatedCurrencies = currencies.map(currency => ({
        ...currency,
        rate: currency.is_base ? 1.0 : Math.random() * 0.01 + 0.001,
        last_updated: new Date().toISOString()
      }));

      // Mettre à jour chaque devise
      for (const currency of updatedCurrencies) {
        if (!currency.is_base) {
          await updateCurrencyMutation.mutateAsync({
            id: currency.id,
            updates: { 
              rate: currency.rate,
              last_updated: currency.last_updated
            }
          });
        }
      }

      toast({
        title: "Taux mis à jour",
        description: "Les taux de change ont été actualisés avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les taux de change.",
        variant: "destructive",
      });
    }
  }, [currencies, context.canUpdateRates, updateCurrencyMutation]);

  // Convertir un montant
  const convertAmount = useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    const from = currencies.find(c => c.code === fromCurrency);
    const to = currencies.find(c => c.code === toCurrency);

    if (!from || !to) return amount;

    // Conversion via la devise de base
    const amountInBase = amount * from.rate;
    const convertedAmount = amountInBase / to.rate;

    // Enregistrer la conversion dans l'historique
    setConversionHistory(prev => [...prev, {
      from: fromCurrency,
      to: toCurrency,
      amount,
      result: convertedAmount,
      timestamp: new Date()
    }]);

    return convertedAmount;
  }, [currencies]);

  // Formater un montant selon la devise
  const formatCurrency = useCallback((amount: number, currencyCode: string): string => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return amount.toString();

    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  }, [currencies]);

  // Exporter les données
  const exportCurrencies = useCallback(async () => {
    if (!context.canManageCurrencies) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour exporter les données.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const csvData = currencies.map(c => ({
        Code: c.code,
        Nom: c.name,
        Symbole: c.symbol,
        Taux: c.rate,
        'Devise de base': c.is_base ? 'Oui' : 'Non',
        'Actif': c.is_active ? 'Oui' : 'Non',
        'Dernière mise à jour': new Date(c.last_updated).toLocaleString('fr-FR')
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devises_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Les données ont été exportées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [currencies, context.canManageCurrencies]);

  return {
    // Données
    currencies,
    baseCurrency,
    metrics,
    context,
    messages,
    
    // États
    isLoading,
    error,
    isExporting,
    selectedCurrency,
    conversionHistory,
    
    // Actions
    refetch,
    setSelectedCurrency,
    createCurrency: createCurrencyMutation.mutate,
    updateCurrency: updateCurrencyMutation.mutate,
    deleteCurrency: deleteCurrencyMutation.mutate,
    toggleCurrencyStatus,
    updateExchangeRates,
    convertAmount,
    formatCurrency,
    exportCurrencies,
    
    // Mutations
    createCurrencyMutation,
    updateCurrencyMutation,
    deleteCurrencyMutation,
  };
}; 