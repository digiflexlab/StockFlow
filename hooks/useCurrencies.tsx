import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

export const useCurrencies = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);

  // Récupérer toutes les devises
  const fetchCurrencies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('is_base', { ascending: false })
        .order('code');

      if (error) throw error;

      if (data && data.length > 0) {
        setCurrencies(data);
        const base = data.find(c => c.is_base);
        if (base) {
          setBaseCurrency(base);
        }
      } else {
        // Si aucune devise n'existe, créer les devises par défaut
        await createDefaultCurrencies();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: "Impossible de charger les devises. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

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

      // Recharger les devises
      await fetchCurrencies();
      
      toast({
        title: "Devises initialisées",
        description: "Les devises par défaut ont été créées avec succès.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: "Impossible de créer les devises par défaut.",
        variant: "destructive",
      });
    }
  }, [fetchCurrencies]);

  // Créer une nouvelle devise
  const createCurrency = useCallback(async (currencyData: CreateCurrencyData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('currencies')
        .insert([currencyData])
        .select()
        .single();

      if (error) throw error;

      setCurrencies(prev => [...prev, data]);
      
      toast({
        title: "Devise créée",
        description: `La devise ${data.code} a été créée avec succès.`,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: "Impossible de créer la devise.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mettre à jour une devise
  const updateCurrency = useCallback(async (id: number, updates: UpdateCurrencyData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('currencies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCurrencies(prev => prev.map(c => c.id === id ? data : c));
      
      // Mettre à jour la devise de base si nécessaire
      if (updates.is_base) {
        setBaseCurrency(data);
      }

      toast({
        title: "Devise mise à jour",
        description: `La devise ${data.code} a été mise à jour avec succès.`,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la devise.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Supprimer une devise
  const deleteCurrency = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const currency = currencies.find(c => c.id === id);
      if (!currency) throw new Error('Devise non trouvée');

      if (currency.is_base) {
        throw new Error('Impossible de supprimer la devise de base');
      }

      const { error } = await supabase
        .from('currencies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCurrencies(prev => prev.filter(c => c.id !== id));
      
      toast({
        title: "Devise supprimée",
        description: `La devise ${currency.code} a été supprimée avec succès.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la devise.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currencies]);

  // Basculer le statut actif/inactif d'une devise
  const toggleCurrencyStatus = useCallback(async (id: number) => {
    try {
      const currency = currencies.find(c => c.id === id);
      if (!currency) return;

      const newStatus = !currency.is_active;

      await updateCurrency(id, { is_active: newStatus });
    } catch (err) {
      // L'erreur est déjà gérée dans updateCurrency
    }
  }, [currencies, updateCurrency]);

  // Mettre à jour les taux de change
  const updateExchangeRates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Ici, vous pourriez intégrer une API de taux de change réelle
      // Pour l'instant, on simule une mise à jour
      const updatedCurrencies = currencies.map(currency => ({
        ...currency,
        rate: currency.is_base ? 1.0 : currency.rate * (0.98 + Math.random() * 0.04)
      }));

      // Mettre à jour dans la base de données
      for (const currency of updatedCurrencies) {
        const { error } = await supabase
          .from('currencies')
          .update({
            rate: currency.rate,
            last_updated: new Date().toISOString()
          })
          .eq('id', currency.id);

        if (error) throw error;
      }

      setCurrencies(updatedCurrencies);
      
      toast({
        title: "Taux de change mis à jour",
        description: "Les taux de change ont été actualisés avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les taux de change.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currencies]);

  // Convertir un montant entre devises
  const convertAmount = useCallback((amount: number, fromCurrency: string, toCurrency: string) => {
    const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
    const toRate = currencies.find(c => c.code === toCurrency)?.rate || 1;
    
    // Conversion : montant → devise de base → devise cible
    const baseAmount = amount / fromRate;
    return baseAmount * toRate;
  }, [currencies]);

  // Formater un montant selon la devise
  const formatCurrency = useCallback((amount: number, currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return amount.toString();
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'XOF' ? 0 : 2
    }).format(amount);
  }, [currencies]);

  // Récupérer une devise par son code
  const getCurrencyByCode = useCallback((code: string) => {
    return currencies.find(c => c.code === code);
  }, [currencies]);

  // Récupérer les devises actives
  const getActiveCurrencies = useCallback(() => {
    return currencies.filter(c => c.is_active);
  }, [currencies]);

  // Charger les devises au montage
  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  return {
    currencies,
    baseCurrency,
    isLoading,
    error,
    fetchCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    toggleCurrencyStatus,
    updateExchangeRates,
    convertAmount,
    formatCurrency,
    getCurrencyByCode,
    getActiveCurrencies,
  };
}; 