
import { useState, useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Package, 
  Building2, 
  ArrowRight,
  AlertTriangle, 
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  Clock,
  Truck,
  MapPin,
  Calculator
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useStock } from '@/hooks/useStock';
import { useAuth } from '@/hooks/useAuth';
import { LoadingButton } from '@/components/common/LoadingButton';
import { formatPrice } from '@/utils/formatters';
import { toast } from '@/hooks/use-toast';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transferData: any) => void;
}

interface TransferItem {
  product_id: number;
  quantity: number;
  product_name: string;
  product_sku: string;
  available_stock: number;
  unit_price: number;
  total_value: number;
}

interface TransferData {
  source_store_id: number;
  destination_store_id: number;
  items: TransferItem[];
  priority: 'low' | 'medium' | 'high';
  reason: string;
  expected_date: string;
  notes: string;
  total_items: number;
  total_value: number;
}

export const TransferModal = ({ isOpen, onClose, onSave }: TransferModalProps) => {
  const { profile } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const { stores } = useStores();
  const { stockData, isLoading: stockLoading } = useStock();

  // État principal
  const [transferData, setTransferData] = useState<TransferData>({
    source_store_id: 0,
    destination_store_id: 0,
    items: [],
    priority: 'medium',
    reason: '',
    expected_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 jours
    notes: '',
    total_items: 0,
    total_value: 0
  });

  const [productSearch, setProductSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Magasins disponibles selon les permissions
  const availableStores = useMemo(() => {
    return (stores ?? []).filter(store => {
      if (profile?.role === 'admin') return true;
      return profile?.store_ids?.includes(store.id);
    });
  }, [stores, profile]);

  // Produits filtrés pour la recherche
  const filteredProducts = useMemo(() => {
    if (!productSearch || !transferData.source_store_id) return [];
    
    return (products ?? []).filter(product => 
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10);
  }, [products, productSearch, transferData.source_store_id]);

  // Stock disponible dans le magasin source
  const sourceStock = useMemo(() => {
    if (!transferData.source_store_id) return [];
    
    return (stockData ?? []).filter(stock => 
      stock.store_id === transferData.source_store_id
    );
  }, [stockData, transferData.source_store_id]);

  // Calculs automatiques
  const calculations = useMemo(() => {
    const totalItems = transferData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = transferData.items.reduce((sum, item) => sum + item.total_value, 0);
    
    return { totalItems, totalValue };
  }, [transferData.items]);

  // Validation des transferts
  const transferWarnings = useMemo(() => {
    const warnings: Array<{ type: 'error' | 'warning'; message: string }> = [];
    
    // Vérifier si les magasins sont sélectionnés
    if (!transferData.source_store_id) {
      warnings.push({ type: 'error', message: 'Sélectionnez un magasin source' });
    }
    
    if (!transferData.destination_store_id) {
      warnings.push({ type: 'error', message: 'Sélectionnez un magasin de destination' });
    }
    
    if (transferData.source_store_id === transferData.destination_store_id) {
      warnings.push({ type: 'error', message: 'Les magasins source et destination doivent être différents' });
    }
    
    // Vérifier le stock disponible
    transferData.items.forEach(item => {
      const stockItem = sourceStock.find(s => s.product_id === item.product_id);
      if (stockItem && item.quantity > stockItem.quantity) {
        warnings.push({ 
          type: 'error', 
          message: `Stock insuffisant pour ${item.product_name}: ${stockItem.quantity} disponible, ${item.quantity} demandé` 
        });
      }
    });
    
    // Vérifier si des articles sont ajoutés
    if (transferData.items.length === 0) {
      warnings.push({ type: 'warning', message: 'Aucun article ajouté au transfert' });
    }
    
    return warnings;
  }, [transferData, sourceStock]);

  // Ajouter un produit au transfert
  const addProductToTransfer = useCallback((product: any) => {
    const stockItem = sourceStock.find(s => s.product_id === product.id);
    const availableStock = stockItem?.quantity || 0;
    
    const newItem: TransferItem = {
      product_id: product.id,
      quantity: 1,
      product_name: product.name,
      product_sku: product.sku || '',
      available_stock: availableStock,
      unit_price: product.current_price || 0,
      total_value: product.current_price || 0
    };

    setTransferData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    setProductSearch('');
    
    toast({
      title: "Produit ajouté",
      description: `${product.name} ajouté au transfert`,
    });
  }, [sourceStock]);

  // Mettre à jour un article
  const updateTransferItem = useCallback((index: number, field: 'quantity', value: number) => {
    setTransferData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index] };
      
      item.quantity = Math.max(1, Math.min(value, item.available_stock));
      item.total_value = item.quantity * item.unit_price;
      
      newItems[index] = item;
      
      return {
        ...prev,
        items: newItems
      };
    });
  }, []);

  // Supprimer un article
  const removeTransferItem = useCallback((index: number) => {
    setTransferData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }, []);

  // Soumettre le transfert
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    
    if (transferWarnings.some(w => w.type === 'error')) {
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs avant de soumettre",
        variant: "destructive",
      });
      return;
    }

    if (transferData.items.length === 0) {
      toast({
        title: "Aucun article",
        description: "Ajoutez au moins un article au transfert",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const transferToSave = {
        ...transferData,
        total_items: calculations.totalItems,
        total_value: calculations.totalValue,
        created_by: profile?.id,
        status: 'pending'
      };
      
      await onSave(transferToSave);
      
      toast({
        title: "Transfert créé",
        description: "Le transfert a été enregistré avec succès",
      });
      
      onClose();
    } catch (error: any) {
      setServerError(error?.message || "Une erreur est survenue lors de l'enregistrement du transfert.");
    } finally {
      setIsSubmitting(false);
    }
  }, [transferData, transferWarnings, calculations, profile, onSave, onClose]);

  if (productsLoading || stockLoading) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Nouveau Transfert</h2>
              <p className="text-gray-600">
                Transférer des produits entre magasins
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {serverError && (
              <div className="mb-4 text-red-600" role="alert" aria-live="assertive">{serverError}</div>
            )}
            {/* Configuration du transfert */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Configuration du transfert
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="source-store">Magasin source *</Label>
                    <Select 
                      value={transferData.source_store_id.toString()} 
                      onValueChange={(value) => setTransferData(prev => ({ 
                        ...prev, 
                        source_store_id: parseInt(value),
                        items: [] // Vider les articles lors du changement de magasin
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le magasin source" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStores.map(store => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {store.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-gray-400" />
                  </div>

                  <div>
                    <Label htmlFor="destination-store">Magasin destination *</Label>
                    <Select 
                      value={transferData.destination_store_id.toString()} 
                      onValueChange={(value) => setTransferData(prev => ({ 
                        ...prev, 
                        destination_store_id: parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le magasin destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStores.map(store => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {store.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Select 
                      value={transferData.priority} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => setTransferData(prev => ({ 
                        ...prev, 
                        priority: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-600">Faible</Badge>
                            <span>Dans les 7 jours</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-orange-600">Moyenne</Badge>
                            <span>Dans les 3 jours</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-red-600">Haute</Badge>
                            <span>Dans les 24h</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expected-date">Date attendue</Label>
                    <Input
                      id="expected-date"
                      type="date"
                      value={transferData.expected_date}
                      onChange={(e) => setTransferData(prev => ({ 
                        ...prev, 
                        expected_date: e.target.value 
                      }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Raison du transfert *</Label>
                  <Input
                    id="reason"
                    value={transferData.reason}
                    onChange={(e) => setTransferData(prev => ({ 
                      ...prev, 
                      reason: e.target.value 
                    }))}
                    placeholder="Ex: Réapprovisionnement, Équilibrage des stocks..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sélection des produits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produits à transférer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transferData.source_store_id > 0 && (
                  <div>
                    <Label htmlFor="product-search">Rechercher un produit</Label>
                    <Input
                      id="product-search"
                      placeholder="Nom ou SKU du produit..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                )}

                {/* Résultats de recherche */}
                {productSearch && filteredProducts.length > 0 && (
                  <div className="space-y-2">
                    <Label>Produits disponibles :</Label>
                    {filteredProducts.map(product => {
                      const stockItem = sourceStock.find(s => s.product_id === product.id);
                      const availableStock = stockItem?.quantity || 0;
                      
                      return (
                      <div
                        key={product.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => addProductToTransfer(product)}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku} • Stock: {availableStock} • Prix: {formatPrice(product.current_price)}
                            </div>
                          </div>
                          <Button type="button" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {productSearch && filteredProducts.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Aucun produit trouvé
                  </div>
                )}

                {/* Articles sélectionnés */}
                {transferData.items.length > 0 && (
                  <div className="space-y-3">
                    <Label>Articles sélectionnés ({transferData.items.length}) :</Label>
                    {transferData.items.map((item, index) => (
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
                            onClick={() => removeTransferItem(index)}
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
                                onClick={() => updateTransferItem(index, 'quantity', item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                max={item.available_stock}
                                value={item.quantity}
                                onChange={(e) => updateTransferItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="text-center"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateTransferItem(index, 'quantity', item.quantity + 1)}
                                disabled={item.quantity >= item.available_stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label>Stock disponible</Label>
                            <div className="text-sm font-medium">
                              {item.available_stock}
                              {item.quantity > item.available_stock && (
                                <span className="text-red-500 ml-2">Insuffisant</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Valeur totale</Label>
                            <div className="text-sm font-medium">
                              {formatPrice(item.total_value)}
                              </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {transferData.items.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun article sélectionné</p>
                    <p className="text-sm">Sélectionnez un magasin source et recherchez des produits</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Récapitulatif */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Récapitulatif du transfert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{calculations.totalItems}</div>
                    <div className="text-sm text-blue-700">Articles</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{formatPrice(calculations.totalValue)}</div>
                    <div className="text-sm text-green-700">Valeur totale</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {transferData.priority === 'high' ? '24h' : 
                       transferData.priority === 'medium' ? '3j' : '7j'}
                  </div>
                    <div className="text-sm text-orange-700">Délai</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes supplémentaires</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={transferData.notes}
                  onChange={(e) => setTransferData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  placeholder="Notes supplémentaires sur le transfert..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Alertes */}
            {transferWarnings.length > 0 && (
              <div className="space-y-2">
                {transferWarnings.map((warning, index) => (
                  <Alert key={index} variant={warning.type === 'error' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{warning.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
          )}

          {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
              <LoadingButton
                type="submit"
                loading={isSubmitting}
                disabled={transferWarnings.some(w => w.type === 'error') || transferData.items.length === 0}
                className="min-w-[120px]"
              >
                <Truck className="h-4 w-4 mr-2" />
                Créer le transfert
              </LoadingButton>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};
