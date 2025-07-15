
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProductMutations } from '@/hooks/useProductMutations';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

const initialProductData = {
  name: '',
  sku: '',
  category_id: 0,
  supplier_id: 0,
  purchase_price: 0,
  min_sale_price: 0,
  current_price: 0,
  description: '',
  expiration_date: '',
};

export const ProductModal = ({ isOpen, onClose, product }: ProductModalProps) => {
  const { 
    createProduct, 
    updateProduct, 
    isCreating, 
    isUpdating, 
    validationErrors, 
    resetValidationErrors 
  } = useProductMutations();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();

  const {
    data,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    updateField,
    handleSubmit,
    resetForm
  } = useFormValidation({
    initialData: initialProductData,
    validationSchema: {
      name: { 
        required: true, 
        minLength: 1, 
        maxLength: 255 
      },
      sku: { 
        required: true, 
        pattern: /^[A-Za-z0-9_-]+$/,
        maxLength: 100,
        custom: (value: string) => {
          if (value && !/^[A-Za-z0-9_-]+$/.test(value)) {
            return 'Le SKU ne peut contenir que des lettres, chiffres, tirets et underscores';
          }
          return null;
        }
      },
      category_id: { 
        required: true,
        custom: (value: number) => value > 0 ? null : 'Veuillez sélectionner une catégorie'
      },
      supplier_id: { 
        required: true,
        custom: (value: number) => value > 0 ? null : 'Veuillez sélectionner un fournisseur'
      },
      purchase_price: { 
        required: true, 
        min: 0.01,
        custom: (value: number) => value <= 0 ? 'Le prix d\'achat doit être supérieur à 0' : null
      },
      min_sale_price: { 
        required: true, 
        min: 0.01,
        custom: (value: number) => {
          if (value <= 0) return 'Le prix de vente minimum doit être supérieur à 0';
          if (data.purchase_price && value < data.purchase_price) {
            return 'Le prix de vente minimum doit être supérieur au prix d\'achat';
          }
          return null;
        }
      },
      current_price: { 
        required: true, 
        min: 0.01,
        custom: (value: number) => {
          if (value <= 0) return 'Le prix actuel doit être supérieur à 0';
          if (data.min_sale_price && value < data.min_sale_price) {
            return 'Le prix actuel doit être supérieur au prix de vente minimum';
          }
          return null;
        }
      }
    },
    onSubmit: async (productData) => {
      if (product) {
        await updateProduct({ id: product.id, productData });
      } else {
        await createProduct(productData);
      }
      onClose();
    }
  });

  // Charger les données du produit à éditer
  useEffect(() => {
    if (product && isOpen) {
      Object.keys(initialProductData).forEach(key => {
        const value = product[key as keyof Product];
        updateField(key, value || initialProductData[key as keyof typeof initialProductData]);
      });
    } else if (!product && isOpen) {
      resetForm();
    }
  }, [product, isOpen, updateField, resetForm]);

  useEffect(() => {
    if (!isOpen) {
      resetValidationErrors();
    }
  }, [isOpen, resetValidationErrors]);

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name
  }));

  const supplierOptions = suppliers.map(sup => ({
    value: sup.id,
    label: sup.name
  }));

  const isProcessing = isSubmitting || isCreating || isUpdating;
  const isLoading = categoriesLoading || suppliersLoading;

  // Fusionne les erreurs locales et serveur pour chaque champ
  const mergedErrors = { ...errors, ...validationErrors };
  // Erreur globale serveur (non liée à un champ)
  const globalServerError = validationErrors && typeof validationErrors === 'object' && validationErrors._global;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </DialogTitle>
        </DialogHeader>
        {globalServerError && (
          <div className="mb-4 text-red-600" role="alert" aria-live="assertive">{globalServerError}</div>
        )}
        {isLoading ? (
          <div className="p-6 text-center">Chargement...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="name"
                label="Nom du produit"
                value={data.name}
                onChange={(value) => updateField('name', value)}
                error={mergedErrors.name}
                placeholder="Nom du produit"
                required
                disabled={isProcessing}
              />

              <FormField
                id="sku"
                label="SKU"
                value={data.sku}
                onChange={(value) => updateField('sku', value.toUpperCase())}
                error={mergedErrors.sku}
                placeholder="Code produit"
                required
                disabled={isProcessing}
              />

              <FormField
                id="category_id"
                label="Catégorie"
                type="select"
                value={data.category_id}
                onChange={(value) => updateField('category_id', parseInt(value))}
                error={mergedErrors.category_id}
                options={categoryOptions}
                placeholder="Sélectionner une catégorie"
                required
                disabled={isProcessing}
              />

              <FormField
                id="supplier_id"
                label="Fournisseur"
                type="select"
                value={data.supplier_id}
                onChange={(value) => updateField('supplier_id', parseInt(value))}
                error={mergedErrors.supplier_id}
                options={supplierOptions}
                placeholder="Sélectionner un fournisseur"
                required
                disabled={isProcessing}
              />

              <FormField
                id="purchase_price"
                label="Prix d'achat (FCFA)"
                type="number"
                value={data.purchase_price}
                onChange={(value) => updateField('purchase_price', value)}
                error={mergedErrors.purchase_price}
                min={0.01}
                step="0.01"
                required
                disabled={isProcessing}
              />

              <FormField
                id="min_sale_price"
                label="Prix de vente minimum (FCFA)"
                type="number"
                value={data.min_sale_price}
                onChange={(value) => updateField('min_sale_price', value)}
                error={mergedErrors.min_sale_price}
                min={0.01}
                step="0.01"
                required
                disabled={isProcessing}
              />

              <FormField
                id="current_price"
                label="Prix actuel (FCFA)"
                type="number"
                value={data.current_price}
                onChange={(value) => updateField('current_price', value)}
                error={mergedErrors.current_price}
                min={0.01}
                step="0.01"
                required
                disabled={isProcessing}
              />

              <FormField
                id="expiration_date"
                label="Date d'expiration"
                type="date"
                value={data.expiration_date}
                onChange={(value) => updateField('expiration_date', value)}
                error={mergedErrors.expiration_date}
                disabled={isProcessing}
              />
            </div>

            <FormField
              id="description"
              label="Description"
              type="textarea"
              value={data.description}
              onChange={(value) => updateField('description', value)}
              error={mergedErrors.description}
              placeholder="Description du produit (optionnel)"
              rows={3}
              disabled={isProcessing}
            />

            <FormActions
              onCancel={onClose}
              isSubmitting={isProcessing}
              isValid={isValid}
              isDirty={isDirty}
              submitLabel={product ? 'Modifier' : 'Créer'}
            />
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
