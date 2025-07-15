
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
  Package,
  Calendar,
  Loader2,
  Eye,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react';
import { SupplierModal } from '@/components/modals/SupplierModal';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/hooks/useAuth';

export const Suppliers = () => {
  const { suppliers, isLoading, error, createSupplier, updateSupplier, isCreating, isUpdating } = useSuppliers();
  const { canEditSuppliers } = usePermissions();
  const { isAdmin, isManager, isSeller } = useUserRoles();
  const { profile } = useAuth();
  const userRole = profile?.role || 'seller';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Messages adaptés selon le rôle
  const getRoleBasedMessages = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: 'Gestion des fournisseurs',
          subtitle: `${suppliers.length} fournisseur(s) enregistré(s)`,
          emptyMessage: 'Aucun fournisseur enregistré. Commencez par ajouter vos partenaires commerciaux.',
          searchPlaceholder: 'Rechercher par nom, email ou contact...',
          loadingMessage: 'Chargement des données fournisseurs...'
        };
      case 'manager':
        return {
          title: 'Réseau fournisseurs',
          subtitle: `${suppliers.length} partenaire(s) commercial(aux)`,
          emptyMessage: 'Aucun fournisseur disponible. Ajoutez vos premiers partenaires.',
          searchPlaceholder: 'Trouver un partenaire...',
          loadingMessage: 'Récupération de votre réseau fournisseurs...'
        };
      case 'seller':
        return {
          title: 'Fournisseurs',
          subtitle: `${suppliers.length} fournisseur(s) disponible(s)`,
          emptyMessage: 'Aucun fournisseur à consulter. Contactez votre manager.',
          searchPlaceholder: 'Rechercher un fournisseur...',
          loadingMessage: 'Consultation des fournisseurs disponibles...'
        };
      default:
        return {
          title: 'Fournisseurs',
          subtitle: `${suppliers.length} fournisseur(s)`,
          emptyMessage: 'Aucun fournisseur disponible.',
          searchPlaceholder: 'Rechercher...',
          loadingMessage: 'Chargement...'
        };
    }
  };

  const messages = getRoleBasedMessages();

  // Permissions granulaires
  const canViewSuppliers = isAdmin || isManager || isSeller;
  const canCreateSuppliers = isAdmin || isManager;
  const canDeleteSuppliers = isAdmin;
  const canViewMetrics = isAdmin || isManager;

  // Filtrage optimisé avec useMemo
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

  // Métriques calculées pour admin/manager
  const metrics = useMemo(() => {
    if (!canViewMetrics) return null;
    
    return {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(s => s.is_active).length,
      suppliersWithContact: suppliers.filter(s => s.contact_person).length,
      recentActivity: suppliers.filter(s => {
        const updatedAt = new Date(s.updated_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return updatedAt > weekAgo;
      }).length
    };
  }, [suppliers, canViewMetrics]);

  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Erreur de chargement"
          message="Impossible de charger les fournisseurs"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Vérification des permissions
  if (!canViewSuppliers) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Accès restreint"
          message="Vous n'avez pas les permissions pour accéder aux fournisseurs."
        />
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
          <p className="text-gray-600">{messages.subtitle}</p>
          {userRole === 'seller' && (
            <p className="text-sm text-blue-600 mt-1">
              Mode consultation - Contactez votre manager pour les modifications
            </p>
          )}
        </div>
        
        {/* Actions rapides selon le rôle */}
        <div className="flex flex-wrap gap-2">
          {canCreateSuppliers && (
            <Button 
              onClick={() => setIsSupplierModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isCreating || isUpdating}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un fournisseur
            </Button>
          )}
          
          {canViewMetrics && (
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
            </Button>
          )}
        </div>
      </div>

      {/* Métriques pour admin/manager */}
      {canViewMetrics && metrics && suppliers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-lg font-bold text-purple-600">{metrics.suppliersWithContact}</span>
              </div>
              <p className="text-xs text-gray-600">Avec contact</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                <span className="text-lg font-bold text-orange-600">{metrics.recentActivity}</span>
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
                placeholder={messages.searchPlaceholder}
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
          description={
            searchTerm || selectedStatus !== 'all'
              ? 'Aucun fournisseur ne correspond à vos critères de recherche.'
              : messages.emptyMessage
          }
          actionLabel={
            canCreateSuppliers && !searchTerm && selectedStatus === 'all'
              ? 'Ajouter un fournisseur'
              : undefined
          }
          onAction={
            canCreateSuppliers && !searchTerm && selectedStatus === 'all'
              ? () => setIsSupplierModalOpen(true)
              : undefined
          }
        />
      )}

      {/* Historique des fournisseurs pour admin/manager */}
      {canViewMetrics && suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suppliers
                .filter(s => {
                  const updatedAt = new Date(s.updated_at);
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return updatedAt > weekAgo;
                })
                .slice(0, 5)
                .map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">{supplier.name}</p>
                        <p className="text-xs text-gray-600">
                          Modifié le {new Date(supplier.updated_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
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
                ))}
            </div>
          </CardContent>
        </Card>
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
