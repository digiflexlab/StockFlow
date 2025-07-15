import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Store,
  Target,
  Calculator,
  Receipt,
  BarChart3,
  Settings,
  Clock,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { SaleModal } from '@/components/modals/SaleModal';
import { useSalesOptimized } from '@/hooks/useSalesOptimized';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { FilterSelect } from '@/components/common/FilterSelect';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsGrid } from '@/components/common/StatsGrid';
import { formatPrice, formatDate } from '@/utils/formatters';
import { getSaleStatusBadge, getPaymentMethodLabel } from '@/utils/helpers';

// Composant pour les actions rapides selon le rôle
const QuickActions = ({ actions, onAction }: { actions: string[], onAction: (action: string) => void }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Nouvelle vente': return Plus;
      case 'Caisse': return Calculator;
      case 'Produits populaires': return Package;
      case 'Historique': return Clock;
      case 'Rapports': return BarChart3;
      case 'Équipe': return Users;
      case 'Objectifs': return Target;
      case 'Configuration': return Settings;
      case 'Rapports globaux': return BarChart3;
      case 'Audit': return Eye;
      default: return Plus;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Nouvelle vente': return 'bg-green-600 hover:bg-green-700';
      case 'Caisse': return 'bg-blue-600 hover:bg-blue-700';
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
      case 'ShoppingCart': return ShoppingCart;
      case 'DollarSign': return DollarSign;
      case 'TrendingUp': return TrendingUp;
      case 'Package': return Package;
      case 'Users': return Users;
      case 'Store': return Store;
      case 'Target': return Target;
      default: return ShoppingCart;
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

// Composant principal des ventes optimisées
export const SalesOptimized = () => {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const {
    sales,
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
    totalSales,
    totalRevenue,
    getPersonalizedMessage,
    refetch
  } = useSalesOptimized();

  // Gestion des actions rapides
  const handleQuickAction = (action: string) => {
    setSelectedAction(action);
    
    switch (action) {
      case 'Nouvelle vente':
        setIsSaleModalOpen(true);
        break;
      case 'Caisse':
        // TODO: Ouvrir la caisse
        console.log('Ouvrir la caisse');
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
        title: "Aucune vente trouvée",
        description: "Aucune vente ne correspond à votre recherche.",
        actionLabel: "Nouvelle vente",
        onAction: () => setIsSaleModalOpen(true)
      };
    }

    switch (role) {
      case 'seller':
        return {
          title: "Aucune vente aujourd'hui",
          description: "Commencez votre journée en enregistrant votre première vente !",
          actionLabel: "Nouvelle vente",
          onAction: () => setIsSaleModalOpen(true)
        };
      case 'manager':
        return {
          title: "Aucune vente dans votre équipe",
          description: "Encouragez votre équipe à commencer les ventes.",
          actionLabel: "Nouvelle vente",
          onAction: () => setIsSaleModalOpen(true)
        };
      case 'admin':
        return {
          title: "Aucune vente dans le système",
          description: "Le système est prêt pour les premières ventes.",
          actionLabel: "Nouvelle vente",
          onAction: () => setIsSaleModalOpen(true)
        };
      default:
        return {
          title: "Aucune vente",
          description: "Commencez par enregistrer votre première vente.",
          actionLabel: "Nouvelle vente",
          onAction: () => setIsSaleModalOpen(true)
        };
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Erreur de chargement"
          message="Impossible de charger les ventes"
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
          <p className="text-gray-600">Chargement de vos ventes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête personnalisé */}
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
              onClick={() => setIsSaleModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle vente
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
                ? "Rechercher dans vos ventes..." 
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
                    { value: 'completed', label: 'Terminées' },
                    { value: 'cancelled', label: 'Annulées' },
                    { value: 'refunded', label: 'Remboursées' }
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
          {totalSales} vente{totalSales > 1 ? 's' : ''} trouvée{totalSales > 1 ? 's' : ''}
          {totalRevenue > 0 && ` • Total: ${formatPrice(totalRevenue)}`}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Liste des ventes */}
      <div className="grid grid-cols-1 gap-4">
        {sales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{sale.sale_number}</h3>
                    <StatusBadge type="sale" value={sale.status} />
                    {sale.payment_method && (
                      <Badge variant="outline">
                        {getPaymentMethodLabel(sale.payment_method)}
                      </Badge>
                    )}
                    {/* Indicateurs spécifiques au rôle */}
                    {context.isManager && (
                      <Badge variant="secondary" className="text-xs">
                        {sale.profiles?.name}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      Magasin: {sale.stores?.name}
                    </span>
                    {context.isAdmin && (
                      <span>
                        Vendeur: {sale.profiles?.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(sale.created_at, true)}
                    </span>
                  </div>
                  
                  {sale.customer_name && (
                    <div className="text-sm text-gray-600">
                      Client: {sale.customer_name}
                      {sale.customer_email && ` (${sale.customer_email})`}
                    </div>
                  )}

                  {/* Notes pour les managers et admins */}
                  {(context.isManager || context.isAdmin) && sale.notes && (
                    <div className="text-sm text-gray-500 italic">
                      Note: {sale.notes}
                    </div>
                  )}
                </div>

                <div className="text-right space-y-2">
                  <div className="text-xl font-bold text-gray-900">
                    {formatPrice(sale.total)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {sale.discount_amount > 0 && (
                      <div className="text-red-600">
                        Remise: -{formatPrice(sale.discount_amount)}
                      </div>
                    )}
                    <div>HT: {formatPrice(sale.total - (sale.tax_amount || 0))}</div>
                    {sale.sale_items && (
                      <div className="text-xs text-gray-500">
                        {sale.sale_items.length} article{sale.sale_items.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Actions selon le rôle */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
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
      {sales.length === 0 && (
        <EmptyState
          icon={ShoppingCart}
          {...getEmptyStateMessage()}
        />
      )}

      {/* Modal de vente */}
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
      />
    </div>
  );
}; 