import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Plus, 
  Edit,
  ArrowRightLeft,
  MapPin,
  Phone,
  Mail,
  Search,
  Users,
  TrendingUp,
  AlertCircle,
  Settings,
  Clock,
  Eye,
  BarChart3,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  UserPlus,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useStoresOptimized } from '@/hooks/useStoresOptimized';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { FilterSelect } from '@/components/common/FilterSelect';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsGrid } from '@/components/common/StatsGrid';
import { formatDate } from '@/utils/formatters';
import { toast } from '@/hooks/use-toast';

// Composant pour les actions rapides selon le rôle
const QuickActions = ({ actions, onAction }: { actions: string[], onAction: (action: string) => void }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Voir mes magasins': return Eye;
      case 'Statistiques': return BarChart3;
      case 'Contact': return Phone;
      case 'Historique': return Clock;
      case 'Nouveau magasin': return Plus;
      case 'Gestion équipe': return Users;
      case 'Rapports': return BarChart3;
      case 'Configuration': return Settings;
      case 'Rapports globaux': return BarChart3;
      case 'Audit': return Eye;
      default: return Plus;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Nouveau magasin': return 'bg-blue-600 hover:bg-blue-700';
      case 'Gestion équipe': return 'bg-green-600 hover:bg-green-700';
      case 'Rapports': return 'bg-purple-600 hover:bg-purple-700';
      case 'Configuration': return 'bg-gray-600 hover:bg-gray-700';
      default: return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => {
        const Icon = getActionIcon(action);
        return (
          <Button
            key={action}
            variant="outline"
            size="sm"
            onClick={() => onAction(action)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {action}
          </Button>
        );
      })}
    </div>
  );
};

// Composant pour les statistiques adaptatives
const AdaptiveStats = ({ stats, context }: { stats: any[], context: any }) => {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return Building2;
      case 'Users': return Users;
      case 'TrendingUp': return TrendingUp;
      case 'AlertCircle': return AlertCircle;
      case 'Settings': return Settings;
      case 'Clock': return Clock;
      default: return Building2;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = getIconComponent(stat.icon);
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color.replace('text-', 'bg-')} bg-opacity-10`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Composant pour les filtres adaptatifs
const AdaptiveFilters = ({ filters, context, onFilterChange }: { 
  filters: any[], 
  context: any, 
  onFilterChange: (key: string, value: string) => void 
}) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {filters.map((filter) => (
        <div key={filter.key} className="min-w-[200px]">
          <FilterSelect
            value="all"
            onChange={(value) => onFilterChange(filter.key, value)}
            options={filter.options}
            placeholder={filter.label}
          />
        </div>
      ))}
    </div>
  );
};

// Composant principal des magasins optimisés
export const StoresOptimized = () => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false);

  const {
    stores,
    isLoading,
    error,
    context,
    roleContent,
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedPeriod,
    setSelectedPeriod,
    totalStores,
    activeStores,
    inactiveStores,
    getPersonalizedMessage,
    refetch,
    canCreateStore,
    canEditStore,
    canDeleteStore,
    canManageEmployees,
    createStore,
    updateStore,
    deleteStore,
    toggleStoreStatus,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus
  } = useStoresOptimized();

  // Gestion des actions rapides
  const handleQuickAction = (action: string) => {
    setSelectedAction(action);
    
    switch (action) {
      case 'Nouveau magasin':
        setShowStoreForm(true);
        break;
      case 'Gestion équipe':
        setShowEmployeeManagement(true);
        break;
      case 'Voir mes magasins':
      case 'Statistiques':
      case 'Contact':
      case 'Historique':
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

  // Gestion des filtres
  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'status':
        setSelectedStatus(value);
        break;
      case 'performance':
      case 'region':
        // TODO: Implémenter les filtres avancés
        console.log(`Filtrer par ${key}: ${value}`);
        break;
    }
  };

  // Messages d'état selon le rôle
  const getEmptyStateMessage = () => {
    const { role } = context;
    
    if (searchTerm) {
      return {
        title: "Aucun magasin trouvé",
        description: "Aucun magasin ne correspond à votre recherche.",
        actionLabel: "Nouveau magasin",
        onAction: () => setShowStoreForm(true)
      };
    }

    switch (role) {
      case 'seller':
        return {
          title: "Aucun magasin assigné",
          description: "Vous n'avez pas encore de magasins assignés à votre compte.",
          actionLabel: "Contacter l'administrateur",
          onAction: () => {
            toast({
              title: "Contact",
              description: "Contactez votre administrateur pour être assigné à un magasin.",
            });
          }
        };
      case 'manager':
        return {
          title: "Aucun magasin géré",
          description: "Vous n'avez pas encore de magasins à gérer.",
          actionLabel: "Nouveau magasin",
          onAction: () => setShowStoreForm(true)
        };
      case 'admin':
        return {
          title: "Aucun magasin dans le système",
          description: "Le système est prêt pour les premiers magasins.",
          actionLabel: "Nouveau magasin",
          onAction: () => setShowStoreForm(true)
        };
      default:
        return {
          title: "Aucun magasin",
          description: "Commencez par créer votre premier magasin.",
          actionLabel: "Nouveau magasin",
          onAction: () => setShowStoreForm(true)
        };
    }
  };

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Erreur de chargement"
          message="Impossible de charger les magasins"
          onRetry={refetch}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement de vos magasins...</p>
        </div>
      </div>
    );
  }

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
            <Button 
              variant="outline"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            {canCreateStore() && (
              <Button 
                onClick={() => setShowStoreForm(true)}
                className="bg-blue-600 hover:bg-blue-700 h-12"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau magasin
              </Button>
            )}
          </div>
        </div>

        {/* Actions rapides selon le rôle */}
        <QuickActions 
          actions={roleContent.quickActions} 
          onAction={handleQuickAction}
        />
      </div>

      {/* Statistiques adaptatives */}
      <AdaptiveStats stats={roleContent.stats} context={context} />

      {/* Filtres adaptatifs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchAndFilter
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={
              context.isSeller 
                ? "Rechercher dans vos magasins..." 
                : "Rechercher par nom, adresse, email..."
            }
            filters={
              <div className="flex flex-wrap gap-4">
                {/* Filtre statut */}
                <FilterSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={[
                    { value: 'all', label: 'Tous les statuts' },
                    { value: 'active', label: 'Actifs' },
                    { value: 'inactive', label: 'Inactifs' }
                  ]}
                  placeholder="Statut"
                />

                {/* Filtres spécifiques au rôle */}
                <AdaptiveFilters 
                  filters={roleContent.filters} 
                  context={context}
                  onFilterChange={handleFilterChange}
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Résumé des résultats */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {totalStores} magasin{totalStores > 1 ? 's' : ''} trouvé{totalStores > 1 ? 's' : ''}
          {activeStores > 0 && ` • ${activeStores} actif${activeStores > 1 ? 's' : ''}`}
          {inactiveStores > 0 && ` • ${inactiveStores} inactif${inactiveStores > 1 ? 's' : ''}`}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Liste des magasins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stores.map((store) => (
          <Card key={store.id} className={`${!store.is_active ? 'opacity-60' : ''} hover:shadow-md transition-shadow`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    {store.name}
                  </CardTitle>
                  <CardDescription>
                    Créé le {formatDate(store.created_at, true)}
                    {store.profiles && (
                      <span className="ml-2">
                        • Manager: {store.profiles.name}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(store.is_active)}>
                    {store.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                  {canEditStore(store.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Ouvrir le formulaire d'édition
                        toast({
                          title: "Fonctionnalité à venir",
                          description: "L'édition des magasins sera bientôt disponible.",
                        });
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Informations de contact */}
                <div className="space-y-2">
                  {store.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{store.address}</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{store.phone}</span>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{store.email}</span>
                    </div>
                  )}
                </div>

                {/* Statistiques rapides pour les managers et admins */}
                {(context.isManager || context.isAdmin) && (
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold">0</div>
                      <div>Employés</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold">0</div>
                      <div>Produits</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold">0</div>
                      <div>Ventes</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t flex gap-2">
                  {canEditStore(store.id) && (
                    <Button
                      variant={store.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleStoreStatus(store.id)}
                      disabled={isTogglingStatus}
                    >
                      {isTogglingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {store.is_active ? <XCircle className="h-4 w-4 mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                          {store.is_active ? 'Désactiver' : 'Activer'}
                        </>
                      )}
                    </Button>
                  )}
                  
                  {canManageEmployees() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmployeeManagement(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Employés
                    </Button>
                  )}
                  
                  {canDeleteStore() && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer le magasin "${store.name}" ?`)) {
                          deleteStore(store.id);
                        }
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* État vide adaptatif */}
      {stores.length === 0 && (
        <EmptyState
          icon={Building2}
          {...getEmptyStateMessage()}
        />
      )}

      {/* Statistiques détaillées pour les managers et admins */}
      {(context.isManager || context.isAdmin) && stores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{activeStores}</div>
              <p className="text-sm text-gray-600">Magasins actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-900">{totalStores}</div>
              <p className="text-sm text-gray-600">Total magasins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stores.filter(s => s.manager_id).length}
              </div>
              <p className="text-sm text-gray-600">Magasins avec responsable</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals (à implémenter) */}
      {showStoreForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Nouveau magasin</CardTitle>
              <CardDescription>
                Créez un nouveau magasin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-gray-500">
                Formulaire de magasin à implémenter
              </p>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowStoreForm(false)}
                >
                  Annuler
                </Button>
                <Button onClick={() => setShowStoreForm(false)}>
                  Créer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEmployeeManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4">
            <CardHeader>
              <CardTitle>Gestion des employés</CardTitle>
              <CardDescription>
                Gérez les employés de vos magasins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-gray-500">
                Interface de gestion des employés à implémenter
              </p>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEmployeeManagement(false)}
                >
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 