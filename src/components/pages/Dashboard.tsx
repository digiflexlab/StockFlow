
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Users,
  Building2,
  ArrowUp,
  ArrowDown,
  DollarSign,
  BarChart3,
  Settings,
  Globe
} from 'lucide-react';
import { StockAlerts } from '@/components/alerts/StockAlerts';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const Dashboard = ({ user, onPageChange }) => {
  const { products } = useProducts();
  const { stores } = useStores();
  const { 
    canCreateProducts, 
    canManageInventory, 
    canViewReports, 
    canViewFinance,
    isAdmin,
    isManager,
    isSeller
  } = usePermissions();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Actions rapides adaptatives selon le rôle et permissions
  const getQuickActions = () => {
    const actions = [
      {
        label: 'Nouvelle vente',
        icon: ShoppingCart,
        action: () => onPageChange('sales'),
        color: 'bg-green-600 hover:bg-green-700',
        roles: ['admin', 'manager', 'seller']
      }
    ];

    // Ajouter "Ajouter produit" si l'utilisateur a les permissions
    if (canCreateProducts) {
      actions.push({
        label: 'Ajouter produit',
        icon: Package,
        action: () => onPageChange('products'),
        color: 'bg-blue-600 hover:bg-blue-700',
        roles: ['admin', 'manager']
      });
    }

    // Ajouter "Inventaire" si l'utilisateur a les permissions
    if (canManageInventory) {
      actions.push({
        label: 'Inventaire',
        icon: Package,
        action: () => onPageChange('inventory'),
        color: 'bg-purple-600 hover:bg-purple-700',
        roles: ['admin', 'manager']
      });
    }

    // Ajouter "Analytics" pour admin et manager
    if (canViewReports) {
      actions.push({
        label: 'Analytics',
        icon: BarChart3,
        action: () => onPageChange('analytics'),
        color: 'bg-indigo-600 hover:bg-indigo-700',
        roles: ['admin', 'manager']
      });
    }

    // Ajouter "Configuration" pour admin uniquement
    if (isAdmin) {
      actions.push({
        label: 'Configuration',
        icon: Settings,
        action: () => onPageChange('admin-config'),
        color: 'bg-gray-600 hover:bg-gray-700',
        roles: ['admin']
      });
    }

    // Filtrer les actions selon le rôle de l'utilisateur
    return actions.filter(action => action.roles.includes(user?.role));
  };

  // Construire les requêtes avec filtrage selon le rôle
  const buildFilteredQueries = (today) => {
    let salesQuery = supabase
          .from('sales')
          .select('*, sale_items(*)')
          .gte('created_at', today)
          .eq('status', 'completed');

    let allSalesQuery = supabase
          .from('sales')
          .select('*')
          .eq('status', 'completed');

    let stockQuery = supabase
          .from('stock')
          .select(`
            *,
            products!inner(id, name),
            stores!inner(name)
          `)
          .order('quantity');

    // Filtrer selon le rôle et les magasins assignés
    if (user?.role === 'seller' && user.store_ids?.length > 0) {
      salesQuery = salesQuery.in('store_id', user.store_ids);
      allSalesQuery = allSalesQuery.in('store_id', user.store_ids);
      stockQuery = stockQuery.in('store_id', user.store_ids);
    } else if (user?.role === 'manager' && user.store_ids?.length > 0) {
      salesQuery = salesQuery.in('store_id', user.store_ids);
      allSalesQuery = allSalesQuery.in('store_id', user.store_ids);
      stockQuery = stockQuery.in('store_id', user.store_ids);
    }
    // Admin voit tout (pas de filtre)

    return { salesQuery, allSalesQuery, stockQuery };
  };

  // Calculer le taux de croissance des ventes
  const calculateSalesGrowth = async (today, dailySalesTotal) => {
    try {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let yesterdayQuery = supabase
        .from('sales')
        .select('total')
        .gte('created_at', yesterdayStr)
        .lt('created_at', today)
        .eq('status', 'completed');

      // Appliquer le même filtrage selon le rôle
      if (user?.role === 'seller' && user.store_ids?.length > 0) {
        yesterdayQuery = yesterdayQuery.in('store_id', user.store_ids);
      } else if (user?.role === 'manager' && user.store_ids?.length > 0) {
        yesterdayQuery = yesterdayQuery.in('store_id', user.store_ids);
      }

      const { data: yesterdaySales } = await yesterdayQuery;
      const yesterdayTotal = yesterdaySales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

      if (yesterdayTotal === 0) return 0;
      return Math.round(((dailySalesTotal - yesterdayTotal) / yesterdayTotal) * 100);
    } catch (error) {
      console.error('Erreur lors du calcul de la croissance:', error);
      return 0;
    }
  };

  // Calculer les utilisateurs actifs
  const getActiveUsers = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (user?.role === 'admin') {
        // Pour l'admin, compter les utilisateurs créés aujourd'hui (à défaut de last_sign_in_at)
        const { data: activeUsers } = await supabase
          .from('profiles')
          .select('id')
          .gte('created_at', today);
        return activeUsers?.length || 1; // Au moins l'admin lui-même
      } else {
        // Pour les autres rôles, retourner 1 (eux-mêmes)
        return 1;
      }
    } catch (error) {
      console.error('Erreur lors du calcul des utilisateurs actifs:', error);
      return 1; // Valeur par défaut
    }
  };

  // Filtrer les magasins selon les permissions
  const getFilteredStores = () => {
    if (user?.role === 'admin') {
      return stores;
    } else if (user?.store_ids?.length > 0) {
      return stores.filter(store => user.store_ids.includes(store.id));
    }
    return [];
  };

  // Filtrer les produits selon les permissions
  const getFilteredProducts = () => {
    if (user?.role === 'admin') {
      return products;
    } else if (user?.store_ids?.length > 0) {
      // Pour les managers et sellers, on retourne tous les produits
      // mais les alertes de stock seront filtrées par magasin
      return products;
    }
    return [];
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { salesQuery, allSalesQuery, stockQuery } = buildFilteredQueries(today);
        
        // Exécuter les requêtes en parallèle
        const [dailySalesResult, allSalesResult, stockResult] = await Promise.all([
          salesQuery,
          allSalesQuery,
          stockQuery
        ]);

        const dailySales = dailySalesResult.data || [];
        const allSales = allSalesResult.data || [];
        const stockData = stockResult.data || [];

        // Calculer les métriques contextualisées
        const dailySalesTotal = dailySales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const totalSales = allSales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const lowStockProducts = stockData.filter(stock => stock.quantity <= 5);

        // Calculer le taux de croissance des ventes
        const salesGrowth = await calculateSalesGrowth(today, dailySalesTotal);

        // Calculer les utilisateurs actifs
        const activeUsers = await getActiveUsers();

        // Ventes récentes (limité aux 3 dernières)
        const recentSales = dailySales.slice(-3).map(sale => ({
          id: sale.sale_number,
          amount: Number(sale.total),
          customer: sale.customer_name || 'Client anonyme',
          time: new Date(sale.created_at).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }));

        // Calculer le nombre de magasins accessibles
        const accessibleStores = getFilteredStores();
        const accessibleProducts = getFilteredProducts();

        const data = {
          totalSales: totalSales,
          dailySales: dailySalesTotal,
          totalProducts: accessibleProducts.length,
          lowStockProducts: lowStockProducts.length,
          totalStores: accessibleStores.length,
          activeUsers: activeUsers,
          salesGrowth: salesGrowth,
          recentSales: recentSales,
          products: accessibleProducts,
          stores: accessibleStores.map(store => ({ id: store.id.toString(), name: store.name })),
          stockData: stockData,
          userRole: user?.role,
          userStoreIds: user?.store_ids || []
        };
        
        setDashboardData(data);
      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données du tableau de bord. Veuillez réessayer.",
          variant: "destructive",
        });
        
        // Données par défaut en cas d'erreur
        const accessibleStores = getFilteredStores();
        const accessibleProducts = getFilteredProducts();
        
        setDashboardData({
          totalSales: 0,
          dailySales: 0,
          totalProducts: accessibleProducts.length,
          lowStockProducts: 0,
          totalStores: accessibleStores.length,
          activeUsers: 1,
          salesGrowth: 0,
          recentSales: [],
          products: accessibleProducts,
          stores: accessibleStores.map(store => ({ id: store.id.toString(), name: store.name })),
          stockData: [],
          userRole: user?.role,
          userStoreIds: user?.store_ids || [],
          error: true // Flag pour afficher un état d'erreur
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (products.length >= 0 && stores.length >= 0) {
      loadDashboardData();
    }
  }, [products, stores, user]);

  const quickActions = getQuickActions();

  // Obtenir le message de salutation selon le rôle
  const getGreetingMessage = () => {
    const roleLabels = {
      admin: 'Administrateur',
      manager: 'Gérant',
      seller: 'Vendeur'
    };
    
    return `Bonjour ${user?.name ? user.name.split(' ')[0] : ''} ! 👋 (${roleLabels[user?.role]})`;
  };

  // Obtenir la description selon le rôle
  const getDescription = () => {
    if (user?.role === 'admin') {
      return "Vue d'ensemble complète de votre système";
    } else if (user?.role === 'manager') {
      return `Aperçu de vos ${dashboardData?.totalStores || 0} magasin(s) assigné(s)`;
    } else {
      return "Aperçu de votre activité aujourd'hui";
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Afficher un état d'erreur si nécessaire
  if (dashboardData.error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getGreetingMessage()}
            </h2>
            <p className="text-gray-600">{getDescription()}</p>
          </div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Erreur de chargement</h3>
            <p className="text-red-600 mb-4">Impossible de charger les données du tableau de bord</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête personnalisé selon le rôle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {getGreetingMessage()}
          </h2>
          <p className="text-gray-600">{getDescription()}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white h-12 min-h-12`}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Alertes de stock contextualisées */}
      <StockAlerts 
        products={dashboardData.products} 
        stores={dashboardData.stores}
        userRole={dashboardData.userRole}
        userStoreIds={dashboardData.userStoreIds}
      />

      {/* Métriques principales adaptatives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Ventes du jour</p>
                <p className="text-2xl font-bold">{dashboardData.dailySales.toLocaleString()} XOF</p>
                <div className="flex items-center mt-2">
                  {dashboardData.salesGrowth >= 0 ? (
                  <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm">
                    {Math.abs(dashboardData.salesGrowth)}% vs hier
                  </span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total des ventes</p>
                <p className="text-2xl font-bold">{dashboardData.totalSales.toLocaleString()} XOF</p>
                <div className="flex items-center mt-2">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {user?.role === 'admin' ? 'Toutes périodes' : 'Vos magasins'}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">
                  {user?.role === 'admin' ? 'Total produits' : 'Produits accessibles'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">
                  {user?.role === 'admin' ? 'Stock faible' : 'Alertes stock'}
                </p>
                <p className="text-2xl font-bold text-orange-600">{dashboardData.lowStockProducts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal adaptatif */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventes récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Ventes récentes
              {user?.role !== 'admin' && (
                <span className="text-sm text-gray-500">
                  ({dashboardData.stores.length} magasin{dashboardData.stores.length > 1 ? 's' : ''})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {user?.role === 'admin' ? 'Dernières transactions' : 'Vos dernières transactions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentSales.length > 0 ? (
                dashboardData.recentSales.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{sale.id}</p>
                      <p className="text-sm text-gray-600">{sale.customer} • {sale.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{sale.amount.toLocaleString()} XOF</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune vente aujourd'hui</p>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => onPageChange('sales')}
              >
                Voir toutes les ventes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Produits avec stock faible - adaptatif selon le rôle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Alertes de stock
              {user?.role !== 'admin' && (
                <span className="text-sm text-gray-500">
                  ({dashboardData.stores.length} magasin{dashboardData.stores.length > 1 ? 's' : ''})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {user?.role === 'admin' 
                ? 'Produits nécessitant un réapprovisionnement' 
                : 'Produits nécessitant un réapprovisionnement dans vos magasins'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.stockData
                .filter(stock => stock.quantity <= 5)
                .slice(0, 5)
                .map((stock, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{stock.products?.name}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        stock.quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {stock.quantity === 0 ? 'Rupture' : 'Stock faible'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Stock: {stock.quantity}</span>
                      <span>•</span>
                      <span>Min: {stock.min_threshold}</span>
                      <span>•</span>
                      <span>{stock.stores?.name}</span>
                    </div>
                    <Progress 
                      value={Math.min((stock.quantity / stock.min_threshold) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                ))}
              {dashboardData.stockData.filter(stock => stock.quantity <= 5).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tous les produits ont un stock suffisant</p>
                </div>
              )}
              {canManageInventory && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => onPageChange('inventory')}
              >
                Faire un inventaire
              </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
