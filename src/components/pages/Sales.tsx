
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { useSales } from '@/hooks/useSales';
import { useStores } from '@/hooks/useStores';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { FilterSelect } from '@/components/common/FilterSelect';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsGrid } from '@/components/common/StatsGrid';
import { formatPrice, formatDate } from '@/utils/formatters';
import { getSaleStatusBadge, getPaymentMethodLabel } from '@/utils/helpers';

export const Sales = () => {
  const { profile } = useAuth();
  const { sales, isLoading, error } = useSales();
  const { stores } = useStores();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Contexte utilisateur pour adaptation automatique
  const userContext = useMemo(() => {
    const role = profile?.role || 'seller';
    const storeIds = profile?.store_ids || [];
    const storeCount = storeIds.length;
    
    return {
      role,
      storeIds,
      storeCount,
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
          title: `Vos ventes (${storeCount} magasin${storeCount > 1 ? 's' : ''})`,
          subtitle: 'Gérez vos ventes quotidiennes et accédez rapidement à vos outils',
          quickActions: ['Nouvelle vente', 'Caisse', 'Produits populaires', 'Historique'],
          personalizedMessage: getPersonalizedMessage(role),
          emptyState: {
            title: "Aucune vente aujourd'hui",
            description: "Commencez votre journée en enregistrant votre première vente !"
          }
        };

      case 'manager':
        return {
          title: `Gestion des ventes - ${storeCount} magasin${storeCount > 1 ? 's' : ''}`,
          subtitle: 'Supervisez les performances de votre équipe et analysez les tendances',
          quickActions: ['Nouvelle vente', 'Rapports', 'Équipe', 'Objectifs'],
          personalizedMessage: getPersonalizedMessage(role),
          emptyState: {
            title: "Aucune vente dans votre équipe",
            description: "Encouragez votre équipe à commencer les ventes."
          }
        };

      case 'admin':
        return {
          title: 'Gestion globale des ventes',
          subtitle: 'Vue d\'ensemble de toutes les ventes du système et configuration',
          quickActions: ['Nouvelle vente', 'Configuration', 'Rapports globaux', 'Audit'],
          personalizedMessage: getPersonalizedMessage(role, storeCount),
          emptyState: {
            title: "Aucune vente dans le système",
            description: "Le système est prêt pour les premières ventes."
          }
        };

      default:
        return {
          title: 'Gestion des ventes',
          subtitle: 'Accédez à vos ventes',
          quickActions: ['Nouvelle vente'],
          personalizedMessage: getPersonalizedMessage('seller'),
          emptyState: {
            title: "Aucune vente",
            description: "Commencez par enregistrer votre première vente."
          }
        };
    }
  }, [userContext]);

  // Fonction pour générer des messages personnalisés
  function getPersonalizedMessage(role: string, storeCount?: number) {
    const timeOfDay = new Date().getHours();
    let greeting = '';
    
    if (timeOfDay < 12) greeting = 'Bonjour';
    else if (timeOfDay < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';
    
    switch (role) {
      case 'seller':
        return `${greeting} ! Prêt(e) pour une journée de vente productive ?`;
      case 'manager':
        return `${greeting} ! Comment se porte votre équipe aujourd'hui ?`;
      case 'admin':
        return `${greeting} ! Vue d'ensemble de vos ${storeCount} magasin${storeCount && storeCount > 1 ? 's' : ''}`;
      default:
        return `${greeting} !`;
    }
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStore = selectedStore === 'all' || sale.store_id.toString() === selectedStore;
    const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus;
    
    return matchesSearch && matchesStore && matchesStatus;
  });


  // Statistiques adaptatives selon le rôle
  const adaptiveStats = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const completedSales = filteredSales.filter(sale => sale.status === 'completed').length;
    const averageCart = totalSales > 0 ? totalRevenue / totalSales : 0;

    const { role } = userContext;
    
    switch (role) {
      case 'seller':
        const today = new Date().toDateString();
        const todaySales = filteredSales.filter(sale => 
          new Date(sale.created_at).toDateString() === today
        );
        const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthSales = filteredSales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
        });

        return [
          { icon: ShoppingCart, value: todaySales.length, label: 'Ventes aujourd\'hui', color: 'text-blue-600' },
          { icon: DollarSign, value: formatPrice(todayRevenue), label: 'CA du jour', color: 'text-green-600' },
          { icon: TrendingUp, value: monthSales.length, label: 'Ventes du mois', color: 'text-purple-600' },
          { icon: Package, value: formatPrice(averageCart), label: 'Panier moyen', color: 'text-orange-600' }
        ];

      case 'manager':
        const activeSellers = new Set(filteredSales.map(sale => sale.seller_id)).size;
        const teamSales = filteredSales.length;
        const targetAchievement = 85; // À calculer selon les objectifs

        return [
          { icon: Users, value: activeSellers, label: 'Vendeurs actifs', color: 'text-blue-600' },
          { icon: DollarSign, value: formatPrice(totalRevenue), label: 'CA total', color: 'text-green-600' },
          { icon: TrendingUp, value: teamSales, label: 'Ventes équipe', color: 'text-purple-600' },
          { icon: Target, value: `${targetAchievement}%`, label: 'Objectif atteint', color: 'text-orange-600' }
        ];

      case 'admin':
        const activeStores = new Set(filteredSales.map(sale => sale.store_id)).size;
        const totalSellers = new Set(filteredSales.map(sale => sale.seller_id)).size;
        const growth = 12.5; // À calculer selon les données historiques

        return [
          { icon: Store, value: activeStores, label: 'Magasins actifs', color: 'text-blue-600' },
          { icon: DollarSign, value: formatPrice(totalRevenue), label: 'CA global', color: 'text-green-600' },
          { icon: Users, value: totalSellers, label: 'Vendeurs total', color: 'text-purple-600' },
          { icon: TrendingUp, value: `${growth}%`, label: 'Croissance', color: 'text-orange-600' }
        ];

      default:
        return [
          { icon: ShoppingCart, value: totalSales, label: 'Total ventes', color: 'text-blue-600' },
          { icon: DollarSign, value: formatPrice(totalRevenue), label: 'Chiffre d\'affaires', color: 'text-green-600' },
          { icon: TrendingUp, value: completedSales, label: 'Ventes terminées', color: 'text-purple-600' },
          { icon: Package, value: formatPrice(averageCart), label: 'Panier moyen', color: 'text-orange-600' }
        ];
    }
  }, [filteredSales, userContext]);

  // Filtrer les magasins selon les permissions
  const availableStores = stores.filter(store => {
    if (userContext.isAdmin) return true;
    return userContext.storeIds.includes(store.id);
  });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Erreur de chargement"
          message="Impossible de charger les ventes"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2">Chargement des ventes...</span>
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
              {roleContent.personalizedMessage}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
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
        <div className="flex flex-wrap gap-3">
          {roleContent.quickActions.map((action) => {
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

            const Icon = getActionIcon(action);
            return (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => {
                  if (action === 'Nouvelle vente') {
                    setIsSaleModalOpen(true);
                  } else {
                    console.log(`Action: ${action}`);
                  }
                }}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {action}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Statistiques adaptatives */}
      <StatsGrid stats={adaptiveStats} />

      {/* Filtres adaptatifs */}
      <SearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={
          userContext.isSeller 
            ? "Rechercher dans vos ventes..." 
            : "Rechercher par numéro, client, vendeur..."
        }
        filters={
          <div className="flex flex-wrap gap-4">
            <FilterSelect
              value={selectedStore}
              onChange={setSelectedStore}
              options={[
                { value: 'all', label: userContext.isAdmin ? 'Tous les magasins' : 'Mon magasin' },
                ...availableStores.map(store => ({
                  value: store.id.toString(),
                  label: store.name
                }))
              ]}
              placeholder="Magasin"
            />
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
            {userContext.isManager && (
              <FilterSelect
                value="all"
                onChange={() => {}}
                options={[
                  { value: 'all', label: 'Tous les vendeurs' },
                  { value: 'team', label: 'Mon équipe' }
                ]}
                placeholder="Vendeur"
              />
            )}
          </div>
        }
      />

      {/* Liste des ventes */}
      <div className="grid grid-cols-1 gap-4">
        {filteredSales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{sale.sale_number}</h3>
                    <StatusBadge type="sale" value={sale.status} />
                    {sale.payment_method && (
                      <Badge variant="outline">
                        {getPaymentMethodLabel(sale.payment_method)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      Magasin: {stores.find(s => s.id === sale.store_id)?.name}
                    </span>
                    {userContext.isAdmin && (
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
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 mb-2">
                    {formatPrice(sale.total)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {sale.discount_amount > 0 && (
                      <div>Remise: -{formatPrice(sale.discount_amount)}</div>
                    )}
                    <div>HT: {formatPrice(sale.total - (sale.tax_amount || 0))}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* État vide adaptatif */}
      {filteredSales.length === 0 && (
        <EmptyState
          icon={ShoppingCart}
          title={
            searchTerm 
              ? "Aucune vente trouvée"
              : roleContent.emptyState.title
          }
          description={
            searchTerm 
              ? 'Aucune vente ne correspond à votre recherche.'
              : roleContent.emptyState.description
          }
          actionLabel="Nouvelle vente"
          onAction={() => setIsSaleModalOpen(true)}
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
