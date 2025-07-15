import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Building2, 
  Phone,
  Mail,
  Edit,
  Trash2,
  Download,
  BarChart3,
  Users,
  Package,
  Calendar,
  Loader2,
  AlertCircle,
  Eye,
  Shield,
  TrendingUp
} from 'lucide-react';
import { SupplierModal } from '@/components/modals/SupplierModal';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { useSuppliersOptimized } from '@/hooks/useSuppliersOptimized';
import { usePermissions } from '@/hooks/usePermissions';

export const SuppliersAdaptive = () => {
  const {
    suppliers,
    metrics,
    isLoading,
    error,
    canViewSuppliers,
    canCreateSuppliers,
    canEditSuppliers,
    canDeleteSuppliers,
    canViewMetrics,
    userRole,
    messages,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    isCreating,
    isUpdating,
    isDeleting,
    exportSuppliers
  } = useSuppliersOptimized();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtrage intelligent selon le rôle
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'active' && supplier.is_active) ||
                           (selectedStatus === 'inactive' && !supplier.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchTerm, selectedStatus]);

  // Actions contextuelles selon le rôle
  const getQuickActions = () => {
    const actions = [];

    if (canCreateSuppliers) {
      actions.push({
        label: 'Ajouter un fournisseur',
        icon: Plus,
        action: () => setIsSupplierModalOpen(true),
        variant: 'default' as const,
        className: 'bg-blue-600 hover:bg-blue-700'
      });
    }

    if (canViewMetrics) {
      actions.push({
        label: 'Exporter CSV',
        icon: Download,
        action: () => exportSuppliers('csv'),
        variant: 'outline' as const
      });
    }

    if (isAdmin) {
      actions.push({
        label: 'Exporter JSON',
        icon: Download,
        action: () => exportSuppliers('json'),
        variant: 'outline' as const
      });
    }

    return actions;
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
          <p className="text-gray-600">
            {userRole === 'admin' ? 'Chargement des données fournisseurs...' :
             userRole === 'manager' ? 'Récupération de votre réseau fournisseurs...' :
             'Consultation des fournisseurs disponibles...'}
          </p>
        </div>
      </div>
    );
  }

  // Vérification des permissions
  if (!canViewSuppliers) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Accès restreint"
          message={messages.noAccessMessage}
          icon={Shield}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête adaptatif */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {userRole === 'admin' ? 'Gestion des fournisseurs' :
             userRole === 'manager' ? 'Réseau fournisseurs' :
             'Fournisseurs'}
          </h2>
          <p className="text-gray-600">
            {userRole === 'admin' ? `${suppliers.length} fournisseur(s) enregistré(s)` :
             userRole === 'manager' ? `${suppliers.length} partenaire(s) commercial(aux)` :
             `${suppliers.length} fournisseur(s) disponible(s)`}
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
              disabled={isCreating || isUpdating}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Métriques pour admin/manager */}
      {canViewMetrics && suppliers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-lg font-bold text-blue-600">{metrics.totalSuppliers}</span>
              </div>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-lg font-bold text-green-600">{metrics.activeSuppliers}</span>
              </div>
              <p className="text-xs text-gray-600">Actifs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Package className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-lg font-bold text-purple-600">{metrics.suppliersWithProducts}</span>
              </div>
              <p className="text-xs text-gray-600">Avec produits</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="h-5 w-5 text-orange-600 mr-2" />
                <span className="text-lg font-bold text-orange-600">
                  {metrics.averageProductsPerSupplier.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-gray-600">Moy. produits</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-lg font-bold text-red-600">{metrics.recentActivity}</span>
              </div>
              <p className="text-xs text-gray-600">Activité récente</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={
                  userRole === 'admin' ? 'Rechercher par nom, email ou contact...' :
                  userRole === 'manager' ? 'Trouver un partenaire...' :
                  'Rechercher un fournisseur...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>

            {canViewMetrics && (
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grille
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  Liste
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des fournisseurs */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <Badge 
                        className={
                          supplier.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {supplier.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Actions selon le rôle */}
                  <div className="flex gap-1">
                    {canEditSuppliers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSupplier(supplier);
                          setIsSupplierModalOpen(true);
                        }}
                        disabled={isUpdating}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canDeleteSuppliers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
                            deleteSupplier(supplier.id);
                          }
                        }}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {!canEditSuppliers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                
                {supplier.contact_person && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Contact:</p>
                    <p className="text-sm text-gray-600">{supplier.contact_person}</p>
                  </div>
                )}
                
                {/* Métriques pour admin/manager */}
                {canViewMetrics && (supplier as any).products_count !== undefined && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Produits: {(supplier as any).products_count}</span>
                      {(supplier as any).total_orders !== undefined && (
                        <span>Commandes: {(supplier as any).total_orders}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {supplier.address && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">{supplier.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Vue liste pour admin/manager
        <div className="space-y-4">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{supplier.name}</h3>
                      <p className="text-sm text-gray-600">
                        {supplier.contact_person && `${supplier.contact_person} • `}
                        {supplier.email && `${supplier.email} • `}
                        {supplier.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {canViewMetrics && (
                      <div className="text-right text-sm text-gray-500">
                        <div>{(supplier as any).products_count || 0} produits</div>
                        <div>{(supplier as any).total_orders || 0} commandes</div>
                      </div>
                    )}
                    
                    <Badge 
                      className={
                        supplier.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {supplier.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    
                    <div className="flex gap-1">
                      {canEditSuppliers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSupplier(supplier);
                            setIsSupplierModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {canDeleteSuppliers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
                              deleteSupplier(supplier.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* État vide adaptatif */}
      {filteredSuppliers.length === 0 && (
        <EmptyState
          icon={Building2}
          title={
            searchTerm || selectedStatus !== 'all'
              ? 'Aucun fournisseur trouvé'
              : 'Aucun fournisseur'
          }
          message={
            searchTerm || selectedStatus !== 'all'
              ? 'Aucun fournisseur ne correspond à vos critères de recherche.'
              : messages.emptyStateMessage
          }
          action={
            canCreateSuppliers && !searchTerm && selectedStatus === 'all'
              ? {
                  label: 'Ajouter un fournisseur',
                  onClick: () => setIsSupplierModalOpen(true),
                  icon: Plus
                }
              : undefined
          }
        />
      )}

      {/* Modal de création/édition de fournisseur */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setEditingSupplier(null);
        }}
        supplier={editingSupplier}
      />
    </div>
  );
}; 