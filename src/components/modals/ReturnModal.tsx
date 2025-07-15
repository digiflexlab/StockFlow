import { useEffect, useState, useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Package, 
  User, 
  Receipt,
  AlertTriangle, 
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  Calendar,
  DollarSign,
  FileText,
  ShoppingCart,
  Calculator
} from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useAuth } from '@/hooks/useAuth';
import { LoadingButton } from '@/components/common/LoadingButton';
import { formatPrice } from '@/utils/formatters';
import { toast } from '@/hooks/use-toast';
import { getSaleItems } from '@/services/saleService';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (returnData: any) => void;
}

interface ReturnItem {
  sale_item_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  original_quantity: number;
  returned_quantity: number;
  unit_price: number;
  refund_amount: number;
  reason: string;
  condition: 'new' | 'damaged' | 'used';
}

interface ReturnData {
  sale_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  store_id: number;
  items: ReturnItem[];
  return_reason: string;
  return_date: string;
  refund_method: 'cash' | 'card' | 'credit_note';
  notes: string;
  total_items: number;
  total_refund: number;
  is_partial: boolean;
}

export const ReturnModal = ({ isOpen, onClose, onSave }: ReturnModalProps) => {
  const { profile } = useAuth();
  const { sales, isLoading: salesLoading } = useSales();
  const { products } = useProducts();
  const { stores } = useStores();

  // État principal
  const [returnData, setReturnData] = useState<ReturnData>({
    sale_id: 0,
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    store_id: 0,
    items: [],
    return_reason: '',
    return_date: new Date().toISOString().split('T')[0],
    refund_method: 'cash',
    notes: '',
    total_items: 0,
    total_refund: 0,
    is_partial: false
  });

  const [saleSearch, setSaleSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saleItems, setSaleItems] = useState<any[]>([]);

  // Magasins disponibles selon les permissions
  const availableStores = useMemo(() => {
    return stores.filter(store => {
      if (profile?.role === 'admin') return true;
      return profile?.store_ids?.includes(store.id);
    });
  }, [stores, profile]);

  // Ventes filtrées pour la recherche
  const filteredSales = useMemo(() => {
    if (!saleSearch || !returnData.store_id) return [];
    
    return sales.filter(sale => 
      sale.id.toString().includes(saleSearch) ||
      sale.customer_name?.toLowerCase().includes(saleSearch.toLowerCase()) ||
      sale.customer_phone?.includes(saleSearch)
    ).slice(0, 10);
  }, [sales, saleSearch, returnData.store_id]);

  // Vente sélectionnée
  const selectedSale = useMemo(() => {
    return sales.find(sale => sale.id === returnData.sale_id);
  }, [sales, returnData.sale_id]);

  // Charger les items de la vente sélectionnée
  useEffect(() => {
    const fetchItems = async () => {
      if (selectedSale) {
        const items = await getSaleItems(selectedSale.id);
        setSaleItems(items);
      } else {
        setSaleItems([]);
      }
    };
    fetchItems();
  }, [selectedSale]);

  // Calculs automatiques
  const calculations = useMemo(() => {
    const totalItems = returnData.items.reduce((sum, item) => sum + item.returned_quantity, 0);
    const totalRefund = returnData.items.reduce((sum, item) => sum + item.refund_amount, 0);
    const isPartial = returnData.items.some(item => item.returned_quantity < item.original_quantity);
    
    return { totalItems, totalRefund, isPartial };
  }, [returnData.items]);

  // Validation des retours
  const returnWarnings = useMemo(() => {
    const warnings: Array<{ type: 'error' | 'warning'; message: string }> = [];
    
    // Vérifier si une vente est sélectionnée
    if (!returnData.sale_id) {
      warnings.push({ type: 'error', message: 'Sélectionnez une vente' });
    }
    
    // Vérifier si des articles sont ajoutés
    if (returnData.items.length === 0) {
      warnings.push({ type: 'warning', message: 'Aucun article ajouté au retour' });
    }
    
    // Vérifier les quantités retournées
    returnData.items.forEach(item => {
      if (item.returned_quantity > item.original_quantity) {
        warnings.push({ 
          type: 'error', 
          message: `Quantité retournée invalide pour ${item.product_name}: ${item.returned_quantity} > ${item.original_quantity}` 
        });
      }
      
      if (item.returned_quantity <= 0) {
        warnings.push({ 
          type: 'error', 
          message: `Quantité retournée doit être > 0 pour ${item.product_name}` 
        });
      }
    });
    
    return warnings;
  }, [returnData]);

  // Sélectionner une vente
  const selectSale = useCallback((sale: any) => {
    setReturnData(prev => ({
      ...prev,
      sale_id: sale.id,
      customer_name: sale.customer_name || '',
      customer_phone: sale.customer_phone || '',
      customer_email: sale.customer_email || '',
      store_id: sale.store_id,
      items: [] // Vider les articles lors du changement de vente
    }));
    
    setSaleSearch('');
    
    toast({
      title: "Vente sélectionnée",
      description: `Vente #${sale.id} sélectionnée`,
    });
  }, []);

  // Ajouter un article au retour
  const addItemToReturn = useCallback((saleItem: any) => {
    const product = products.find(p => p.id === saleItem.product_id);
    
    const newItem: ReturnItem = {
      sale_item_id: saleItem.id,
      product_id: saleItem.product_id,
      product_name: product?.name || saleItem.product_name,
      product_sku: product?.sku || '',
      original_quantity: saleItem.quantity,
      returned_quantity: 1,
      unit_price: saleItem.unit_price,
      refund_amount: saleItem.unit_price,
      reason: '',
      condition: 'new'
    };

    setReturnData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    toast({
      title: "Article ajouté",
      description: `${product?.name || saleItem.product_name} ajouté au retour`,
    });
  }, [products]);

  // Mettre à jour un article de retour
  const updateReturnItem = useCallback((index: number, field: keyof ReturnItem, value: any) => {
    setReturnData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index] };
      
      if (field === 'returned_quantity') {
        const quantity = Math.max(1, Math.min(value, item.original_quantity));
        item.returned_quantity = quantity;
        item.refund_amount = quantity * item.unit_price;
      } else if (field === 'reason' || field === 'condition') {
        item[field] = value;
      }
      
      newItems[index] = item;
      
      return {
        ...prev,
        items: newItems
      };
    });
  }, []);

  // Supprimer un article de retour
  const removeReturnItem = useCallback((index: number) => {
    setReturnData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }, []);

  // Soumettre le retour
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    
    if (returnWarnings.some(w => w.type === 'error')) {
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs avant de soumettre",
        variant: "destructive",
      });
      return;
    }

    if (returnData.items.length === 0) {
      toast({
        title: "Aucun article",
        description: "Ajoutez au moins un article au retour",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const returnToSave = {
        ...returnData,
        total_items: calculations.totalItems,
        total_refund: calculations.totalRefund,
        is_partial: calculations.isPartial,
        created_by: profile?.id,
        status: 'pending'
      };
      
      await onSave(returnToSave);
      
      toast({
        title: "Retour créé",
        description: "Le retour a été enregistré avec succès",
      });
      
      onClose();
    } catch (error: any) {
      setServerError(error?.message || "Une erreur est survenue lors de l'enregistrement du retour.");
    } finally {
      setIsSubmitting(false);
    }
  }, [returnData, returnWarnings, calculations, profile, onSave, onClose]);

  if (salesLoading) {
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
              <h2 className="text-2xl font-bold">Nouveau Retour</h2>
              <p className="text-gray-600">
                Gérer le retour d'articles par un client
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
            {/* Sélection de la vente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Sélection de la vente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store">Magasin</Label>
                    <Select 
                      value={returnData.store_id.toString()} 
                      onValueChange={(value) => setReturnData(prev => ({ 
                        ...prev, 
                        store_id: parseInt(value),
                        sale_id: 0,
                        items: []
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le magasin" />
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
                    <Label htmlFor="sale-search">Rechercher une vente</Label>
                    <Input
                      id="sale-search"
                      placeholder="ID vente, nom client, téléphone..."
                      value={saleSearch}
                      onChange={(e) => setSaleSearch(e.target.value)}
                      disabled={!returnData.store_id}
                    />
                  </div>
                </div>

                {/* Résultats de recherche */}
                {saleSearch && filteredSales.length > 0 && (
                  <div className="space-y-2">
                    <Label>Ventes trouvées :</Label>
                    {filteredSales.map(sale => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => selectSale(sale)}
                      >
                        <div>
                          <div className="font-medium">Vente #{sale.id}</div>
                          <div className="text-sm text-gray-500">
                            Client: {sale.customer_name} • {sale.customer_phone} • {formatPrice(sale.total)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button type="button" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {saleSearch && filteredSales.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Aucune vente trouvée
                  </div>
                )}

                {/* Vente sélectionnée */}
                {selectedSale && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900">Vente #{selectedSale.id}</div>
                        <div className="text-sm text-blue-700">
                          Client: {selectedSale.customer_name} • {selectedSale.customer_phone}
                        </div>
                        <div className="text-sm text-blue-600">
                          Total: {formatPrice(selectedSale.total)} • {saleItems?.length || 0} articles
                        </div>
                      </div>
                      <Badge variant="outline" className="text-blue-700">
                        {new Date(selectedSale.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Articles de la vente */}
            {selectedSale && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Articles de la vente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {saleItems.length > 0 ? (
                    <div className="space-y-3">
                      {saleItems.map(saleItem => {
                        const isAlreadyReturned = returnData.items.some(item => item.sale_item_id === saleItem.id);
                        const returnedItem = returnData.items.find(item => item.sale_item_id === saleItem.id);
                        const returnedQuantity = returnedItem?.returned_quantity || 0;
                        const remainingQuantity = saleItem.quantity - returnedQuantity;
                        
                        return (
                          <div
                            key={saleItem.id}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              isAlreadyReturned ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 cursor-pointer'
                            }`}
                            onClick={() => !isAlreadyReturned && addItemToReturn(saleItem)}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{saleItem.product_name}</div>
                              <div className="text-sm text-gray-500">
                                Quantité: {saleItem.quantity} • Prix: {formatPrice(saleItem.unit_price)} • Total: {formatPrice(saleItem.total_price)}
                              </div>
                              {isAlreadyReturned && (
                                <div className="text-sm text-green-600">
                                  Retourné: {returnedQuantity}/{saleItem.quantity}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isAlreadyReturned ? (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Retourné
                                </Badge>
                              ) : (
                                <Button type="button" size="sm" disabled={remainingQuantity <= 0}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Aucun article dans cette vente
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Articles à retourner */}
            {returnData.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Articles à retourner ({returnData.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {returnData.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-gray-500">SKU: {item.product_sku}</div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeReturnItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Quantité retournée</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateReturnItem(index, 'returned_quantity', item.returned_quantity - 1)}
                              disabled={item.returned_quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max={item.original_quantity}
                              value={item.returned_quantity}
                              onChange={(e) => updateReturnItem(index, 'returned_quantity', parseInt(e.target.value) || 1)}
                              className="text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateReturnItem(index, 'returned_quantity', item.returned_quantity + 1)}
                              disabled={item.returned_quantity >= item.original_quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {item.original_quantity} acheté(s) • {item.original_quantity - item.returned_quantity} restant(s)
                          </div>
                        </div>

                        <div>
                          <Label>État du produit</Label>
                          <Select 
                            value={item.condition} 
                            onValueChange={(value: 'new' | 'damaged' | 'used') => updateReturnItem(index, 'condition', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  Neuf
                                </div>
                              </SelectItem>
                              <SelectItem value="used">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  Utilisé
                                </div>
                              </SelectItem>
                              <SelectItem value="damaged">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                  Endommagé
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Remboursement</Label>
                          <div className="text-lg font-bold text-green-600">
                            {formatPrice(item.refund_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.returned_quantity} × {formatPrice(item.unit_price)}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Raison du retour</Label>
                        <Input
                          value={item.reason}
                          onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                          placeholder="Ex: Défaut, Taille incorrecte, Changement d'avis..."
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Informations du retour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informations du retour
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="return-date">Date du retour</Label>
                    <Input
                      id="return-date"
                      type="date"
                      value={returnData.return_date}
                      onChange={(e) => setReturnData(prev => ({ 
                        ...prev, 
                        return_date: e.target.value 
                      }))}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="refund-method">Méthode de remboursement</Label>
                    <Select 
                      value={returnData.refund_method} 
                      onValueChange={(value: 'cash' | 'card' | 'credit_note') => setReturnData(prev => ({ 
                        ...prev, 
                        refund_method: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Espèces
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Carte bancaire
                          </div>
                        </SelectItem>
                        <SelectItem value="credit_note">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Avoir
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="return-reason">Raison générale du retour</Label>
                  <Input
                    id="return-reason"
                    value={returnData.return_reason}
                    onChange={(e) => setReturnData(prev => ({ 
                      ...prev, 
                      return_reason: e.target.value 
                    }))}
                    placeholder="Ex: Insatisfaction client, Défaut produit..."
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={returnData.notes}
                    onChange={(e) => setReturnData(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder="Notes supplémentaires sur le retour..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Récapitulatif */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Récapitulatif du retour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{calculations.totalItems}</div>
                    <div className="text-sm text-blue-700">Articles retournés</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{formatPrice(calculations.totalRefund)}</div>
                    <div className="text-sm text-green-700">Remboursement total</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {calculations.isPartial ? 'Partiel' : 'Complet'}
                    </div>
                    <div className="text-sm text-orange-700">Type de retour</div>
                  </div>
                </div>

                {selectedSale && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Vente originale</div>
                        <div className="text-sm text-gray-600">
                          {saleItems?.length || 0} articles • {formatPrice(selectedSale.total)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">Taux de retour</div>
                        <div className="text-sm text-gray-600">
                          {Math.round((calculations.totalItems / (saleItems?.reduce((sum, item) => sum + item.quantity, 0) || 1)) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alertes */}
            {returnWarnings.length > 0 && (
              <div className="space-y-2">
                {returnWarnings.map((warning, index) => (
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
                disabled={returnWarnings.some(w => w.type === 'error') || returnData.items.length === 0}
                className="min-w-[120px]"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Créer le retour
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 