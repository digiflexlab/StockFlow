import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  RefreshCw, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Users,
  Store,
  TrendingUp,
  AlertCircle,
  DollarSign,
  BarChart3,
  Settings,
  Eye,
  Clock,
  Receipt
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStores } from '@/hooks/useStores';
import { formatPrice, formatDate } from '@/utils/formatters';

const PRODUCT_CONDITIONS = [
  { value: 'excellent', label: 'Excellent état', percentage: 100 },
  { value: 'good', label: 'Bon état', percentage: 80 },
  { value: 'fair', label: 'État moyen', percentage: 60 },
  { value: 'poor', label: 'Mauvais état', percentage: 40 },
  { value: 'damaged', label: 'Endommagé', percentage: 20 }
];

export const Returns = () => {
  const { user, profile } = useAuth();
  const { stores } = useStores();
  const [searchCode, setSearchCode] = useState('');
  const [foundSale, setFoundSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [exchangeItems, setExchangeItems] = useState([]);
  const [finalAmount, setFinalAmount] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState([]);
  const [showReturnsList, setShowReturnsList] = useState(false);
  const [returns, setReturns] = useState([]);
  const [isLoadingReturns, setIsLoadingReturns] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  // Contexte utilisateur pour adaptation automatique
  const userContext = useMemo(() => {
    const role = profile?.role || 'seller';
    const storeIds = profile?.store_ids || [];
    const storeCount = storeIds.length;
    
    return {
      role,
      storeIds,
      storeCount,
      permissions: profile?.permissions || [],
      isManager: role === 'manager',
      isSeller: role === 'seller',
      isAdmin: role === 'admin',
    };
  }, [profile]);

  // Contenu adaptatif selon le rôle
  const roleContent = useMemo(() => {
    const { role, storeCount } = userContext;
    
    switch (role) {
      case 'seller':
        return {
          title: `Retours & Échanges - ${storeCount} magasin${storeCount > 1 ? 's' : ''}`,
          subtitle: 'Traitez les retours de vos ventes rapidement et efficacement',
          quickActions: ['Nouveau retour', 'Historique', 'Remboursements', 'Mes retours'],
          maxAmount: 50000, // Limite en XOF
          requiresApproval: false
        };
      case 'manager':
        return {
          title: `Gestion des Retours - ${storeCount} magasin${storeCount > 1 ? 's' : ''}`,
          subtitle: 'Supervisez les retours de votre équipe et validez les opérations importantes',
          quickActions: ['Nouveau retour', 'Validation', 'Rapports', 'Remboursements'],
          maxAmount: 200000, // Limite en XOF
          requiresApproval: true
        };
      case 'admin':
        return {
          title: 'Gestion Globale des Retours',
          subtitle: 'Vue d\'ensemble de tous les retours du système et configuration des politiques',
          quickActions: ['Nouveau retour', 'Configuration', 'Rapports globaux', 'Audit'],
          maxAmount: null, // Pas de limite
          requiresApproval: false
        };
      default:
        return {
          title: 'Retours & Échanges',
          subtitle: 'Gérez les retours et échanges',
          quickActions: ['Nouveau retour'],
          maxAmount: 50000,
          requiresApproval: false
        };
    }
  }, [userContext]);

  // Message personnalisé selon le rôle
  const getPersonalizedMessage = () => {
    const { role, storeCount } = userContext;
    const timeOfDay = new Date().getHours();
    let greeting = '';
    
    if (timeOfDay < 12) greeting = 'Bonjour';
    else if (timeOfDay < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';
    
    switch (role) {
      case 'seller':
        return `${greeting} ! Prêt(e) à gérer les retours de vos ventes ?`;
      case 'manager':
        return `${greeting} ! Comment se portent les retours de votre équipe ?`;
      case 'admin':
        return `${greeting} ! Vue d'ensemble des retours de vos ${storeCount} magasin${storeCount > 1 ? 's' : ''}`;
      default:
        return `${greeting} !`;
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const searchSale = async () => {
    if (!searchCode.trim()) {
      toast({
        title: "Code manquant",
        description: "Veuillez saisir un code de vente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            products (id, name, current_price)
          )
        `)
        .eq('sale_number', searchCode.toUpperCase())
        .single();

      if (error) {
        setFoundSale(null);
        toast({
          title: "Vente introuvable",
          description: "Aucune vente ne correspond à ce code.",
          variant: "destructive",
        });
        return;
      }

      setFoundSale(data);
      setReturnItems([]);
      setExchangeItems([]);
      setFinalAmount('');
      toast({
        title: "Vente trouvée",
        description: `Vente ${data.sale_number} du ${new Date(data.created_at).toLocaleDateString('fr-FR')}`,
      });
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la recherche.",
        variant: "destructive",
      });
    }
  };

  const addReturnItem = (saleItem) => {
    const existingReturn = returnItems.find(item => item.productId === saleItem.product_id);
    
    if (existingReturn) {
      if (existingReturn.quantity < saleItem.quantity) {
        setReturnItems(prev => prev.map(item =>
          item.productId === saleItem.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setReturnItems(prev => [...prev, {
        productId: saleItem.product_id,
        productName: saleItem.products?.name || 'Produit inconnu',
        originalPrice: saleItem.unit_price,
        quantity: 1,
        condition: 'good',
        returnValue: saleItem.unit_price * 0.8
      }]);
    }
  };

  const updateReturnItem = (productId, field, value) => {
    setReturnItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: value };
        if (field === 'condition') {
          const conditionData = PRODUCT_CONDITIONS.find(c => c.value === value);
          updated.returnValue = (item.originalPrice * conditionData.percentage / 100) * updated.quantity;
        } else if (field === 'quantity') {
          const conditionData = PRODUCT_CONDITIONS.find(c => c.value === item.condition);
          updated.returnValue = (item.originalPrice * conditionData.percentage / 100) * value;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeReturnItem = (productId) => {
    setReturnItems(prev => prev.filter(item => item.productId !== productId));
  };

  const addExchangeItem = (product, quantity = 1) => {
    const existingExchange = exchangeItems.find(item => item.productId === product.id);
    
    if (existingExchange) {
      setExchangeItems(prev => prev.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setExchangeItems(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        price: product.current_price,
        quantity: quantity
      }]);
    }
  };

  const updateExchangeItem = (productId, field, value) => {
    setExchangeItems(prev => prev.map(item =>
      item.productId === productId ? { ...item, [field]: value } : item
    ));
  };

  const removeExchangeItem = (productId) => {
    setExchangeItems(prev => prev.filter(item => item.productId !== productId));
  };

  const calculateReturnValue = () => {
    return returnItems.reduce((sum, item) => sum + item.returnValue, 0);
  };

  const calculateExchangeValue = () => {
    return exchangeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDifference = () => {
    return calculateExchangeValue() - calculateReturnValue();
  };

  const processReturnExchange = async () => {
    if (returnItems.length === 0 && exchangeItems.length === 0) {
      toast({
        title: "Aucune opération",
        description: "Ajoutez au moins un produit en retour ou en échange.",
        variant: "destructive",
      });
      return;
    }

    if (!finalAmount || isNaN(parseFloat(finalAmount))) {
      toast({
        title: "Montant manquant",
        description: "Veuillez saisir le montant de finalisation.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Créer l'enregistrement de retour avec le statut 'approved' au lieu de 'completed'
      const { data: returnData, error: returnError } = await supabase
        .from('returns')
        .insert({
          sale_id: foundSale.id,
          return_number: `RET-${Date.now()}`,
          customer_name: foundSale.customer_name,
          total_amount: parseFloat(finalAmount),
          status: 'approved',
          processed_by: user.id,
          store_id: foundSale.store_id
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Créer les éléments de retour
      if (returnItems.length > 0) {
        const returnItemsData = returnItems.map(item => ({
          return_id: returnData.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.originalPrice,
          total_price: item.returnValue
        }));

        const { error: itemsError } = await supabase
          .from('return_items')
          .insert(returnItemsData);

        if (itemsError) throw itemsError;
      }

      const difference = calculateDifference();
      toast({
        title: "Opération réussie",
        description: `Retour/échange traité avec succès. ${
          difference > 0 ? `Somme due: ${difference.toFixed(2)} XOF` : 
          difference < 0 ? `Somme à rembourser: ${Math.abs(difference).toFixed(2)} XOF` :
          'Échange équilibré'
        }`,
      });

      // Réinitialiser
      setFoundSale(null);
      setReturnItems([]);
      setExchangeItems([]);
      setFinalAmount('');
      setSearchCode('');
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du traitement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // Charger la liste des retours
  const loadReturns = async () => {
    setIsLoadingReturns(true);
    try {
      let query = supabase
        .from('returns')
        .select(`
          *,
          sales(sale_number, customer_name),
          stores(name),
          profiles(name)
        `);

      // Filtrage selon le rôle
      if (userContext.isSeller) {
        query = query
          .in('store_id', userContext.storeIds)
          .eq('processed_by', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(50);
      } else if (userContext.isManager) {
        query = query
          .in('store_id', userContext.storeIds)
          .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
      }
      // Admin: tous les retours

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setReturns(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des retours:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les retours.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReturns(false);
    }
  };

  // Actions rapides selon le rôle
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Historique':
      case 'Mes retours':
        setShowReturnsList(true);
        loadReturns();
        break;
      case 'Validation':
      case 'Rapports':
      case 'Configuration':
      case 'Rapports globaux':
      case 'Audit':
        toast({
          title: "Fonctionnalité à venir",
          description: `La fonctionnalité "${action}" sera bientôt disponible.`,
        });
        break;
      default:
        console.log(`Action: ${action}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête adaptatif */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">{roleContent.title}</h2>
            <p className="text-gray-600">{roleContent.subtitle}</p>
            <p className="text-sm text-blue-600 font-medium">
              {getPersonalizedMessage()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {foundSale && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setFoundSale(null);
                  setSearchCode('');
                  setReturnItems([]);
                  setExchangeItems([]);
                  setFinalAmount('');
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Nouvelle recherche
              </Button>
            )}
            {showReturnsList && (
              <Button 
                variant="outline" 
                onClick={() => setShowReturnsList(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au traitement
              </Button>
            )}
          </div>
        </div>

        {/* Actions rapides selon le rôle */}
        {!foundSale && !showReturnsList && (
          <div className="flex flex-wrap gap-3">
            {roleContent.quickActions.map((action) => {
              const getActionIcon = (action: string) => {
                switch (action) {
                  case 'Nouveau retour': return RefreshCw;
                  case 'Historique': return Clock;
                  case 'Remboursements': return Receipt;
                  case 'Mes retours': return Eye;
                  case 'Validation': return CheckCircle;
                  case 'Rapports': return BarChart3;
                  case 'Configuration': return Settings;
                  case 'Rapports globaux': return BarChart3;
                  case 'Audit': return Eye;
                  default: return RefreshCw;
                }
              };

              const Icon = getActionIcon(action);
              
              return (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {action}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {!foundSale ? (
        /* Recherche de vente */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rechercher une vente
            </CardTitle>
            <CardDescription>
              Saisissez le code de vente pour débuter le processus de retour/échange
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 max-w-md">
              <Input
                placeholder="Ex: VTE-20241225-0001"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && searchSale()}
                className="h-12"
              />
              <Button onClick={searchSale} className="h-12 px-6">
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Processus de retour/échange */
        <div className="space-y-6">
          {/* Détails de la vente originale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Vente trouvée : {foundSale.sale_number}
              </CardTitle>
              <CardDescription>
                {new Date(foundSale.created_at).toLocaleDateString('fr-FR')} - {foundSale.customer_name || 'Client anonyme'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Informations client</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Nom:</span> {foundSale.customer_name || 'Non renseigné'}</p>
                    <p><span className="text-gray-600">Téléphone:</span> {foundSale.customer_phone || 'Non renseigné'}</p>
                    <p><span className="text-gray-600">Paiement:</span> {foundSale.payment_method || 'Non renseigné'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Résumé de la vente</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Sous-total:</span> {foundSale.subtotal?.toFixed(2) || '0.00'} XOF</p>
                    <p><span className="text-gray-600">TVA:</span> {foundSale.tax_amount?.toFixed(2) || '0.00'} XOF</p>
                    <p><span className="text-gray-600 font-medium">Total:</span> <span className="font-semibold">{foundSale.total?.toFixed(2) || '0.00'} XOF</span></p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Produits vendus</h4>
                <div className="space-y-2">
                  {foundSale.sale_items?.map((saleItem) => (
                    <div key={saleItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{saleItem.products?.name || 'Produit inconnu'}</p>
                        <p className="text-sm text-gray-600">
                          Quantité: {saleItem.quantity} × {saleItem.unit_price?.toFixed(2) || '0.00'} XOF = {saleItem.total_price?.toFixed(2) || '0.00'} XOF
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addReturnItem(saleItem)}
                        >
                          Retourner
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-gray-500 py-4">Aucun produit dans cette vente</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produits en retour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-orange-600" />
                  Produits en retour ({returnItems.length})
                </CardTitle>
                <CardDescription>Sélectionnez les produits à retourner et leur état</CardDescription>
              </CardHeader>
              <CardContent>
                {returnItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun produit en retour</p>
                ) : (
                  <div className="space-y-4">
                    {returnItems.map((item) => (
                      <div key={item.productId} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium">{item.productName}</h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeReturnItem(item.productId)}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Quantité</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateReturnItem(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">État</Label>
                            <select
                              value={item.condition}
                              onChange={(e) => updateReturnItem(item.productId, 'condition', e.target.value)}
                              className="w-full h-8 px-2 border border-gray-300 rounded text-sm"
                            >
                              {PRODUCT_CONDITIONS.map(condition => (
                                <option key={condition.value} value={condition.value}>
                                  {condition.label} ({condition.percentage}%)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          Prix original: {item.originalPrice?.toFixed(2) || '0.00'} XOF × {item.quantity} = {((item.originalPrice || 0) * item.quantity).toFixed(2)} XOF<br/>
                          <span className="font-medium text-green-600">
                            Valeur de retour: {item.returnValue?.toFixed(2) || '0.00'} XOF
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between font-semibold">
                        <span>Total retours:</span>
                        <span className="text-green-600">{calculateReturnValue().toFixed(2)} XOF</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Produits en échange */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  Produits en échange ({exchangeItems.length})
                </CardTitle>
                <CardDescription>Ajoutez les nouveaux produits pour l'échange</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Recherche de produits pour échange */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>

                  {productSearchTerm && (
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                          onClick={() => addExchangeItem(product)}
                        >
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-gray-600">{product.sku}</p>
                          </div>
                          <span className="font-semibold text-blue-600">{product.current_price?.toFixed(2) || '0.00'} XOF</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Produits sélectionnés pour échange */}
                  {exchangeItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucun produit en échange</p>
                  ) : (
                    <div className="space-y-3">
                      {exchangeItems.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-gray-600">{item.price?.toFixed(2) || '0.00'} XOF × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateExchangeItem(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-center"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExchangeItem(item.productId)}
                              className="text-red-600 h-8 w-8 p-0"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-3 border-t">
                        <div className="flex justify-between font-semibold">
                          <span>Total échanges:</span>
                          <span className="text-blue-600">{calculateExchangeValue().toFixed(2)} XOF</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Finalisation */}
          {(returnItems.length > 0 || exchangeItems.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Finalisation</CardTitle>
                <CardDescription>Calcul final et confirmation de l'opération</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">Valeur des retours</p>
                      <p className="text-2xl font-bold text-green-600">{calculateReturnValue().toFixed(2)} XOF</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">Valeur des échanges</p>
                      <p className="text-2xl font-bold text-blue-600">{calculateExchangeValue().toFixed(2)} XOF</p>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      calculateDifference() > 0 ? 'bg-orange-50' : 
                      calculateDifference() < 0 ? 'bg-purple-50' : 'bg-gray-50'
                    }`}>
                      <p className={`text-sm ${
                        calculateDifference() > 0 ? 'text-orange-700' : 
                        calculateDifference() < 0 ? 'text-purple-700' : 'text-gray-700'
                      }`}>
                        {calculateDifference() > 0 ? 'À payer' : 
                         calculateDifference() < 0 ? 'À rembourser' : 'Équilibré'}
                      </p>
                      <p className={`text-2xl font-bold ${
                        calculateDifference() > 0 ? 'text-orange-600' : 
                        calculateDifference() < 0 ? 'text-purple-600' : 'text-gray-600'
                      }`}>
                        {Math.abs(calculateDifference()).toFixed(2)} XOF
                      </p>
                    </div>
                  </div>

                  <div className="max-w-sm mx-auto">
                    <Label htmlFor="finalAmount">Montant de finalisation (XOF) *</Label>
                    <Input
                      id="finalAmount"
                      type="number"
                      step="0.01"
                      value={finalAmount}
                      onChange={(e) => setFinalAmount(e.target.value)}
                      placeholder="Montant réel géré"
                      className="h-12 text-center text-lg font-semibold"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Montant réellement échangé/remboursé
                    </p>
                  </div>

                  <Button
                    onClick={processReturnExchange}
                    disabled={isProcessing}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg font-semibold"
                  >
                    {isProcessing ? 'Traitement en cours...' : 'Confirmer l\'opération'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Liste des retours traités */}
      {showReturnsList && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                {userContext.isSeller ? 'Mes retours' : 'Historique des retours'}
              </CardTitle>
              <CardDescription>
                {userContext.isSeller 
                  ? 'Retours que vous avez traités récemment'
                  : 'Historique des retours de votre équipe'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReturns ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des retours...</p>
                </div>
              ) : returns.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {userContext.isSeller 
                      ? 'Aucun retour traité récemment'
                      : 'Aucun retour dans l\'historique'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {returns.map((ret) => (
                    <div key={ret.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-gray-900">{ret.return_number}</h4>
                            <Badge className={
                              ret.status === 'approved' ? 'bg-green-100 text-green-800' :
                              ret.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {ret.status === 'approved' ? 'Approuvé' : 
                               ret.status === 'pending' ? 'En attente' : 'Rejeté'}
                            </Badge>
                            {ret.sales && (
                              <Badge variant="outline">
                                Vente: {ret.sales.sale_number}
                              </Badge>
                            )}
                            {userContext.isManager && (
                              <Badge variant="secondary" className="text-xs">
                                {ret.profiles?.name}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              Magasin: {ret.stores?.name}
                            </span>
                            {userContext.isAdmin && (
                              <span>
                                Traité par: {ret.profiles?.name}
                              </span>
                            )}
                            <span>
                              {formatDate(ret.created_at, true)}
                            </span>
                          </div>
                          
                          {ret.customer_name && (
                            <div className="text-sm text-gray-600">
                              Client: {ret.customer_name}
                            </div>
                          )}

                          {/* Notes pour les managers et admins */}
                          {(userContext.isManager || userContext.isAdmin) && ret.notes && (
                            <div className="text-sm text-gray-500 italic">
                              Note: {ret.notes}
                            </div>
                          )}

                          {/* Raison du retour */}
                          {ret.reason && (
                            <div className="text-sm text-gray-600">
                              Raison: {ret.reason}
                            </div>
                          )}
                        </div>

                        <div className="text-right space-y-2">
                          <div className="text-xl font-bold text-gray-900">
                            {formatPrice(ret.total_amount)}
                          </div>
                          
                          {/* Actions selon le rôle */}
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(userContext.isManager || userContext.isAdmin) && ret.status === 'pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => {
                                    // TODO: Implémenter l'approbation
                                    toast({
                                      title: "Fonctionnalité à venir",
                                      description: "L'approbation des retours sera bientôt disponible.",
                                    });
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => {
                                    // TODO: Implémenter le rejet
                                    toast({
                                      title: "Fonctionnalité à venir",
                                      description: "Le rejet des retours sera bientôt disponible.",
                                    });
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
