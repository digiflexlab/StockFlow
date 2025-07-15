import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  RefreshCw, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Users,
  Store,
  TrendingUp,
  Plus,
  Clock,
  Calendar,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Loader2,
  BarChart3,
  Settings,
  Calculator,
  Receipt,
  Target
} from 'lucide-react';
import { useReturnsOptimized } from '@/hooks/useReturnsOptimized';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { FilterSelect } from '@/components/common/FilterSelect';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsGrid } from '@/components/common/StatsGrid';
import { formatPrice, formatDate } from '@/utils/formatters';
import { toast } from '@/hooks/use-toast';

// Composant pour les actions rapides selon le rôle
const QuickActions = ({ actions, onAction }: { actions: string[], onAction: (action: string) => void }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Nouveau retour': return Plus;
      case 'Historique': return Clock;
      case 'Remboursements': return Receipt;
      case 'Mes retours': return Eye;
      case 'Validation': return CheckCircle;
      case 'Rapports': return BarChart3;
      case 'Configuration': return Settings;
      case 'Rapports globaux': return BarChart3;
      case 'Audit': return Eye;
      default: return Plus;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Nouveau retour': return 'bg-green-600 hover:bg-green-700';
      case 'Validation': return 'bg-blue-600 hover:bg-blue-700';
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
      case 'RefreshCw': return RefreshCw;
      case 'DollarSign': return DollarSign;
      case 'CheckCircle': return CheckCircle;
      case 'XCircle': return XCircle;
      case 'Users': return Users;
      case 'Store': return Store;
      case 'TrendingUp': return TrendingUp;
      case 'AlertCircle': return AlertCircle;
      default: return RefreshCw;
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

// Composant principal des retours optimisés
export const ReturnsOptimized = () => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showReturnForm, setShowReturnForm] = useState(false);

  const {
    returns,
    isLoading,
    error,
    context,
    roleContent,
    searchTerm,
    setSearchTerm,
    selectedStore,
    setSelectedStore,
    selectedStatus,
    setSelectedStatus,
    selectedPeriod,
    setSelectedPeriod,
    availableStores,
    totalReturns,
    totalAmount,
    getPersonalizedMessage,
    refetch,
    canCreateReturn,
    canApproveReturn,
    canViewAllReturns
  } = useReturnsOptimized();

  // Gestion des actions rapides
  const handleQuickAction = (action: string) => {
    setSelectedAction(action);
    
    switch (action) {
      case 'Nouveau retour':
        setShowReturnForm(true);
        break;
      case 'Historique':
        // TODO: Naviguer vers l'historique
        console.log('Ouvrir l\'historique');
        break;
      case 'Rapports':
        // TODO: Naviguer vers les rapports
        console.log('Ouvrir les rapports');
        break;
      case 'Configuration':
        // TODO: Naviguer vers la configuration
        console.log('Ouvrir la configuration');
        break;
      default:
        console.log(`Action: ${action}`);
    }
  };

  // Gestion des filtres
  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'store':
        setSelectedStore(value);
        break;
      case 'status':
        setSelectedStatus(value);
        break;
      case 'period':
        setSelectedPeriod(value);
        break;
      case 'seller':
        // TODO: Implémenter le filtre par vendeur
        console.log(`Filtrer par vendeur: ${value}`);
        break;
    }
  };

  // Messages d'état selon le rôle
  const getEmptyStateMessage = () => {
    const { role } = context;
    
    if (searchTerm) {
      return {
        title: "Aucun retour trouvé",
        description: "Aucun retour ne correspond à votre recherche.",
        actionLabel: "Nouveau retour",
        onAction: () => setShowReturnForm(true)
      };
    }

    switch (role) {
      case 'seller':
        return {
          title: "Aucun retour aujourd'hui",
          description: "Aucun retour à traiter pour le moment.",
          actionLabel: "Nouveau retour",
          onAction: () => setShowReturnForm(true)
        };
      case 'manager':
        return {
          title: "Aucun retour dans votre équipe",
          description: "Aucun retour en attente de validation.",
          actionLabel: "Nouveau retour",
          onAction: () => setShowReturnForm(true)
        };
      case 'admin':
        return {
          title: "Aucun retour dans le système",
          description: "Le système est prêt pour les premiers retours.",
          actionLabel: "Nouveau retour",
          onAction: () => setShowReturnForm(true)
        };
      default:
        return {
          title: "Aucun retour",
          description: "Commencez par traiter votre premier retour.",
          actionLabel: "Nouveau retour",
          onAction: () => setShowReturnForm(true)
        };
    }
  };

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Erreur de chargement"
          message="Impossible de charger les retours"
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
          <p className="text-gray-600">Chargement de vos retours...</p>
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
            <Button 
              onClick={() => setShowReturnForm(true)}
              className="bg-green-600 hover:bg-green-700 h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau retour
            </Button>
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
                ? "Rechercher dans vos retours..." 
                : "Rechercher par numéro, client, vendeur..."
            }
            filters={
              <div className="flex flex-wrap gap-4">
                {/* Filtre magasin */}
                <FilterSelect
                  value={selectedStore}
                  onChange={setSelectedStore}
                  options={[
                    { value: 'all', label: context.isAdmin ? 'Tous les magasins' : 'Mon magasin' },
                    ...availableStores.map(store => ({
                      value: store.id.toString(),
                      label: store.name
                    }))
                  ]}
                  placeholder="Magasin"
                />

                {/* Filtre statut */}
                <FilterSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={[
                    { value: 'all', label: 'Tous les statuts' },
                    { value: 'pending', label: 'En attente' },
                    { value: 'approved', label: 'Approuvés' },
                    { value: 'rejected', label: 'Rejetés' }
                  ]}
                  placeholder="Statut"
                />

                {/* Filtre période */}
                <FilterSelect
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  options={[
                    { value: 'today', label: 'Aujourd\'hui' },
                    { value: 'week', label: 'Cette semaine' },
                    { value: 'month', label: 'Ce mois' },
                    { value: '30d', label: '30 derniers jours' },
                    { value: 'quarter', label: 'Ce trimestre' },
                    { value: 'year', label: 'Cette année' }
                  ]}
                  placeholder="Période"
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
          {totalReturns} retour{totalReturns > 1 ? 's' : ''} trouvé{totalReturns > 1 ? 's' : ''}
          {totalAmount > 0 && ` • Total: ${formatPrice(totalAmount)}`}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Liste des retours */}
      <div className="grid grid-cols-1 gap-4">
        {returns.map((ret) => (
          <Card key={ret.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{ret.return_number}</h3>
                    <Badge className={getStatusColor(ret.status)}>
                      {ret.status === 'approved' ? 'Approuvé' : 
                       ret.status === 'pending' ? 'En attente' : 'Rejeté'}
                    </Badge>
                    {ret.sales && (
                      <Badge variant="outline">
                        Vente: {ret.sales.sale_number}
                      </Badge>
                    )}
                    {/* Indicateurs spécifiques au rôle */}
                    {context.isManager && (
                      <Badge variant="secondary" className="text-xs">
                        {ret.profiles?.name}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      Magasin: {ret.stores?.name}
                    </span>
                    {context.isAdmin && (
                      <span>
                        Traité par: {ret.profiles?.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(ret.created_at, true)}
                    </span>
                  </div>
                  
                  {ret.customer_name && (
                    <div className="text-sm text-gray-600">
                      Client: {ret.customer_name}
                    </div>
                  )}

                  {/* Notes pour les managers et admins */}
                  {(context.isManager || context.isAdmin) && ret.notes && (
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
                  <div className="text-sm text-gray-600">
                    {ret.return_items && (
                      <div className="text-xs text-gray-500">
                        {ret.return_items.length} article{ret.return_items.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Actions selon le rôle */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canApproveReturn() && ret.status === 'pending' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-green-600"
                          onClick={() => {
                            // TODO: Implémenter l'approbation
                            console.log('Approuver retour:', ret.id);
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
                            console.log('Rejeter retour:', ret.id);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {(context.isManager || context.isAdmin) && (
                      <>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* État vide adaptatif */}
      {returns.length === 0 && (
        <EmptyState
          icon={RefreshCw}
          {...getEmptyStateMessage()}
        />
      )}

      {/* Modal de formulaire de retour (à implémenter) */}
      {showReturnForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Nouveau retour</CardTitle>
              <CardDescription>
                Créez un nouveau retour ou échange
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-gray-500">
                Formulaire de retour à implémenter
              </p>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReturnForm(false)}
                >
                  Annuler
                </Button>
                <Button onClick={() => setShowReturnForm(false)}>
                  Créer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 