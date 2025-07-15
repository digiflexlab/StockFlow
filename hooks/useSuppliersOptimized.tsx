import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserRoles } from './useUserRoles';
import { useAuth } from './useAuth';

export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
  last_order_date?: string;
  total_orders?: number;
}

export interface SupplierFormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
}

export interface SupplierMetrics {
  totalSuppliers: number;
  activeSuppliers: number;
  suppliersWithProducts: number;
  averageProductsPerSupplier: number;
  recentActivity: number;
}

export interface RoleBasedMessages {
  createSuccess: string;
  updateSuccess: string;
  deleteSuccess: string;
  errorMessage: string;
  noAccessMessage: string;
  emptyStateMessage: string;
}

const getRoleBasedMessages = (role: string): RoleBasedMessages => {
  switch (role) {
    case 'admin':
      return {
        createSuccess: "Fournisseur créé avec succès. Audit trail activé.",
        updateSuccess: "Fournisseur modifié avec succès. Changements enregistrés.",
        deleteSuccess: "Fournisseur supprimé définitivement.",
        errorMessage: "Erreur administrative. Vérifiez les logs.",
        noAccessMessage: "Accès administrateur requis.",
        emptyStateMessage: "Aucun fournisseur enregistré. Commencez par ajouter vos partenaires commerciaux."
      };
    case 'manager':
      return {
        createSuccess: "Fournisseur ajouté à votre réseau commercial.",
        updateSuccess: "Informations fournisseur mises à jour.",
        deleteSuccess: "Fournisseur retiré de votre réseau.",
        errorMessage: "Erreur lors de la gestion du fournisseur.",
        noAccessMessage: "Permissions de gestion requises.",
        emptyStateMessage: "Aucun fournisseur disponible. Ajoutez vos premiers partenaires."
      };
    case 'seller':
      return {
        createSuccess: "Fournisseur enregistré pour consultation.",
        updateSuccess: "Détails fournisseur actualisés.",
        deleteSuccess: "Fournisseur retiré de la liste.",
        errorMessage: "Erreur lors de l'opération.",
        noAccessMessage: "Accès en lecture seule autorisé.",
        emptyStateMessage: "Aucun fournisseur à consulter. Contactez votre manager."
      };
    default:
      return {
        createSuccess: "Fournisseur créé.",
        updateSuccess: "Fournisseur modifié.",
        deleteSuccess: "Fournisseur supprimé.",
        errorMessage: "Une erreur est survenue.",
        noAccessMessage: "Accès non autorisé.",
        emptyStateMessage: "Aucun fournisseur disponible."
      };
  }
};

export const useSuppliersOptimized = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller } = useUserRoles();
  const userRole = profile?.role || 'seller';
  const messages = getRoleBasedMessages(userRole);

  // Déterminer les permissions selon le rôle
  const canViewSuppliers = isAdmin || isManager || isSeller;
  const canCreateSuppliers = isAdmin || isManager;
  const canEditSuppliers = isAdmin || isManager;
  const canDeleteSuppliers = isAdmin;
  const canViewMetrics = isAdmin || isManager;

  // Query optimisée avec cache intelligent
  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ['suppliers', 'optimized', userRole],
    queryFn: async () => {
      if (!canViewSuppliers) {
        throw new Error(messages.noAccessMessage);
      }

      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // Ajouter des métriques pour admin/manager
      if (canViewMetrics) {
        query = supabase
          .from('suppliers')
          .select(`
            *,
            products:products(count),
            orders:sales(count)
          `)
          .eq('is_active', true)
          .order('name');
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transformer les données avec métriques
      if (canViewMetrics && data) {
        return data.map((supplier: any) => ({
          ...supplier,
          products_count: supplier.products?.[0]?.count || 0,
          total_orders: supplier.orders?.[0]?.count || 0
        }));
      }

      return data as Supplier[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: canViewSuppliers,
  });

  // Métriques calculées
  const metrics: SupplierMetrics = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.is_active).length,
    suppliersWithProducts: suppliers.filter(s => (s as any).products_count > 0).length,
    averageProductsPerSupplier: suppliers.length > 0 
      ? suppliers.reduce((acc, s) => acc + ((s as any).products_count || 0), 0) / suppliers.length 
      : 0,
    recentActivity: suppliers.filter(s => {
      const updatedAt = new Date(s.updated_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return updatedAt > weekAgo;
    }).length
  };

  // Mutation de création avec validation des permissions
  const createSupplierMutation = useMutation({
    mutationFn: async (supplierData: SupplierFormData) => {
      if (!canCreateSuppliers) {
        throw new Error(messages.noAccessMessage);
      }

      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          name: supplierData.name.trim(),
          contact_person: supplierData.contact_person?.trim() || null,
          email: supplierData.email?.trim() || null,
          phone: supplierData.phone?.trim() || null,
          address: supplierData.address?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Succès",
        description: messages.createSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || messages.errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation de modification avec audit
  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, supplierData }: { id: number; supplierData: SupplierFormData }) => {
      if (!canEditSuppliers) {
        throw new Error(messages.noAccessMessage);
      }

      // Récupérer l'ancienne valeur pour l'audit
      const { data: oldData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('suppliers')
        .update({
          name: supplierData.name.trim(),
          contact_person: supplierData.contact_person?.trim() || null,
          email: supplierData.email?.trim() || null,
          phone: supplierData.phone?.trim() || null,
          address: supplierData.address?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log d'audit pour admin
      if (isAdmin && oldData) {
        await supabase.from('audit_logs').insert({
          user_id: profile?.id,
          action: 'UPDATE_SUPPLIER',
          table_name: 'suppliers',
          record_id: id.toString(),
          old_values: oldData,
          new_values: data,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Succès",
        description: messages.updateSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || messages.errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation de suppression avec validation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!canDeleteSuppliers) {
        throw new Error(messages.noAccessMessage);
      }

      // Vérifier s'il y a des produits liés
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('supplier_id', id)
        .limit(1);

      if (products && products.length > 0) {
        throw new Error("Impossible de supprimer un fournisseur avec des produits associés.");
      }

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Succès",
        description: messages.deleteSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || messages.errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fonctions d'export selon le rôle
  const exportSuppliers = async (format: 'csv' | 'json' = 'csv') => {
    if (!canViewSuppliers) {
      toast({
        title: "Accès refusé",
        description: messages.noAccessMessage,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (format === 'csv') {
        const csvContent = [
          'Nom,Contact,Email,Téléphone,Adresse,Statut',
          ...data.map(s => `${s.name},${s.contact_person || ''},${s.email || ''},${s.phone || ''},${s.address || ''},${s.is_active ? 'Actif' : 'Inactif'}`)
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fournisseurs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fournisseurs_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }

      toast({
        title: "Export réussi",
        description: `Liste des fournisseurs exportée en ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  };

  return {
    // Données
    suppliers,
    metrics,
    isLoading,
    error,
    
    // Permissions
    canViewSuppliers,
    canCreateSuppliers,
    canEditSuppliers,
    canDeleteSuppliers,
    canViewMetrics,
    
    // Rôle et messages
    userRole,
    messages,
    
    // Mutations
    createSupplier: createSupplierMutation.mutate,
    updateSupplier: updateSupplierMutation.mutate,
    deleteSupplier: deleteSupplierMutation.mutate,
    isCreating: createSupplierMutation.isPending,
    isUpdating: updateSupplierMutation.isPending,
    isDeleting: deleteSupplierMutation.isPending,
    
    // Fonctionnalités avancées
    exportSuppliers,
    
    // Performance
    refetch: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  };
}; 