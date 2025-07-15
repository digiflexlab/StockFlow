
import { useState, useEffect, useMemo } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useStores } from '@/hooks/useStores';
import { toast } from '@/hooks/use-toast';

interface ProductSales {
  name: string;
  quantity: number;
  revenue: number;
}

interface AnalyticsData {
  revenue: {
    current: number;
    growth: number;
  };
  orders: {
    current: number;
    completed: number;
  };
  topProducts: ProductSales[];
  totalSales: number;
  averageOrderValue: number;
}

export const Analytics = ({ user }) => {
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller } = useUserRoles();
  const { stores } = useStores();
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedStore, setSelectedStore] = useState('all');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Messages adaptatifs selon les rôles
  const messages = useMemo(() => {
    const role = profile?.role || 'seller';
    const roleLabels = {
      admin: {
        title: 'Analytics Globaux',
        description: 'Vue d\'ensemble complète de vos performances système',
        subtitle: 'Analyse des performances globales et par magasin',
        noDataMessage: 'Aucune donnée de vente disponible pour cette période',
        exportMessage: 'Export des données globales en cours...',
        refreshMessage: 'Actualisation des métriques globales...'
      },
      manager: {
        title: 'Analytics Magasin',
        description: 'Performance de vos magasins assignés',
        subtitle: 'Analyse des performances par magasin et équipe',
        noDataMessage: 'Aucune donnée de vente disponible pour vos magasins',
        exportMessage: 'Export des données magasin en cours...',
        refreshMessage: 'Actualisation des métriques magasin...'
      },
      seller: {
        title: 'Mes Performances',
        description: 'Vos performances de vente personnelles',
        subtitle: 'Analyse de vos ventes et objectifs',
        noDataMessage: 'Aucune donnée de vente personnelle disponible',
        exportMessage: 'Export de vos données en cours...',
        refreshMessage: 'Actualisation de vos métriques...'
      }
    };
    return roleLabels[role as keyof typeof roleLabels] || roleLabels.seller;
  }, [profile?.role]);

  // Permissions adaptatives
  const canViewAnalytics = isAdmin || isManager || isSeller;
  const canViewAllStores = isAdmin;
  const canViewUserMetrics = isAdmin || isManager;
  const canExportData = isAdmin || isManager;
  const canViewGrowthMetrics = isAdmin || isManager;

  useEffect(() => {
    if (user && canViewAnalytics) {
      loadAnalyticsData();
    }
  }, [selectedPeriod, selectedStore, user, canViewAnalytics]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Calculer les dates selon la période sélectionnée
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '12months':
          startDate.setMonth(endDate.getMonth() - 12);
          break;
      }

      // Charger les données de ventes
      let salesQuery = supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            products (name, category_id)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Filtrage adaptatif selon les rôles
      if (!canViewAllStores) {
        salesQuery = salesQuery.in('store_id', profile?.store_ids || []);
      }

      if (selectedStore !== 'all') {
        salesQuery = salesQuery.eq('store_id', parseInt(selectedStore));
      }

      // Filtrage par utilisateur pour les sellers
      if (isSeller) {
        salesQuery = salesQuery.eq('seller_id', profile?.id);
      }

      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Calculer les métriques
      const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const totalOrders = salesData?.length || 0;
      const completedSales = salesData?.filter(sale => sale.status === 'completed') || [];
      
      // Calculer les produits populaires
      const productSales: { [key: string]: ProductSales } = {};
      salesData?.forEach(sale => {
        sale.sale_items?.forEach(item => {
          const productName = item.products?.name || 'Produit inconnu';
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += item.total_price || 0;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setAnalyticsData({
        revenue: {
          current: totalRevenue,
          growth: 0, // À calculer avec les données de la période précédente
        },
        orders: {
          current: totalOrders,
          completed: completedSales.length,
        },
        topProducts: topProducts,
        totalSales: completedSales.length,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      });

    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données analytiques.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0 XOF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const exportAnalytics = async () => {
    if (!canExportData) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour exporter les données.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Simulation d'export (à implémenter)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Export réussi",
        description: messages.exportMessage,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const refreshData = async () => {
    toast({
      title: "Actualisation",
      description: messages.refreshMessage,
    });
    await loadAnalyticsData();
  };

  // Gestion des erreurs d'accès
  if (!canViewAnalytics) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Accès non autorisé</h3>
                <p className="text-red-700 mt-1">
                  Vous n'avez pas les permissions pour accéder aux analytics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{messages.title}</h2>
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
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          
          {canExportData && (
            <Button onClick={exportAnalytics} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Export...' : 'Exporter'}
            </Button>
          )}
        </div>
      </div>

      {/* Métriques adaptatives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">
                  {isAdmin ? 'Chiffre d\'Affaires Système' : 
                   isManager ? 'Chiffre d\'Affaires Magasins' : 
                   'Votre Chiffre d\'Affaires'}
                </p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData?.revenue?.current || 0)}</p>
                <p className="text-xs text-blue-200 mt-1">
                  {isAdmin ? 'CA total du système' : 
                   isManager ? 'CA de vos magasins' : 
                   'Votre CA personnel'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">
                  {isAdmin ? 'Ventes Terminées Système' : 
                   isManager ? 'Ventes Terminées Magasins' : 
                   'Vos Ventes Terminées'}
                </p>
                <p className="text-2xl font-bold">{analyticsData?.orders?.completed || 0}</p>
                <p className="text-xs text-green-200 mt-1">
                  {isAdmin ? 'Ventes complétées système' : 
                   isManager ? 'Ventes de vos magasins' : 
                   'Vos ventes complétées'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">
                  {isAdmin ? 'Total Commandes Système' : 
                   isManager ? 'Total Commandes Magasins' : 
                   'Vos Commandes'}
                </p>
                <p className="text-2xl font-bold">{analyticsData?.orders?.current || 0}</p>
                <p className="text-xs text-purple-200 mt-1">
                  {isAdmin ? 'Commandes totales système' : 
                   isManager ? 'Commandes de vos magasins' : 
                   'Vos commandes totales'}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">
                  {isAdmin ? 'Panier Moyen Système' : 
                   isManager ? 'Panier Moyen Magasins' : 
                   'Votre Panier Moyen'}
                </p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData?.averageOrderValue || 0)}</p>
                <p className="text-xs text-orange-200 mt-1">
                  {isAdmin ? 'Panier moyen système' : 
                   isManager ? 'Panier moyen magasins' : 
                   'Votre panier moyen'}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
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
                {isAdmin ? 'Performance des produits système' :
                 isManager ? 'Performance des produits de vos magasins' :
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
                <div className="text-center py-8 text-gray-500">
                  <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Fonctionnalité en cours de développement</p>
                  <p className="text-sm mt-2">Métriques par magasin seront disponibles prochainement</p>
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
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Fonctionnalité en cours de développement</p>
                  <p className="text-sm mt-2">Métriques par utilisateur seront disponibles prochainement</p>
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
                {isAdmin ? 'Les données présentées sont basées sur toutes les ventes du système.' :
                 isManager ? 'Les données présentées sont basées sur les ventes de vos magasins assignés.' :
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
