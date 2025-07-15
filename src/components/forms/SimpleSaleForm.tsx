import { useState, useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  ShoppingCart, 
  User, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  DollarSign
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useSales } from '@/hooks/useSales';
import { useAuth } from '@/hooks/useAuth';
import { useStock } from '@/hooks/useStock';
import { LoadingButton } from '@/components/common/LoadingButton';
import { formatPrice } from '@/utils/formatters';
import { toast } from '@/hooks/use-toast';

interface SimpleSaleFormProps {
  onSuccess: () => void;
  defaultStoreId?: number;
}

interface CartItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_sku: string;
  minimum_price: number;
  available_stock: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export const SimpleSaleForm = ({ onSuccess, defaultStoreId }: SimpleSaleFormProps) => {
  const { profile } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const { stores } = useStores();
  const { createSale, isCreating } = useSales();
  const { stockData, isLoading: stockLoading } = useStock();

  // État principal
  const [selectedStore, setSelectedStore] = useState(defaultStoreId?.toString() || '');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [productSearch, setProductSearch] = useState('');
  const [showJustificationDialog, setShowJustificationDialog] = useState(false);
  const [justification, setJustification] = useState('');
  const [pendingSale, setPendingSale] = useState<any>(null);

  // Filtrage des magasins selon les permissions
  const availableStores = useMemo(() => {
    return stores.filter(store => {
      if (profile?.role === 'admin') return true;
      return profile?.store_ids?.includes(store.id);
    });
  }, [stores, profile]);

  // Produits filtrés pour la recherche
  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    
    return products.filter(product => 
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10);
  }, [products, productSearch]);

  // Calculs
  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.total_price, 0);
  }, [cartItems]);

  // Vérification des prix minimum
  const priceWarnings = useMemo(() => {
    const warnings: Array<{ itemIndex: number; message: string }> = [];
    
    cartItems.forEach((item, index) => {
      if (item.unit_price < item.minimum_price) {
        warnings.push({
          itemIndex: index,
          message: `Prix inférieur au minimum (${formatPrice(item.minimum_price)})`
        });
      }
    });
    
    return warnings;
  }, [cartItems]);

  // Ajouter un produit au panier
  const addToCart = useCallback((product: any) => {
    const stockItem = stockData.find(s => 
      s.product_id === product.id && s.store_id === parseInt(selectedStore)
    );

    const newItem: CartItem = {
      product_id: product.id,
      quantity: 1,
      unit_price: product.current_price,
      total_price: product.current_price,
      product_name: product.name,
      product_sku: product.sku || '',
      minimum_price: product.minimum_price || product.current_price * 0.8,
      available_stock: stockItem?.quantity || 0
    };

    setCartItems(prev => [...prev, newItem]);
    setProductSearch('');
    
    toast({
      title: "Produit ajouté",
      description: `${product.name} ajouté au panier`,
    });
  }, [stockData, selectedStore]);

  // Mettre à jour un article du panier
  const updateCartItem = useCallback((index: number, field: 'quantity' | 'unit_price', value: number) => {
    setCartItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };
      
      if (field === 'quantity') {
        item.quantity = Math.max(1, value);
      } else if (field === 'unit_price') {
        item.unit_price = Math.max(0, value);
      }
      
      item.total_price = item.quantity * item.unit_price;
      newItems[index] = item;
      
      return newItems;
    });
  }, []);

  // Supprimer un article du panier
  const removeFromCart = useCallback((index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Vérifier si l'utilisateur peut vendre sous le prix minimum
  const canSellBelowMinimum = useMemo(() => {
    return profile?.role === 'admin' || profile?.role === 'manager';
  }, [profile]);

  // Soumettre la vente
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStore || cartItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un magasin et ajouter des articles",
        variant: "destructive",
      });
      return;
    }

    // Vérifier si des prix sont sous le minimum
    const hasPriceWarnings = priceWarnings.length > 0;
    
    if (hasPriceWarnings && !canSellBelowMinimum) {
      toast({
        title: "Prix minimum",
        description: "Vous ne pouvez pas vendre sous le prix minimum",
        variant: "destructive",
      });
      return;
    }

    // Si prix sous minimum et utilisateur autorisé, demander justification
    if (hasPriceWarnings && canSellBelowMinimum) {
      setPendingSale({
        store_id: parseInt(selectedStore),
        items: cartItems,
        total,
        payment_method: paymentMethod,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
      });
      setShowJustificationDialog(true);
      return;
    }

    // Vente normale
    submitSale({
      store_id: parseInt(selectedStore),
      items: cartItems,
      total,
      payment_method: paymentMethod,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
    });
  }, [
    selectedStore, 
    cartItems, 
    total, 
    paymentMethod, 
    customerInfo, 
    priceWarnings, 
    canSellBelowMinimum
  ]);

  // Soumettre la vente avec justification
  const submitSaleWithJustification = useCallback(() => {
    if (!justification.trim()) {
      toast({
        title: "Justification requise",
        description: "Veuillez remplir la justification",
        variant: "destructive",
      });
      return;
    }

    if (pendingSale) {
      submitSale({
        ...pendingSale,
        justification
      });
    }
    
    setShowJustificationDialog(false);
    setJustification('');
    setPendingSale(null);
  }, [justification, pendingSale]);

  // Fonction de soumission de vente
  const submitSale = useCallback((saleData: any) => {
    createSale(saleData);
    onSuccess();
  }, [createSale, onSuccess]);

  if (productsLoading || stockLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Nouvelle Vente</h2>
        <p className="text-gray-600">Ajoutez des produits et finalisez la vente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sélection du magasin */}
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

        {/* Recherche et ajout de produits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Ajouter des produits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product-search">Rechercher un produit</Label>
              <Input
                id="product-search"
                placeholder="Nom ou SKU du produit..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            {/* Résultats de recherche */}
            {productSearch && filteredProducts.length > 0 && (
              <div className="space-y-2">
                <Label>Résultats :</Label>
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku} • Prix: {formatPrice(product.current_price)}
                      </div>
                    </div>
                    <Button type="button" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {productSearch && filteredProducts.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Aucun produit trouvé
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Panier ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-gray-500">SKU: {item.product_sku}</div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFromCart(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Quantité</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItem(index, 'quantity', item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCartItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItem(index, 'quantity', item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Prix unitaire</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateCartItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Label>Total</Label>
                    <div className="text-lg font-medium">
                      {formatPrice(item.total_price)}
                    </div>
                  </div>
                </div>

                {/* Alerte prix minimum */}
                {item.unit_price < item.minimum_price && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Prix inférieur au minimum ({formatPrice(item.minimum_price)})
                      {canSellBelowMinimum && " - Justification requise"}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Alerte stock */}
                {item.quantity > item.available_stock && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Stock insuffisant: {item.available_stock} disponible
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}

            {cartItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun article dans le panier</p>
                <p className="text-sm">Recherchez et ajoutez des produits</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations client
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <Label htmlFor="customer-phone">Téléphone</Label>
                <Input
                  id="customer-phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paiement et total */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label>Total à payer</Label>
                <div className="text-3xl font-bold text-green-600">
                  {formatPrice(total)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={cartItems.length === 0} className="px-8">
            <CheckCircle className="h-5 w-5 mr-2" />
            Finaliser la vente
          </Button>
        </div>
      </form>

      {/* Dialog de justification */}
      <Dialog open={showJustificationDialog} onOpenChange={setShowJustificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justification requise</DialogTitle>
            <DialogDescription>
              Vous vendez sous le prix minimum. Veuillez justifier cette décision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="justification">Justification *</Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Expliquez pourquoi vous vendez sous le prix minimum..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowJustificationDialog(false)}>
                Annuler
              </Button>
              <Button onClick={submitSaleWithJustification}>
                Valider la vente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 