import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Package,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  RotateCcw,
  Download,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  Loader2,
  Eye,
  Shield,
  ClipboardList,
  Target,
  Clock,
  FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';

export const Inventory = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const { stores } = useStores();
  const { isAdmin, isManager, isSeller } = useUserRoles();
  const userRole = user?.role || 'seller';
  
  const [inventorySessions, setInventorySessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'session' | 'history'>('session');

  // Messages adaptés selon le rôle
  const getRoleBasedMessages = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: 'Gestion des inventaires',
          subtitle: `${inventorySessions.length} session(s) d'inventaire`,
          emptyMessage: 'Aucune session d\'inventaire. Commencez par créer votre premier inventaire.',
          searchPlaceholder: 'Rechercher par nom ou SKU...',
          loadingMessage: 'Chargement des données d\'inventaire...',
          noAccessMessage: 'Accès administrateur requis pour l\'inventaire.'
        };
      case 'manager':
        return {
          title: 'Inventaires de magasin',
          subtitle: `${inventorySessions.length} inventaire(s) de votre magasin`,
          emptyMessage: 'Aucune session d\'inventaire disponible. Créez votre premier inventaire.',
          searchPlaceholder: 'Trouver un produit...',
          loadingMessage: 'Récupération de vos sessions d\'inventaire...',
          noAccessMessage: 'Permissions de gestion d\'inventaire requises.'
        };
      case 'seller':
        return {
          title: 'Inventaires',
          subtitle: `${inventorySessions.length} inventaire(s) disponible(s)`,
          emptyMessage: 'Aucune session d\'inventaire à consulter. Contactez votre manager.',
          searchPlaceholder: 'Rechercher un article...',
          loadingMessage: 'Consultation des sessions d\'inventaire...',
          noAccessMessage: 'Accès en lecture seule autorisé pour l\'inventaire.'
        };
      default:
        return {
          title: 'Inventaires',
          subtitle: `${inventorySessions.length} inventaire(s)`,
          emptyMessage: 'Aucune session d\'inventaire disponible.',
          searchPlaceholder: 'Rechercher...',
          loadingMessage: 'Chargement...',
          noAccessMessage: 'Accès non autorisé.'
        };
    }
  };

  const messages = getRoleBasedMessages();

  // Permissions granulaires
  const canViewInventory = isAdmin || isManager || isSeller;
  const canCreateInventory = isAdmin || isManager;
  const canEditInventory = isAdmin || isManager;
  const canCompleteInventory = isAdmin || isManager;
  const canAdjustStock = isAdmin || isManager;
  const canViewMetrics = isAdmin || isManager;
  const canViewAllStores = isAdmin;

  useEffect(() => {
    loadInventorySessions();
  }, []);

  const loadInventorySessions = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .select(`
          *,
          stores (name),
          inventory_items (
            *,
            products (name, sku)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setInventorySessions(data || []);
      
      // Trouver une session active
      const active = data?.find(session => session.status === 'active');
      if (active) {
        setActiveSession(active);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sessions d'inventaire.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewInventory = async () => {
    if (selectedStore === 'all') {
      toast({
        title: "Magasin requis",
        description: "Veuillez sélectionner un magasin.",
        variant: "destructive",
      });
      return;
    }

    try {
      const storeName = stores.find(s => s.id.toString() === selectedStore)?.name || '';
      
      // Créer la session d'inventaire
      const { data: session, error: sessionError } = await supabase
        .from('inventory_sessions')
        .insert({
          name: `Inventaire - ${new Date().toLocaleDateString('fr-FR')}`,
          store_id: parseInt(selectedStore),
          created_by: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Obtenir le stock actuel pour ce magasin
      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select(`
          product_id,
          quantity,
          products (name, sku)
        `)
        .eq('store_id', parseInt(selectedStore));

      if (stockError) throw stockError;

      // Créer les éléments d'inventaire
      if (stockData && stockData.length > 0) {
        const inventoryItems = stockData.map(stock => ({
          session_id: session.id,
          product_id: stock.product_id,
          expected_quantity: stock.quantity || 0
        }));

        const { error: itemsError } = await supabase
          .from('inventory_items')
          .insert(inventoryItems);

        if (itemsError) throw itemsError;
      }

      await loadInventorySessions();
      toast({
        title: "Inventaire démarré",
        description: `Nouvelle session d'inventaire créée pour ${storeName}`,
      });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session d'inventaire.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCount = async (itemId, count) => {
    if (!activeSession) return;

    try {
      const item = activeSession.inventory_items.find(i => i.id === itemId);
      if (!item) return;

      const difference = count - item.expected_quantity;

      const { error } = await supabase
        .from('inventory_items')
        .update({
          counted_quantity: count,
          difference: difference,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      await loadInventorySessions();
      setEditingItem(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le comptage.",
        variant: "destructive",
      });
    }
  };

  const handleAdjustStock = async (itemId) => {
    if (!activeSession) return;

    try {
      const item = activeSession.inventory_items.find(i => i.id === itemId);
      if (!item || item.counted_quantity === null) return;

      // Marquer comme ajusté
      const { error: adjustError } = await supabase
        .from('inventory_items')
        .update({
          is_adjusted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (adjustError) throw adjustError;

      // Mettre à jour le stock réel
      const { error: stockError } = await supabase
        .from('stock')
        .update({
          quantity: item.counted_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', item.product_id)
        .eq('store_id', activeSession.store_id);

      if (stockError) throw stockError;

      await loadInventorySessions();

      toast({
        title: "Stock ajusté",
        description: `Stock de ${item.products?.name} ajusté de ${item.expected_quantity} à ${item.counted_quantity}`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajustement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajuster le stock.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteInventory = async () => {
    if (!activeSession) return;

    try {
      const { error } = await supabase
        .from('inventory_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', activeSession.id);

      if (error) throw error;

      setActiveSession(null);
      await loadInventorySessions();

      toast({
        title: "Inventaire terminé",
        description: "L'inventaire a été complété avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de finaliser l'inventaire.",
        variant: "destructive",
      });
    }
  };

  // Filtrage optimisé avec useMemo
  const filteredItems = useMemo(() => {
    if (!activeSession?.inventory_items) return [];
    
    return activeSession.inventory_items.filter(item => {
      const matchesSearch = item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.products?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [activeSession, searchTerm]);

  // Métriques calculées pour admin/manager
  const metrics = useMemo(() => {
    if (!canViewMetrics) return null;
    
    const totalItems = inventorySessions.reduce((acc, session) => 
      acc + (session.inventory_items?.length || 0), 0);
    const countedItems = inventorySessions.reduce((acc, session) => 
      acc + (session.inventory_items?.filter(item => item.counted_quantity !== null).length || 0), 0);
    const adjustedItems = inventorySessions.reduce((acc, session) => 
      acc + (session.inventory_items?.filter(item => item.is_adjusted).length || 0), 0);
    
    return {
      totalSessions: inventorySessions.length,
      activeSessions: inventorySessions.filter(s => s.status === 'active').length,
      completedSessions: inventorySessions.filter(s => s.status === 'completed').length,
      totalItems,
      countedItems,
      adjustedItems,
      averageAccuracy: totalItems > 0 ? (countedItems / totalItems) * 100 : 0,
      recentActivity: inventorySessions.filter(s => {
        const updatedAt = new Date(s.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return updatedAt > weekAgo;
      }).length
    };
  }, [inventorySessions, canViewMetrics]);

  const getStatusBadge = (item) => {
    if (item.is_adjusted) {
      return <Badge className="bg-green-100 text-green-800">Ajusté</Badge>;
    } else if (item.counted_quantity !== null) {
      return <Badge className="bg-blue-100 text-blue-800">Compté</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
    }
  };

  const getDifferenceBadge = (difference) => {
    if (difference === 0) return <Badge className="bg-green-100 text-green-800">Conforme</Badge>;
    if (difference > 0) return <Badge className="bg-blue-100 text-blue-800">+{difference}</Badge>;
    return <Badge className="bg-red-100 text-red-800">{difference}</Badge>;
  };

  // Vérification des permissions
  if (!canViewInventory) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
          <p className="text-gray-600">{messages.noAccessMessage}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{messages.loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête adaptatif */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{messages.title}</h2>
          <p className="text-gray-600">
            {activeSession ? `Session active: ${activeSession.name}` : messages.subtitle}
          </p>
          {userRole === 'seller' && (
            <p className="text-sm text-blue-600 mt-1">
              Mode consultation - Contactez votre manager pour les modifications
            </p>
          )}
        </div>
        
        {/* Actions rapides selon le rôle */}
        <div className="flex flex-wrap gap-2">
          {canCreateInventory && !activeSession && (
            <>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="all">
                  {userRole === 'admin' ? 'Sélectionner un magasin' :
                   userRole === 'manager' ? 'Votre magasin' :
                   'Sélectionner un magasin'}
                </option>
                {stores
                  .filter(store => canViewAllStores || store.id.toString() === selectedStore)
                  .map(store => (
                    <option key={store.id} value={store.id.toString()}>{store.name}</option>
                  ))}
              </select>
              <Button 
                onClick={handleStartNewInventory}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={selectedStore === 'all'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Démarrer inventaire
              </Button>
            </>
          )}
          
          {canViewMetrics && (
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'session' ? 'history' : 'session')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {viewMode === 'session' ? 'Historique' : 'Session'}
            </Button>
          )}
        </div>
      </div>

      {/* Métriques pour admin/manager */}
      {canViewMetrics && metrics && inventorySessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ClipboardList className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-lg font-bold text-blue-600">{metrics.totalSessions}</span>
              </div>
              <p className="text-xs text-gray-600">Sessions totales</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-orange-600 mr-2" />
                <span className="text-lg font-bold text-orange-600">{metrics.activeSessions}</span>
              </div>
              <p className="text-xs text-gray-600">Sessions actives</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-lg font-bold text-purple-600">{metrics.countedItems}</span>
              </div>
              <p className="text-xs text-gray-600">Articles comptés</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-lg font-bold text-green-600">
                  {metrics.averageAccuracy.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-gray-600">Précision moyenne</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSession && (
        <>
          {/* Barre de recherche */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={messages.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveSession(null)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  {canCompleteInventory && (
                    <Button
                      onClick={handleCompleteInventory}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Terminer inventaire
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des articles à compter */}
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-gray-400" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.products?.name || 'Produit inconnu'}</h3>
                          <p className="text-sm text-gray-600">{item.products?.sku || 'SKU inconnu'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Stock attendu</p>
                        <p className="text-xl font-bold text-gray-900">{item.expected_quantity}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Stock compté</p>
                        {editingItem === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              className="w-20 text-center"
                              autoFocus
                              defaultValue={item.counted_quantity || 0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const value = parseInt((e.target as HTMLInputElement).value);
                                  handleUpdateCount(item.id, value || 0);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                const input = document.querySelector(`input[type="number"]`) as HTMLInputElement;
                                const value = parseInt(input.value);
                                handleUpdateCount(item.id, value || 0);
                              }}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-bold text-blue-600">
                              {item.counted_quantity !== null ? item.counted_quantity : '-'}
                            </p>
                            {canEditInventory && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingItem(item.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {!canEditInventory && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Différence</p>
                        {item.counted_quantity !== null && getDifferenceBadge(item.difference || 0)}
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Statut</p>
                        {getStatusBadge(item)}
                      </div>
                      
                      {item.counted_quantity !== null && (item.difference || 0) !== 0 && !item.is_adjusted && canAdjustStock && (
                        <Button
                          onClick={() => handleAdjustStock(item.id)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Ajuster stock
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Historique des inventaires */}
      {!activeSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {userRole === 'admin' ? 'Historique des inventaires' :
               userRole === 'manager' ? 'Vos inventaires précédents' :
               'Historique des inventaires'}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {userRole === 'admin' ? 'Toutes les sessions d\'inventaire' :
               userRole === 'manager' ? 'Sessions d\'inventaire de votre magasin' :
               'Sessions d\'inventaire consultables'}
            </p>
          </CardHeader>
          <CardContent>
            {inventorySessions.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun inventaire</h3>
                <p className="text-gray-600">{messages.emptyMessage}</p>
                {canCreateInventory && (
                  <Button 
                    onClick={() => setViewMode('session')}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Démarrer un inventaire
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {inventorySessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{session.name}</h4>
                      <p className="text-sm text-gray-600">
                        {session.stores?.name} • {new Date(session.created_at).toLocaleDateString('fr-FR')}
                        {session.created_by_profile && ` • Par ${session.created_by_profile?.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        session.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }>
                        {session.status === 'completed' ? 'Terminé' : 'Actif'}
                      </Badge>
                      {session.status === 'active' && canEditInventory && (
                        <Button
                          size="sm"
                          onClick={() => setActiveSession(session)}
                        >
                          Reprendre
                        </Button>
                      )}
                      {canViewMetrics && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Fonction d'export simplifiée
                            const csvContent = [
                              'Produit,SKU,Quantité attendue,Quantité comptée,Différence,Ajusté',
                              ...(session.inventory_items || []).map(item => 
                                `${item.products?.name || ''},${item.products?.sku || ''},${item.expected_quantity},${item.counted_quantity || 0},${item.difference || 0},${item.is_adjusted ? 'Oui' : 'Non'}`
                              )
                            ].join('\n');

                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `inventaire_${session.id}_${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
