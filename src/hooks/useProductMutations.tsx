
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { validateProduct } from '@/services/productValidation';
import type { ProductFormData } from '@/types/products';

function parseSupabaseError(error: any) {
  if (!error) return "Erreur inconnue";
  if (error.code === "23505" || error.message?.includes("duplicate key")) {
    return "Un produit avec ce SKU existe déjà.";
  }
  if (error.message?.includes("Network")) {
    return "Problème de connexion au serveur. Veuillez réessayer.";
  }
  return error.message || "Une erreur est survenue.";
}

export const useProductMutations = () => {
  const queryClient = useQueryClient();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const validation = validateProduct(productData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        throw new Error('Données invalides');
      }
      setValidationErrors({});

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name.trim(),
          sku: productData.sku.trim().toUpperCase(),
          barcode: productData.barcode?.trim() || null,
          category_id: productData.category_id,
          supplier_id: productData.supplier_id,
          unit_id: productData.unit_id,
          purchase_price: productData.purchase_price,
          min_sale_price: productData.min_sale_price,
          current_price: productData.current_price,
          tax_rate: productData.tax_rate || 18,
          min_stock_threshold: productData.min_stock_threshold || 0,
          store_ids: productData.store_ids || [],
          description: productData.description?.trim() || null,
          expiration_date: productData.expiration_date || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produit créé",
        description: "Le produit a été créé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: parseSupabaseError(error),
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: number; productData: ProductFormData }) => {
      const validation = validateProduct(productData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        throw new Error('Données invalides');
      }
      setValidationErrors({});

      const { data, error } = await supabase
        .from('products')
        .update({
          name: productData.name.trim(),
          sku: productData.sku.trim().toUpperCase(),
          barcode: productData.barcode?.trim() || null,
          category_id: productData.category_id,
          supplier_id: productData.supplier_id,
          unit_id: productData.unit_id,
          purchase_price: productData.purchase_price,
          min_sale_price: productData.min_sale_price,
          current_price: productData.current_price,
          tax_rate: productData.tax_rate || 18,
          min_stock_threshold: productData.min_stock_threshold || 0,
          store_ids: productData.store_ids || [],
          description: productData.description?.trim() || null,
          expiration_date: productData.expiration_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produit mis à jour",
        description: "Le produit a été mis à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: parseSupabaseError(error),
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produit supprimé",
        description: "Le produit a été désactivé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: parseSupabaseError(error),
        variant: "destructive",
      });
    },
  });

  return {
    validationErrors,
    setValidationErrors,
    resetValidationErrors: () => setValidationErrors({}),
    createProduct: createProductMutation.mutate,
    createProductAsync: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutate,
    updateProductAsync: updateProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutate,
    deleteProductAsync: deleteProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
  };
};
