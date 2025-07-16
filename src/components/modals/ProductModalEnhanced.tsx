import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useUnits } from '@/hooks/useUnits';
import { useStores } from '@/hooks/useStores';
import { Search, Plus, Calculator } from 'lucide-react';

interface ProductModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

const initialProductData = {
  name: '',
  sku: '',
  barcode: '',
  category_id: 0,
  supplier_id: 0,
  unit_id: 0,
  purchase_price: 0,
  min_sale_price: 0,
  current_price: 0,
  tax_rate: 18,
  min_stock_threshold: 0,
  store_ids: [] as number[],
  description: '',
  expiration_date: '',
};

export const ProductModalEnhanced = ({ isOpen, onClose, product }: ProductModalEnhancedProps) => {
  const { createProduct, updateProduct, isCreating, isUpdating } = useProducts();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { units, isLoading: unitsLoading } = useUnits();
  const { stores, isLoading: storesLoading } = useStores();

  const [selectedStores, setSelectedStores] = useState<number[]>([]);

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
      barcode: {
        pattern: /^[0-9]{8,13}$/,
        custom: (value: string) => {
          if (value && !/^[0-9]{8,13}$/.test(value)) {
            return 'Le code barre doit contenir 8 à 13 chiffres';
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
      unit_id: { 
        required: true,
        custom: (value: number) => value > 0 ? null : 'Veuillez sélectionner une unité'
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
      },
      tax_rate: {
        min: 0,
        max: 100,
        custom: (value: number) => {
          if (value < 0 || value > 100) {
            return 'Le taux de taxe doit être entre 0 et 100%';
          }
          return null;
        }
      },
      min_stock_threshold: {
        min: 0,
        custom: (value: number) => {
          if (value < 0) {
            return 'Le seuil d\'alerte ne peut pas être négatif';
          }
          return null;
        }
      }
    },
    onSubmit: async (productData) => {
      const finalData = {
        ...productData,
        store_ids: selectedStores
      };

      if (product) {
        await updateProduct({ id: product.id, productData: finalData });
      } else {
        await createProduct(finalData);
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
      setSelectedStores(product.store_ids || []);
    } else if (!product && isOpen) {
      resetForm();
      setSelectedStores([]);
    }
  }, [product, isOpen, updateField, resetForm]);

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name
  }));

  const supplierOptions = suppliers.map(sup => ({
    value: sup.id,
    label: sup.name
  }));

  const unitOptions = units.map(unit => ({
    value: unit.id,
    label: `${unit.name} (${unit.symbol})`
  }));

  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name
  }));

  const isProcessing = isSubmitting || isCreating || isUpdating;
  const isLoading = categoriesLoading || suppliersLoading || unitsLoading || storesLoading;

  const handleStoreToggle = (storeId: number) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const generateSku = () => {
    const prefix = data.name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    const sku = `${prefix}-${timestamp}`;
    updateField('sku', sku);
  };

  const generateBarcode = () => {
    const barcode = Math.floor(Math.random() * 9000000000000) + 1000000000000;
    updateField('barcode', barcode.toString());
  };

  // Calculs automatiques
  const margin = data.current_price - data.purchase_price;
  const marginPercentage = data.purchase_price > 0 ? (margin / data.purchase_price) * 100 : 0;
  const taxAmount = (data.current_price * (data.tax_rate || 18)) / 100;
  const priceWithTax = data.current_price + taxAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </DialogTitle>
          <DialogDescription>
            Saisissez les informations détaillées du produit, son prix, sa catégorie, son fournisseur et ses taxes.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6 text-center">Chargement...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="name"
                    label="Nom du produit"
                    value={data.name}
                    onChange={(value) => updateField('name', value)}
                    error={errors.name}
                    placeholder="Nom du produit"
                    required
                    disabled={isProcessing}
                  />

                  <div className="space-y-2">
                    <FormField
                      id="sku"
                      label="SKU"
                      value={data.sku}
                      onChange={(value) => updateField('sku', value.toUpperCase())}
                      error={errors.sku}
                      placeholder="Code produit"
                      required
                      disabled={isProcessing}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSku}
                      disabled={isProcessing}
                    >
                      Générer automatiquement
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <FormField
                      id="barcode"
                      label="Code barre"
                      value={data.barcode}
                      onChange={(value) => updateField('barcode', value)}
                      error={errors.barcode}
                      placeholder="Code barre (8-13 chiffres)"
                      disabled={isProcessing}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateBarcode}
                      disabled={isProcessing}
                    >
                      Générer automatiquement
                    </Button>
                  </div>

                  <FormField
                    id="unit_id"
                    label="Unité de vente"
                    type="select"
                    value={data.unit_id}
                    onChange={(value) => updateField('unit_id', parseInt(value))}
                    error={errors.unit_id}
                    options={unitOptions}
                    placeholder="Sélectionner une unité"
                    required
                    disabled={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Catégorisation */}
            <Card>
              <CardHeader>
                <CardTitle>Catégorisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="category_id"
                    label="Catégorie"
                    type="select"
                    value={data.category_id}
                    onChange={(value) => updateField('category_id', parseInt(value))}
                    error={errors.category_id}
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
                    error={errors.supplier_id}
                    options={supplierOptions}
                    placeholder="Sélectionner un fournisseur"
                    required
                    disabled={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Prix et taxes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Prix et taxes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    id="purchase_price"
                    label="Prix d'achat (FCFA)"
                    type="number"
                    value={data.purchase_price}
                    onChange={(value) => updateField('purchase_price', value)}
                    error={errors.purchase_price}
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
                    error={errors.min_sale_price}
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
                    error={errors.current_price}
                    min={0.01}
                    step="0.01"
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="tax_rate"
                    label="Taux de taxe (%)"
                    type="number"
                    value={data.tax_rate}
                    onChange={(value) => updateField('tax_rate', value)}
                    error={errors.tax_rate}
                    min={0}
                    max={100}
                    step="0.01"
                    disabled={isProcessing}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Calcul des marges</label>
                    <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Marge brute:</span>
                        <span className="font-medium">{margin.toFixed(2)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Marge %:</span>
                        <span className="font-medium">{marginPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA ({data.tax_rate || 18}%):</span>
                        <span className="font-medium">{taxAmount.toFixed(2)} FCFA</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span>Prix TTC:</span>
                        <span className="font-bold">{priceWithTax.toFixed(2)} FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Stock et magasins */}
            <Card>
              <CardHeader>
                <CardTitle>Stock et magasins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="min_stock_threshold"
                    label="Seuil d'alerte stock"
                    type="number"
                    value={data.min_stock_threshold}
                    onChange={(value) => updateField('min_stock_threshold', value)}
                    error={errors.min_stock_threshold}
                    min={0}
                    step="1"
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Magasins assignés</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {storeOptions.map(store => (
                      <div key={store.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`store-${store.value}`}
                          checked={selectedStores.includes(store.value)}
                          onCheckedChange={() => handleStoreToggle(store.value)}
                          disabled={isProcessing}
                        />
                        <label
                          htmlFor={`store-${store.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {store.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedStores.length > 0 && (
                    <div className="mt-2">
                      <Badge variant="secondary">
                        {selectedStores.length} magasin(s) sélectionné(s)
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  id="description"
                  label="Description"
                  type="textarea"
                  value={data.description}
                  onChange={(value) => updateField('description', value)}
                  error={errors.description}
                  placeholder="Description du produit (optionnel)"
                  rows={3}
                  disabled={isProcessing}
                />

                <div className="mt-4">
                  <FormField
                    id="expiration_date"
                    label="Date d'expiration"
                    type="date"
                    value={data.expiration_date}
                    onChange={(value) => updateField('expiration_date', value)}
                    error={errors.expiration_date}
                    disabled={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>

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
