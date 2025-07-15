import { useState, useEffect, useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Barcode, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Save,
  Printer,
  Clock,
  User,
  ShoppingCart,
  TrendingUp,
  Package,
  DollarSign,
  Percent,
  Plus,
  Minus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useSales } from '@/hooks/useSales';
import { useAuth } from '@/hooks/useAuth';
import { useStock } from '@/hooks/useStock';
import { LoadingButton } from '@/components/common/LoadingButton';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatPrice, formatCurrency } from '@/utils/formatters';
import { toast } from '@/hooks/use-toast';

interface EnhancedSaleFormProps {
  onSuccess: () => void;
  defaultStoreId?: number;
  initialItems?: SaleItem[];
}

interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name?: string;
  product_sku?: string;
  available_stock?: number;
  unit?: string;
  purchase_price?: number;
  margin?: number;
  margin_percentage?: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  loyalty_points?: number;
  discount_rate?: number;
}

interface SaleSettings {
  tax_rate: number;
  max_discount_percentage: number;
  enable_barcode_scan: boolean;
  enable_auto_calculations: boolean;
  enable_stock_validation: boolean;
}

export const EnhancedSaleForm = ({ 
  onSuccess, 
  defaultStoreId, 
  initialItems = [] 
}: EnhancedSaleFormProps) => {
  const { profile } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const { stores } = useStores();
  const { createSale, isCreating } = useSales();
  const { stockData, isLoading: stockLoading } = useStock();

  // État principal
  const [selectedStore, setSelectedStore] = useState(defaultStoreId?.toString() || '');
  const [items, setItems] = useState<SaleItem[]>(initialItems);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    loyalty_points: 0,
    discount_rate: 0
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Paramètres de vente
  const [saleSettings] = useState<SaleSettings>({
    tax_rate: 20, // 20% TVA
    max_discount_percentage: 30,
    enable_barcode_scan: true,
    enable_auto_calculations: true,
    enable_stock_validation: true
  });

  // Filtrage des magasins selon les permissions
  const availableStores = useMemo(() => {
    return stores.filter(store => {
      if (profile?.role === 'admin') return true;
      return profile?.store_ids?.includes(store.id);
    });
  }, [stores, profile]);

  // Produits filtrés pour la recherche
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 10); // Top 10 par défaut
    
    return products.filter(product => 
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.barcode?.includes(productSearch)
    ).slice(0, 20);
  }, [products, productSearch]);

  // Produits populaires (basé sur les ventes récentes)
  const popularProducts = useMemo(() => {
    return products.slice(0, 5); // Simplifié pour l'exemple
  }, [products]);

  // Calculs automatiques
  const calculations = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = subtotal * (saleSettings.tax_rate / 100);
    const discountAmount = discountType === 'percentage' 
      ? subtotal * (discount / 100)
      : discount;
    const total = subtotal + taxAmount - discountAmount;
    
    const totalMargin = items.reduce((sum, item) => sum + (item.margin || 0), 0);
    const averageMargin = items.length > 0 ? totalMargin / items.length : 0;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total,
      totalMargin,
      averageMargin,
      itemCount: items.length
    };
  }, [items, discount, discountType, saleSettings.tax_rate]);

  // Validation du stock
  const stockWarnings = useMemo(() => {
    const warnings: Array<{ productId: number; message: string; severity: 'warning' | 'error' }> = [];
    
    items.forEach(item => {
      const stockItem = stockData.find(s => 
        s.product_id === item.product_id && s.store_id === parseInt(selectedStore)
      );
      
      if (stockItem) {
        if (item.quantity > stockItem.quantity) {
          warnings.push({
            productId: item.product_id,
            message: `Stock insuffisant: ${stockItem.quantity} disponible`,
            severity: 'error'
          });
        } else if (item.quantity > stockItem.quantity * 0.8) {
          warnings.push({
            productId: item.product_id,
            message: `Stock faible: ${stockItem.quantity} restant`,
            severity: 'warning'
          });
        }
      }
    });
    
    return warnings;
  }, [items, stockData, selectedStore]);

  // Gestion des articles
  const addItem = useCallback((product?: any) => {
    const newItem: SaleItem = {
      product_id: product?.id || 0,
      quantity: 1,
      unit_price: product?.current_price || 0,
      total_price: product?.current_price || 0,
      product_name: product?.name,
      product_sku: product?.sku,
      unit: product?.unit || 'unité',
      purchase_price: product?.purchase_price || 0,
      margin: 0,
      margin_percentage: 0
    };

    if (product) {
      // Calculer la marge
      if (product.purchase_price && product.current_price) {
        const margin = product.current_price - product.purchase_price;
        const marginPercentage = (margin / product.purchase_price) * 100;
        newItem.margin = margin;
        newItem.margin_percentage = marginPercentage;
      }

      // Récupérer le stock disponible
      const stockItem = stockData.find(s => 
        s.product_id === product.id && s.store_id === parseInt(selectedStore)
      );
      newItem.available_stock = stockItem?.quantity || 0;
    }

    setItems(prev => [...prev, newItem]);
  }, [stockData, selectedStore]);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, field: keyof SaleItem, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index], [field]: value };
      
      // Calculs automatiques
      if (field === 'product_id') {
        const product = products.find(p => p.id === parseInt(value));
        if (product) {
          item.unit_price = product.current_price;
          item.product_name = product.name;
          item.product_sku = product.sku;
          item.unit = product.unit || 'unité';
          item.purchase_price = product.purchase_price || 0;
          
          // Calculer la marge
          if (product.purchase_price && product.current_price) {
            const margin = product.current_price - product.purchase_price;
            const marginPercentage = (margin / product.purchase_price) * 100;
            item.margin = margin;
            item.margin_percentage = marginPercentage;
          }

          // Récupérer le stock
          const stockItem = stockData.find(s => 
            s.product_id === product.id && s.store_id === parseInt(selectedStore)
          );
          item.available_stock = stockItem?.quantity || 0;
        }
      }
      
      if (field === 'quantity' || field === 'unit_price') {
        item.total_price = item.quantity * item.unit_price;
        
        // Recalculer la marge
        if (item.purchase_price) {
          const margin = item.total_price - (item.purchase_price * item.quantity);
          const marginPercentage = (margin / (item.purchase_price * item.quantity)) * 100;
          item.margin = margin;
          item.margin_percentage = marginPercentage;
        }
      }
      
      newItems[index] = item;
      return newItems;
    });
  }, [products, stockData, selectedStore]);

  // Gestion du code-barres
  const handleBarcodeSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const product = products.find(p => p.barcode === barcodeInput.trim());
    if (product) {
      addItem(product);
      setBarcodeInput('');
      toast({
        title: "Produit ajouté",
        description: `${product.name} ajouté au panier`,
      });
    } else {
      toast({
        title: "Produit non trouvé",
        description: "Aucun produit avec ce code-barres",
        variant: "destructive",
      });
    }
  }, [barcodeInput, products, addItem]);

  // Sauvegarde de brouillon
  const saveDraft = useCallback(() => {
    const draft = {
      items,
      customerInfo,
      selectedStore,
      paymentMethod,
      notes,
      discount,
      discountType,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('sale_draft', JSON.stringify(draft));
    toast({
      title: "Brouillon sauvegardé",
      description: "Votre vente a été sauvegardée",
    });
  }, [items, customerInfo, selectedStore, paymentMethod, notes, discount, discountType]);

  // Chargement de brouillon
  const loadDraft = useCallback(() => {
    const draft = localStorage.getItem('sale_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setItems(parsed.items || []);
        setCustomerInfo(parsed.customerInfo || { name: '', email: '', phone: '' });
        setSelectedStore(parsed.selectedStore || '');
        setPaymentMethod(parsed.paymentMethod || 'cash');
        setNotes(parsed.notes || '');
        setDiscount(parsed.discount || 0);
        setDiscountType(parsed.discountType || 'amount');
        
        toast({
          title: "Brouillon chargé",
          description: "Votre brouillon précédent a été restauré",
        });
      } catch (error) {
        console.error('Erreur chargement brouillon:', error);
      }
    }
  }, []);

  // Soumission du formulaire
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStore || items.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un magasin et ajouter des articles",
        variant: "destructive",
      });
      return;
    }

    // Validation du stock
    if (saleSettings.enable_stock_validation && stockWarnings.some(w => w.severity === 'error')) {
      toast({
        title: "Stock insuffisant",
        description: "Certains produits n'ont pas assez de stock",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter(item => item.product_id > 0 && item.quantity > 0);
    
    if (validItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun article valide",
        variant: "destructive",
      });
      return;
    }

    createSale({
      store_id: parseInt(selectedStore),
      items: validItems,
      subtotal: calculations.subtotal,
      tax_amount: calculations.taxAmount,
      discount_amount: calculations.discountAmount,
      total: calculations.total,
      payment_method: paymentMethod,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      notes,
    });

    // Nettoyer le brouillon
    localStorage.removeItem('sale_draft');
    onSuccess();
  }, [
    selectedStore, 
    items, 
    stockWarnings, 
    saleSettings.enable_stock_validation,
    calculations,
    paymentMethod,
    customerInfo,
    notes,
    createSale,
    onSuccess
  ]);

  // Effet pour charger le brouillon au montage
  useEffect(() => {
    if (initialItems.length === 0) {
      loadDraft();
    }
  }, [initialItems.length, loadDraft]);

  if (productsLoading || stockLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions rapides */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Nouvelle Vente</h2>
          <p className="text-gray-600">Créez une vente complète avec gestion avancée</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} size="sm">
            {showAdvanced ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            Avancé
          </Button>
        </div>
      </div>

      {/* Alertes de stock */}
      {stockWarnings.length > 0 && (
        <div className="space-y-2">
          {stockWarnings.map((warning, index) => (
            <Alert key={index} variant={warning.severity === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {warning.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Configuration de base */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="store">Magasin *</Label>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un magasin" />
              </SelectTrigger>
              <SelectContent>
                {availableStores.map(store => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment">Méthode de paiement</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="card">Carte</SelectItem>
                <SelectItem value="check">Chèque</SelectItem>
                <SelectItem value="transfer">Virement</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tax-rate">Taux de TVA (%)</Label>
            <Input
              id="tax-rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={saleSettings.tax_rate}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="items">Articles</TabsTrigger>
            <TabsTrigger value="customer">Client</TabsTrigger>
            <TabsTrigger value="summary">Récapitulatif</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          {/* Onglet Articles */}
          <TabsContent value="items" className="space-y-4">
            {/* Recherche et code-barres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-search">Recherche de produits</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="product-search"
                    placeholder="Nom, SKU ou code-barres..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="barcode">Code-barres</Label>
                <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                  <Input
                    id="barcode"
                    placeholder="Scanner un code-barres..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">
                    <Barcode className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Produits populaires */}
            {popularProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Produits populaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {popularProducts.map(product => (
                      <Button
                        key={product.id}
                        variant="outline"
                        size="sm"
                        onClick={() => addItem(product)}
                        className="text-xs"
                      >
                        <Package className="h-3 w-3 mr-1" />
                        {product.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liste des articles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Articles ({items.length})</CardTitle>
                  <Button type="button" onClick={() => addItem()} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un article
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <EnhancedSaleItemRow
                    key={index}
                    item={item}
                    index={index}
                    products={products}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    showAdvanced={showAdvanced}
                  />
                ))}

                {items.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun article ajouté</p>
                    <p className="text-sm">Utilisez la recherche ou le scan de code-barres pour ajouter des produits</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Client */}
          <TabsContent value="customer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customer-name">Nom du client</Label>
                    <Input
                      id="customer-name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nom du client"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer-email">Email du client</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemple.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer-phone">Téléphone du client</Label>
                    <Input
                      id="customer-phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="loyalty-points">Points fidélité</Label>
                      <Input
                        id="loyalty-points"
                        type="number"
                        value={customerInfo.loyalty_points || 0}
                        onChange={(e) => setCustomerInfo(prev => ({ 
                          ...prev, 
                          loyalty_points: parseInt(e.target.value) || 0 
                        }))}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discount-rate">Taux de remise client (%)</Label>
                      <Input
                        id="discount-rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={customerInfo.discount_rate || 0}
                        onChange={(e) => setCustomerInfo(prev => ({ 
                          ...prev, 
                          discount_rate: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Récapitulatif */}
          <TabsContent value="summary" className="space-y-4">
            <EnhancedSaleSummary
              calculations={calculations}
              discount={discount}
              discountType={discountType}
              onDiscountChange={setDiscount}
              onDiscountTypeChange={setDiscountType}
              maxDiscountPercentage={saleSettings.max_discount_percentage}
              showAdvanced={showAdvanced}
            />
          </TabsContent>

          {/* Onglet Avancé */}
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Options avancées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes sur la vente..."
                    rows={4}
                  />
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Statistiques de marge</Label>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Marge totale:</span>
                          <span className="font-medium">{formatPrice(calculations.totalMargin)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Marge moyenne:</span>
                          <span className="font-medium">{calculations.averageMargin.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Actions</Label>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimer ticket
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Clock className="h-4 w-4 mr-2" />
                          Créer devis
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions finales */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-gray-600">
            {calculations.itemCount} article(s) • Total: {formatPrice(calculations.total)}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={saveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
            <LoadingButton type="submit" loading={isCreating} disabled={items.length === 0}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finaliser la vente
            </LoadingButton>
          </div>
        </div>
      </form>
    </div>
  );
};

// Composant pour une ligne d'article améliorée
interface EnhancedSaleItemRowProps {
  item: SaleItem;
  index: number;
  products: any[];
  onUpdate: (index: number, field: keyof SaleItem, value: any) => void;
  onRemove: (index: number) => void;
  showAdvanced: boolean;
}

const EnhancedSaleItemRow = ({ 
  item, 
  index, 
  products, 
  onUpdate, 
  onRemove, 
  showAdvanced 
}: EnhancedSaleItemRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Ligne principale */}
      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-5">
          <Label>Produit</Label>
          <Select 
            value={item.product_id.toString()} 
            onValueChange={(value) => onUpdate(index, 'product_id', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un produit" />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-gray-500">
                      {product.sku} • {formatPrice(product.current_price)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label>Quantité</Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpdate(index, 'quantity', Math.max(1, item.quantity - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
              className="text-center"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpdate(index, 'quantity', item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="col-span-2">
          <Label>Prix unitaire</Label>
          <Input
            type="number"
            step="0.01"
            value={item.unit_price}
            onChange={(e) => onUpdate(index, 'unit_price', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="col-span-2">
          <Label>Total</Label>
          <Input
            type="number"
            step="0.01"
            value={item.total_price.toFixed(2)}
            readOnly
            className="bg-gray-50 font-medium"
          />
        </div>

        <div className="col-span-1 flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Informations étendues */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t">
          <div>
            <Label className="text-xs text-gray-500">SKU</Label>
            <p className="text-sm font-medium">{item.product_sku || '-'}</p>
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Stock disponible</Label>
            <p className="text-sm font-medium">
              {item.available_stock !== undefined ? item.available_stock : '-'}
              {item.unit && ` ${item.unit}`}
            </p>
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Marge</Label>
            <p className="text-sm font-medium">
              {item.margin_percentage ? `${item.margin_percentage.toFixed(1)}%` : '-'}
            </p>
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Prix d'achat</Label>
            <p className="text-sm font-medium">
              {item.purchase_price ? formatPrice(item.purchase_price) : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Alertes de stock */}
      {item.available_stock !== undefined && item.quantity > item.available_stock && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Stock insuffisant: {item.available_stock} disponible, {item.quantity} demandé
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Composant de récapitulatif amélioré
interface EnhancedSaleSummaryProps {
  calculations: {
    subtotal: number;
    taxAmount: number;
    total: number;
    totalMargin: number;
    averageMargin: number;
    itemCount: number;
  };
  discount: number;
  discountType: 'amount' | 'percentage';
  onDiscountChange: (value: number) => void;
  onDiscountTypeChange: (type: 'amount' | 'percentage') => void;
  maxDiscountPercentage: number;
  showAdvanced: boolean;
}

const EnhancedSaleSummary = ({
  calculations,
  discount,
  discountType,
  onDiscountChange,
  onDiscountTypeChange,
  maxDiscountPercentage,
  showAdvanced
}: EnhancedSaleSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Récapitulatif de la vente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé des articles */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Articles:</span>
            <span>{calculations.itemCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Sous-total:</span>
            <span className="font-medium">{formatPrice(calculations.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>TVA (20%):</span>
            <span>{formatPrice(calculations.taxAmount)}</span>
          </div>
        </div>

        {/* Gestion de la remise */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Remise:</span>
            <div className="flex items-center gap-2">
              <Select value={discountType} onValueChange={(value: 'amount' | 'percentage') => onDiscountTypeChange(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">€</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step={discountType === 'percentage' ? '0.1' : '0.01'}
                min="0"
                max={discountType === 'percentage' ? maxDiscountPercentage : calculations.subtotal}
                value={discount}
                onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                className="w-24"
              />
            </div>
          </div>
          
          {discountType === 'percentage' && discount > maxDiscountPercentage && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Remise maximale autorisée: {maxDiscountPercentage}%
              </AlertDescription>
            </Alert>
          )}
        </div>

        <hr />

        {/* Total final */}
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>{formatPrice(calculations.total)}</span>
        </div>

        {/* Informations avancées */}
        {showAdvanced && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>Marge totale:</span>
              <span className="font-medium">{formatPrice(calculations.totalMargin)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Marge moyenne:</span>
              <span className="font-medium">{calculations.averageMargin.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 