import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { useInventoryOptimized } from '@/hooks/useInventoryOptimized';
import { useStores } from '@/hooks/useStores';

export const InventoryAdaptive = () => {
  const {
    inventorySessions,
    activeSession,
    metrics,
    isLoading,
    error,
    canViewInventory,
    canCreateInventory,
    canEditInventory,
    canCompleteInventory,
    canAdjustStock,
    canViewMetrics,
    canViewAllStores,
    canViewAudit,
    userRole,
    messages,
    createInventorySession,
    updateCount,
    adjustStock,
    completeInventory,
    isCreating,
    isUpdating,
    isAdjusting,
    isCompleting,
    exportInventoryReport
  } = useInventoryOptimized();

  const { stores } = useStores();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState<'session' | 'history'>('session');

  // Filtrage intelligent selon le rôle
  const filteredItems = useMemo(() => {
    if (!activeSession?.inventory_items) return [];
    
    return activeSession.inventory_items.filter(item => {
      const matchesSearch = item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.products?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [activeSession, searchTerm]);

  // Actions contextuelles selon le rôle
  const getQuickActions = () => {
    const actions = [];

    if (canCreateInventory && !activeSession) {
      actions.push({
        label: 'Démarrer inventaire',
        icon: Plus,
        action: () => handleStartNewInventory(),
        variant: 'default' as const,
        className: 'bg-blue-600 hover:bg-blue-700',
        disabled: selectedStore === 'all'
      });
    }

    if (canViewMetrics && activeSession) {
      actions.push({
        label: 'Exporter rapport',
        icon: Download,
        action: () => exportInventoryReport(activeSession.id, 'csv'),
        variant: 'outline' as const
      });
    }

    if (canViewAudit && activeSession) {
      actions.push({
        label: 'Exporter JSON',
        icon: Download,
        action: () => exportInventoryReport(activeSession.id, 'json'),
        variant: 'outline' as const
      });
    }

    return actions;
  };

  const handleStartNewInventory = async () => {
    if (selectedStore === 'all') {
      return;
    }

    const storeName = stores.find(s => s.id.toString() === selectedStore)?.name || '';
    const sessionName = `Inventaire - ${storeName} - ${new Date().toLocaleDateString('fr-FR')}`;
    
    await createInventorySession({
      name: sessionName,
      storeId: parseInt(selectedStore)
    });
  };

  const handleUpdateCount = async (itemId: number, count: number) => {
    await updateCount({ itemId, count });
    setEditingItem(null);
  };

  const handleAdjustStock = async (itemId: number) => {
    await adjustStock({ itemId });
  };

  const handleCompleteInventory = async () => {
    if (activeSession) {
      await completeInventory({ sessionId: activeSession.id });
    }
  };

  // Gestion des erreurs avec messages adaptés
  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Erreur de chargement"
          message={error.message || messages.errorMessage}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // État de chargement avec message adapté
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

  // Vérification des permissions
  if (!canViewInventory) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Accès restreint"
          message={messages.noAccessMessage}
        />
      </div>
    );
  }

  const getStatusBadge = (item: any) => {
    if (item.is_adjusted) {
      return <Badge className="bg-green-100 text-green-800">Ajusté</Badge>;
    } else if (item.counted_quantity !== null) {
      return <Badge className="bg-blue-100 text-blue-800">Compté</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
    }
  };

  const getDifferenceBadge = (difference: number) => {
    if (difference === 0) return <Badge className="bg-green-100 text-green-800">Conforme</Badge>;
    if (difference > 0) return <Badge className="bg-blue-100 text-blue-800">+{difference}</Badge>;
    return <Badge className="bg-red-100 text-red-800">{difference}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête adaptatif */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {userRole === 'admin' ? 'Gestion des inventaires' :
             userRole === 'manager' ? 'Inventaires de magasin' :
             'Inventaires'}
          </h2>
          <p className="text-gray-600">
            {activeSession 
              ? `Session active: ${activeSession.name}`
              : userRole === 'admin' ? `${inventorySessions.length} session(s) d'inventaire`
              : userRole === 'manager' ? `${inventorySessions.length} inventaire(s) de votre magasin`
              : `${inventorySessions.length} inventaire(s) disponible(s)`
            }
          </p>
          {userRole === 'seller' && (
            <p className="text-sm text-blue-600 mt-1">
              Mode consultation - Contactez votre manager pour les modifications
            </p>
          )}
        </div>

        {/* Actions rapides selon le rôle */}
        <div className="flex flex-wrap gap-2">
          {getQuickActions().map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              variant={action.variant}
              className={action.className}
              disabled={action.disabled || isCreating || isUpdating}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Métriques pour admin/manager */}
      {canViewMetrics && inventorySessions.length > 0 && (
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

      {/* Sélection de magasin pour création */}
      {canCreateInventory && !activeSession && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {userRole === 'admin' ? 'Sélectionner un magasin pour l\'inventaire' :
                   userRole === 'manager' ? 'Votre magasin pour l\'inventaire' :
                   'Magasin pour consultation'}
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                  disabled={!canCreateInventory}
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session d'inventaire active */}
      {activeSession && (
        <>
          {/* Barre de recherche et actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={
                      userRole === 'admin' ? 'Rechercher par nom ou SKU...' :
                      userRole === 'manager' ? 'Trouver un produit...' :
                      'Rechercher un article...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  {canViewMetrics && (
                    <Button
                      variant="outline"
                      onClick={() => exportInventoryReport(activeSession.id, 'csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => setViewMode(viewMode === 'session' ? 'history' : 'session')}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {viewMode === 'session' ? 'Historique' : 'Session'}
                  </Button>
                  
                  {canCompleteInventory && (
                    <Button
                      onClick={handleCompleteInventory}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isCompleting}
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
                                disabled={isUpdating}
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
                          disabled={isAdjusting}
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
              <EmptyState
                icon={Package}
                title="Aucun inventaire"
                description={messages.emptyStateMessage}
                action={
                  canCreateInventory
                    ? {
                        label: 'Démarrer un inventaire',
                        onClick: () => setViewMode('session'),
                        icon: Plus
                      }
                    : undefined
                }
              />
            ) : (
              <div className="space-y-4">
                {inventorySessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{session.name}</h4>
                      <p className="text-sm text-gray-600">
                        {session.stores?.name} • {new Date(session.created_at).toLocaleDateString('fr-FR')}
                        {session.created_by_profile && ` • Par ${session.created_by_profile.name}`}
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
                          onClick={() => setViewMode('session')}
                        >
                          Reprendre
                        </Button>
                      )}
                      {canViewMetrics && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportInventoryReport(session.id, 'csv')}
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