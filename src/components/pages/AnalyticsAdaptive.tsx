import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users,
  Calendar,
  Download,
  RefreshCw,
  Store,
  Target,
  Award,
  AlertTriangle,
  Eye,
  Settings,
  UserCheck,
  Building2,
  ChartLine
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalyticsOptimized } from '@/hooks/useAnalyticsOptimized';
import { useStores } from '@/hooks/useStores';
import { toast } from '@/hooks/use-toast';

export const AnalyticsAdaptive = () => {
  const {
    analyticsData,
    isLoading,
    error,
    selectedPeriod,
    setSelectedPeriod,
    selectedStore,
    setSelectedStore,
    isExporting,
    context,
    messages,
    canViewAnalytics,
    canViewAllStores,
    canViewUserMetrics,
    canExportData,
    canViewGrowthMetrics,
    exportAnalytics,
    refreshData,
    formatCurrency,
    formatPercentage
  } = useAnalyticsOptimized();

  const { stores } = useStores();
  const [activeTab, setActiveTab] = useState('overview');

  // Actions rapides adaptatives selon les rôles
  const getQuickActions = () => {
    const actions = [
      {
        label: 'Actualiser',
        icon: RefreshCw,
        action: refreshData,
        color: 'bg-blue-600 hover:bg-blue-700',
        roles: ['admin', 'manager', 'seller']
      }
    ];

    if (canExportData) {
      actions.push({
        label: 'Exporter',
        icon: Download,
        action: exportAnalytics,
        color: 'bg-green-600 hover:bg-green-700',
        roles: ['admin', 'manager']
      });
    }

    if (context.isAdmin) {
      actions.push({
        label: 'Configuration',
        icon: Settings,
        action: () => toast({ title: 'Configuration', description: 'Accès à la configuration analytics' }),
        color: 'bg-purple-600 hover:bg-purple-700',
        roles: ['admin']
      });
    }

    return actions.filter(action => action.roles.includes(context.role));
  };

  // Métriques adaptatives selon les rôles
  const getAdaptiveMetrics = () => {
    if (!analyticsData) return [];

    const baseMetrics = [
      {
        title: 'Chiffre d\'Affaires',
        value: formatCurrency(analyticsData.revenue.current),
        icon: DollarSign,
        color: 'from-blue-500 to-blue-600',
        growth: canViewGrowthMetrics ? analyticsData.revenue.growthPercentage : null,
        description: context.isAdmin ? 'CA total du système' : 
                    context.isManager ? 'CA de vos magasins' : 
                    'Votre CA personnel'
      },
      {
        title: 'Ventes Terminées',
        value: analyticsData.orders.completed.toString(),
        icon: TrendingUp,
        color: 'from-green-500 to-green-600',
        growth: canViewGrowthMetrics ? analyticsData.orders.growth : null,
        description: context.isAdmin ? 'Ventes complétées système' : 
                    context.isManager ? 'Ventes de vos magasins' : 
                    'Vos ventes complétées'
      }
    ];

    if (context.isAdmin || context.isManager) {
      baseMetrics.push({
        title: 'Total Commandes',
        value: analyticsData.orders.current.toString(),
        icon: Package,
        color: 'from-purple-500 to-purple-600',
        growth: canViewGrowthMetrics ? analyticsData.orders.growth : null,
        description: context.isAdmin ? 'Commandes totales système' : 
                    'Commandes de vos magasins'
      });
    }

    baseMetrics.push({
      title: 'Panier Moyen',
      value: formatCurrency(analyticsData.averageOrderValue),
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      growth: null,
      description: context.isAdmin ? 'Panier moyen système' : 
                  context.isManager ? 'Panier moyen magasins' : 
                  'Votre panier moyen'
    });

    if (canViewGrowthMetrics) {
      baseMetrics.push({
        title: 'Taux de Conversion',
        value: `${analyticsData.conversionRate.toFixed(1)}%`,
        icon: Target,
        color: 'from-indigo-500 to-indigo-600',
        growth: null,
        description: 'Taux de conversion des ventes'
      });
    }

    return baseMetrics;
  };

  // Gestion des erreurs
  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Erreur de chargement</h3>
                <p className="text-red-700 mt-1">
                  {error.message || 'Impossible de charger les données analytiques'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // État de chargement
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{messages.title}</h2>
            <p className="text-gray-600">{messages.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Chargement...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const quickActions = getQuickActions();
  const adaptiveMetrics = getAdaptiveMetrics();

  return (
    <div className="p-6 space-y-6">
      {/* En-tête adaptatif */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{messages.title}</h2>
          <p className="text-gray-600">{messages.description}</p>
          <p className="text-sm text-gray-500 mt-1">{messages.subtitle}</p>
        </div>
        
        {/* Actions rapides adaptatives */}
        <div className="flex items-center gap-3">
          {/* Filtres adaptatifs */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 derniers jours</SelectItem>
              <SelectItem value="30days">30 derniers jours</SelectItem>
              <SelectItem value="90days">3 derniers mois</SelectItem>
              <SelectItem value="12months">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>

          {canViewAllStores && stores.length > 0 && (
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les magasins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les magasins</SelectItem>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Actions rapides */}
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant={action.label === 'Actualiser' ? 'outline' : 'default'}
              onClick={action.action}
              disabled={action.label === 'Exporter' && isExporting}
              className={action.color}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Métriques adaptatives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adaptiveMetrics.map((metric, index) => (
          <Card key={index} className={`bg-gradient-to-r ${metric.color} text-white`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white/80 text-sm">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  {metric.growth !== null && (
                    <div className="flex items-center gap-1 mt-1">
                      {metric.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-200" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-200" />
                      )}
                      <span className="text-xs text-white/80">
                        {formatPercentage(metric.growth)}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-white/70 mt-1">{metric.description}</p>
                </div>
                <metric.icon className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onglets adaptatifs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          {canViewAllStores && (
            <TabsTrigger value="stores" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Par magasin
            </TabsTrigger>
          )}
          {canViewUserMetrics && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Par utilisateur
            </TabsTrigger>
          )}
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Produits populaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Produits les plus vendus
              </CardTitle>
              <CardDescription>
                {context.isAdmin ? 'Performance des produits système' :
                 context.isManager ? 'Performance des produits de vos magasins' :
                 'Vos produits les plus vendus'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.topProducts?.length > 0 ? (
                  analyticsData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>{product.quantity} vendus</span>
                          <span>•</span>
                          <span>{formatCurrency(product.revenue)}</span>
                        </div>
                      </div>
                      {canViewGrowthMetrics && (
                        <div className="text-right">
                          <span className="text-sm text-gray-500">Croissance</span>
                          <div className="text-sm font-medium">
                            {formatPercentage(product.growth || 0)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>{messages.noDataMessage}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Graphique de performance */}
          {canViewGrowthMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartLine className="h-5 w-5 text-green-600" />
                  Évolution des performances
                </CardTitle>
                <CardDescription>
                  Comparaison avec la période précédente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Chiffre d'affaires</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatCurrency(analyticsData?.revenue.current || 0)}</span>
                      <Badge variant={analyticsData?.revenue.growthPercentage >= 0 ? 'default' : 'destructive'}>
                        {formatPercentage(analyticsData?.revenue.growthPercentage || 0)}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(100, Math.max(0, analyticsData?.revenue.growthPercentage || 0))} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Commandes</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{analyticsData?.orders.current || 0}</span>
                      <Badge variant={analyticsData?.orders.growth >= 0 ? 'default' : 'destructive'}>
                        {formatPercentage(analyticsData?.orders.growth || 0)}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(100, Math.max(0, analyticsData?.orders.growth || 0))} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Vue par magasin */}
        {canViewAllStores && (
          <TabsContent value="stores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  Performance par magasin
                </CardTitle>
                <CardDescription>
                  Analyse détaillée des performances par magasin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.storeMetrics?.length > 0 ? (
                    analyticsData.storeMetrics.map((store, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{store.storeName}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>{store.orders} commandes</span>
                            <span>•</span>
                            <span>{formatCurrency(store.revenue)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(store.revenue / store.orders || 0)}
                          </div>
                          <div className="text-xs text-gray-500">Panier moyen</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucune donnée de magasin disponible</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Vue par utilisateur */}
        {canViewUserMetrics && (
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-indigo-600" />
                  Performance par utilisateur
                </CardTitle>
                <CardDescription>
                  Analyse des performances de l'équipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.userMetrics?.length > 0 ? (
                    analyticsData.userMetrics.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{user.userName}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>{user.orders} commandes</span>
                            <span>•</span>
                            <span>{formatCurrency(user.revenue)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(user.performance)}
                          </div>
                          <div className="text-xs text-gray-500">Performance</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucune donnée utilisateur disponible</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Note informative adaptative */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Données en temps réel</h4>
              <p className="text-sm text-blue-700 mt-1">
                {context.isAdmin ? 'Les données présentées sont basées sur toutes les ventes du système.' :
                 context.isManager ? 'Les données présentées sont basées sur les ventes de vos magasins assignés.' :
                 'Les données présentées sont basées sur vos ventes personnelles.'}
                Les métriques sont calculées pour la période sélectionnée.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 