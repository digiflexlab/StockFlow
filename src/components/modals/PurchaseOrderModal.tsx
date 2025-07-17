import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Building2, 
  Truck, 
  Calculator,
  Plus,
  Minus,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  ShoppingCart,
  Store,
  User
} from 'lucide-react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useStores } from '@/hooks/useStores';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useStock } from '@/hooks/useStock';
import { useAuth } from '@/hooks/useAuth';
import { LoadingButton } from '@/components/common/LoadingButton';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PurchaseItem {
  id?: string;
  product_id?: number;
  product_name: string;
  sku: string;
  is_new_product: boolean;
  category_id: number;
  supplier_id: number;
  purchase_price: number;
  min_sale_price: number;
  quantity: number;
  total_cost: number;
  store_allocations: Array<{
    store_id: number;
    store_name: string;
    quantity: number;
    min_sale_price: number;
  }>;
}

interface PurchaseOrderData {
  supplier_id: number;
  order_date: string;
  expected_delivery: string;
  notes: string;
  items: PurchaseItem[];
  total_amount: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
}

const initialPurchaseData: PurchaseOrderData = {
  supplier_id: 0,
  order_date: new Date().toISOString().split('T')[0],
  expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: '',
  items: [],
  total_amount: 0,
  status: 'draft'
};

const purchaseValidationSchema = {
  supplier_id: {
    required: true,
    custom: (value: number) => value > 0 ? null : 'Sélectionnez un fournisseur'
  },
  order_date: {
    required: true
  },
  expected_delivery: {
    required: true,
    custom: (value: string) => {
      const deliveryDate = new Date(value);
      const today = new Date();
      if (deliveryDate < today) {
        return 'La date de livraison ne peut pas être dans le passé';
      }
      return null;
    }
  }
};

export const PurchaseOrderModal = ({ isOpen, onClose, onSuccess }: PurchaseOrderModalProps) => {
  const { profile } = useAuth();
  const { stores } = useStores();
  const { suppliers } = useSuppliers();
  const { categories } = useCategories();
  const { products } = useProducts();
  const { createStockMutation } = useStock();
  
  const [activeTab, setActiveTab] = useState('items');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');

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
    initialData: initialPurchaseData,
    validationSchema: purchaseValidationSchema,
    onSubmit: async (purchaseData) => {
      try {
        await processPurchaseOrder(purchaseData);
        toast({
          title: "Commande créée",
          description: "La commande d'achat a été enregistrée avec succès.",
        });
        onSuccess?.();
        onClose();
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'enregistrement.",
          variant: "destructive",
        });
      }
    }
  });

  // Réinitialiser le formulaire
  useEffect(() => {
    if (isOpen && !data.items.length) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Produits filtrés pour la recherche
  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    
    return (products ?? []).filter(product => 
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10);
  }, [products, productSearch]);

  // Calculer le montant total
  const totalAmount = useMemo(() => {
    return data.items.reduce((sum, item) => sum + item.total_cost, 0);
  }, [data.items]);

  // Ajouter un nouvel article
  const addItem = () => {
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      product_name: '',
      sku: '',
      is_new_product: false,
      category_id: 0,
      supplier_id: data.supplier_id,
      purchase_price: 0,
      min_sale_price: 0,
      quantity: 1,
      total_cost: 0,
      store_allocations: []
    };

    updateField('items', [...data.items, newItem]);
  };

  // Supprimer un article
  const removeItem = (itemId: string) => {
    updateField('items', data.items.filter(item => item.id !== itemId));
  };

  // Mettre à jour un article
  const updateItem = (itemId: string, field: keyof PurchaseItem, value: any) => {
    const updatedItems = data.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculer le coût total
        if (field === 'purchase_price' || field === 'quantity') {
          updatedItem.total_cost = updatedItem.purchase_price * updatedItem.quantity;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    updateField('items', updatedItems);
  };

  // Ajouter une allocation de magasin
  const addStoreAllocation = (itemId: string) => {
    const updatedItems = data.items.map(item => {
      if (item.id === itemId) {
        const newAllocation = {
          store_id: 0,
          store_name: '',
          quantity: 0,
          min_sale_price: 0
        };
        return {
          ...item,
          store_allocations: [...item.store_allocations, newAllocation]
        };
      }
      return item;
    });
    
    updateField('items', updatedItems);
  };

  // Mettre à jour une allocation de magasin
  const updateStoreAllocation = (itemId: string, allocationIndex: number, field: string, value: any) => {
    const updatedItems = data.items.map(item => {
      if (item.id === itemId) {
        const updatedAllocations = [...item.store_allocations];
        updatedAllocations[allocationIndex] = {
          ...updatedAllocations[allocationIndex],
          [field]: value
        };
        
        // Mettre à jour le nom du magasin si l'ID change
        if (field === 'store_id') {
          const store = stores?.find(s => s.id === value);
          updatedAllocations[allocationIndex].store_name = store?.name || '';
        }
        
        return { ...item, store_allocations: updatedAllocations };
      }
      return item;
    });
    
    updateField('items', updatedItems);
  };

  // Supprimer une allocation de magasin
  const removeStoreAllocation = (itemId: string, allocationIndex: number) => {
    const updatedItems = data.items.map(item => {
      if (item.id === itemId) {
        const updatedAllocations = item.store_allocations.filter((_, index) => index !== allocationIndex);
        return { ...item, store_allocations: updatedAllocations };
      }
      return item;
    });
    
    updateField('items', updatedItems);
  };

  // Sélectionner un produit existant
  const selectExistingProduct = (product: any, itemId: string) => {
    const updatedItems = data.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          is_new_product: false,
          category_id: product.category_id,
          purchase_price: product.purchase_price,
          min_sale_price: product.min_sale_price,
          total_cost: product.purchase_price * item.quantity
        };
      }
      return item;
    });
    
    updateField('items', updatedItems);
    setProductSearch('');
  };

  // Traiter la commande d'achat
  const processPurchaseOrder = async (purchaseData: PurchaseOrderData) => {
    // 1. Créer la commande d'achat
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        supplier_id: purchaseData.supplier_id,
        order_date: purchaseData.order_date,
        expected_delivery: purchaseData.expected_delivery,
        notes: purchaseData.notes,
        total_amount: totalAmount,
        status: purchaseData.status,
        created_by: profile?.id
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Traiter chaque article
    for (const item of purchaseData.items) {
      let productId = item.product_id;

      // Si c'est un nouveau produit, le créer
      if (item.is_new_product || !productId) {
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: item.product_name,
            sku: item.sku,
            category_id: item.category_id,
            supplier_id: item.supplier_id,
            purchase_price: item.purchase_price,
            min_sale_price: item.min_sale_price,
            current_price: item.min_sale_price,
            is_active: true
          })
          .select()
          .single();

        if (productError) throw productError;
        productId = newProduct.id;
      }

      // 3. Créer les articles de commande
      const { error: orderItemError } = await supabase
        .from('purchase_order_items')
        .insert({
          purchase_order_id: order.id,
          product_id: productId,
          quantity: item.quantity,
          unit_price: item.purchase_price,
          total_price: item.total_cost
        });

      if (orderItemError) throw orderItemError;

      // 4. Allouer le stock aux magasins
      for (const allocation of item.store_allocations) {
        if (allocation.store_id && allocation.quantity > 0) {
          // Vérifier si le stock existe déjà
          const { data: existingStock } = await supabase
            .from('stock')
            .select('id, quantity')
            .eq('product_id', productId)
            .eq('store_id', allocation.store_id)
            .single();

          if (existingStock) {
            // Mettre à jour le stock existant
            await supabase
              .from('stock')
              .update({
                quantity: existingStock.quantity + allocation.quantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingStock.id);
          } else {
            // Créer un nouveau stock
            await supabase
              .from('stock')
              .insert({
                product_id: productId,
                store_id: allocation.store_id,
                quantity: allocation.quantity,
                min_threshold: 5
              });
          }

          // Enregistrer le mouvement de stock
          await supabase
            .from('stock_movements')
            .insert({
              product_id: productId,
              store_id: allocation.store_id,
              movement_type: 'purchase',
              quantity_change: allocation.quantity,
              reference_id: order.id,
              reference_type: 'purchase_order',
              user_id: profile?.id,
              notes: `Achat: ${item.product_name} - ${allocation.quantity} unités`
            });
        }
      }
    }
  };

  const supplierOptions = (suppliers ?? []).map(sup => ({
    value: sup.id,
    label: sup.name
  }));

  const categoryOptions = (categories ?? []).map(cat => ({
    value: cat.id,
    label: cat.name
  }));

  const storeOptions = (stores ?? []).map(store => ({
    value: store.id,
    label: store.name
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Nouvelle Commande d'Achat
          </DialogTitle>
          <DialogDescription>
            Créez une commande d'achat en sélectionnant les articles, les magasins d'allocation et en renseignant les informations de livraison.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="items">Articles</TabsTrigger>
              <TabsTrigger value="allocation">Allocation Magasins</TabsTrigger>
              <TabsTrigger value="summary">Résumé</TabsTrigger>
            </TabsList>

            {/* Onglet Articles */}
            <TabsContent value="items" className="space-y-4">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Informations de la Commande
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Fournisseur *</label>
                    <select
                      value={data.supplier_id}
                      onChange={(e) => updateField('supplier_id', parseInt(e.target.value))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value={0}>Sélectionner un fournisseur</option>
                      {supplierOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.supplier_id && <p className="text-sm text-red-500 mt-1">{errors.supplier_id}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Date de commande *</label>
                    <input
                      type="date"
                      value={data.order_date}
                      onChange={(e) => updateField('order_date', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    />
                    {errors.order_date && <p className="text-sm text-red-500 mt-1">{errors.order_date}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Livraison prévue *</label>
                    <input
                      type="date"
                      value={data.expected_delivery}
                      onChange={(e) => updateField('expected_delivery', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    />
                    {errors.expected_delivery && <p className="text-sm text-red-500 mt-1">{errors.expected_delivery}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Liste des articles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Articles ({data.items.length})
                    </span>
                    <Button type="button" onClick={addItem} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Article
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Article {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id!)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Type de produit */}
                        <div>
                          <label className="text-sm font-medium">Type de produit</label>
                          <div className="flex gap-2 mt-1">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={!item.is_new_product}
                                onChange={() => updateItem(item.id!, 'is_new_product', false)}
                                className="mr-2"
                              />
                              Produit existant
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={item.is_new_product}
                                onChange={() => updateItem(item.id!, 'is_new_product', true)}
                                className="mr-2"
                              />
                              Nouveau produit
                            </label>
                          </div>
                        </div>

                        {/* Recherche de produit existant */}
                        {!item.is_new_product && (
                          <div>
                            <label className="text-sm font-medium">Rechercher un produit</label>
                            <input
                              type="text"
                              placeholder="Nom ou SKU du produit"
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="w-full p-2 border rounded-md mt-1"
                            />
                            {productSearch && (
                              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                                {filteredProducts.map(product => (
                                  <div
                                    key={product.id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => selectExistingProduct(product, item.id!)}
                                  >
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-gray-600">SKU: {product.sku}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Informations du produit */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">Nom du produit *</label>
                          <input
                            type="text"
                            value={item.product_name}
                            onChange={(e) => updateItem(item.id!, 'product_name', e.target.value)}
                            className="w-full p-2 border rounded-md"
                            disabled={!item.is_new_product && item.product_id}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">SKU *</label>
                          <input
                            type="text"
                            value={item.sku}
                            onChange={(e) => updateItem(item.id!, 'sku', e.target.value.toUpperCase())}
                            className="w-full p-2 border rounded-md"
                            disabled={!item.is_new_product && item.product_id}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Catégorie *</label>
                          <select
                            value={item.category_id}
                            onChange={(e) => updateItem(item.id!, 'category_id', parseInt(e.target.value))}
                            className="w-full p-2 border rounded-md"
                            disabled={!item.is_new_product && item.product_id}
                          >
                            <option value={0}>Sélectionner une catégorie</option>
                            {categoryOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Prix et quantités */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium">Prix d'achat (FCFA) *</label>
                          <input
                            type="number"
                            value={item.purchase_price}
                            onChange={(e) => updateItem(item.id!, 'purchase_price', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border rounded-md"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Prix de vente min (FCFA) *</label>
                          <input
                            type="number"
                            value={item.min_sale_price}
                            onChange={(e) => updateItem(item.id!, 'min_sale_price', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border rounded-md"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Quantité *</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id!, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full p-2 border rounded-md"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Coût total</label>
                          <div className="p-2 bg-gray-100 rounded-md font-medium">
                            {item.total_cost.toLocaleString()} FCFA
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {data.items.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun article ajouté</p>
                      <p className="text-sm mt-2">Cliquez sur "Ajouter Article" pour commencer</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Allocation Magasins */}
            <TabsContent value="allocation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Allocation par Magasin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.items.map((item, itemIndex) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-4">{item.product_name || `Article ${itemIndex + 1}`}</h4>
                      
                      <div className="space-y-3">
                        {item.store_allocations.map((allocation, allocationIndex) => (
                          <div key={allocationIndex} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
                            <div className="flex-1">
                              <label className="text-sm font-medium">Magasin</label>
                              <select
                                value={allocation.store_id}
                                onChange={(e) => updateStoreAllocation(item.id!, allocationIndex, 'store_id', parseInt(e.target.value))}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value={0}>Sélectionner un magasin</option>
                                {storeOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex-1">
                              <label className="text-sm font-medium">Quantité</label>
                              <input
                                type="number"
                                value={allocation.quantity}
                                onChange={(e) => updateStoreAllocation(item.id!, allocationIndex, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-full p-2 border rounded-md"
                                min="0"
                                max={item.quantity}
                              />
                            </div>

                            <div className="flex-1">
                              <label className="text-sm font-medium">Prix de vente min (FCFA)</label>
                              <input
                                type="number"
                                value={allocation.min_sale_price}
                                onChange={(e) => updateStoreAllocation(item.id!, allocationIndex, 'min_sale_price', parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border rounded-md"
                                min="0"
                                step="0.01"
                              />
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeStoreAllocation(item.id!, allocationIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addStoreAllocation(item.id!)}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter Allocation
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Résumé */}
            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Résumé de la Commande
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Informations générales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Informations de la Commande</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Fournisseur:</strong> {suppliers?.find(s => s.id === data.supplier_id)?.name || 'Non sélectionné'}</div>
                        <div><strong>Date de commande:</strong> {data.order_date}</div>
                        <div><strong>Livraison prévue:</strong> {data.expected_delivery}</div>
                        <div><strong>Nombre d'articles:</strong> {data.items.length}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Montants</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Total HT:</strong> {totalAmount.toLocaleString()} FCFA</div>
                        <div><strong>TVA (18%):</strong> {(totalAmount * 0.18).toLocaleString()} FCFA</div>
                        <div className="text-lg font-bold"><strong>Total TTC:</strong> {(totalAmount * 1.18).toLocaleString()} FCFA</div>
                      </div>
                    </div>
                  </div>

                  {/* Liste des articles */}
                  <div>
                    <h4 className="font-medium mb-2">Articles Commandés</h4>
                    <div className="space-y-2">
                      {data.items.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{item.product_name || `Article ${index + 1}`}</div>
                            <div className="text-sm text-gray-600">
                              {item.quantity} x {item.purchase_price.toLocaleString()} FCFA
                            </div>
                          </div>
                          <div className="font-medium">
                            {item.total_cost.toLocaleString()} FCFA
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Allocation par magasin */}
                  <div>
                    <h4 className="font-medium mb-2">Allocation par Magasin</h4>
                    <div className="space-y-2">
                      {stores && stores.map(store => {
                        const storeAllocations = data.items.flatMap(item =>
                          item.store_allocations
                            .filter(allocation => allocation.store_id === store.id)
                            .map(allocation => ({
                              product: item.product_name,
                              quantity: allocation.quantity,
                              minPrice: allocation.min_sale_price
                            }))
                        );

                        if (storeAllocations.length === 0) return null;

                        return (
                          <div key={store.id} className="border rounded p-3">
                            <h5 className="font-medium mb-2">{store.name}</h5>
                            <div className="space-y-1 text-sm">
                              {storeAllocations.map((allocation, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{allocation.product}</span>
                                  <span>{allocation.quantity} unités - {allocation.minPrice.toLocaleString()} FCFA min</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <textarea
                      value={data.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      placeholder="Notes additionnelles..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              disabled={!isValid || data.items.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer la Commande
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 
