
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  Package,
  Download,
  Calendar,
  Building2,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';

interface ProductReport {
  name: string;
  sales: number;
  revenue: number;
}

interface SellerReport {
  name: string;
  sales: number;
  revenue: number;
}

interface OverviewReport {
  revenue: number;
  transactions: number;
  completedSales: number;
  averageOrderValue: number;
}

interface ProductsReport {
  topProducts: ProductReport[];
}

interface SellersReport {
  sellers: SellerReport[];
}

type ReportData = OverviewReport | ProductsReport | SellersReport;

// Messages adaptatifs selon les rôles
const getRoleBasedMessages = (role: string) => {
  const messages = {
    admin: {
      title: 'Rapports Globaux',
      description: 'Vue d\'ensemble complète du système',
      subtitle: 'Analyse des performances globales et par magasin',
      noDataMessage: 'Aucune donnée disponible pour cette période',
      exportMessage: 'Export des rapports globaux en cours...',
      refreshMessage: 'Actualisation des rapports globaux...',
      noAccessMessage: 'Accès non autorisé aux rapports'
    },
    manager: {
      title: 'Rapports Magasin',
      description: 'Rapports de vos magasins assignés',
      subtitle: 'Analyse des performances par magasin et équipe',
      noDataMessage: 'Aucune donnée disponible pour vos magasins',
      exportMessage: 'Export des rapports magasin en cours...',
      refreshMessage: 'Actualisation des rapports magasin...',
      noAccessMessage: 'Accès non autorisé aux rapports'
    },
    seller: {
      title: 'Mes Rapports',
      description: 'Vos rapports personnels',
      subtitle: 'Analyse de vos performances individuelles',
      noDataMessage: 'Aucune donnée personnelle disponible',
      exportMessage: 'Export de vos rapports en cours...',
      refreshMessage: 'Actualisation de vos rapports...',
      noAccessMessage: 'Accès non autorisé aux rapports'
    }
  };

  return messages[role as keyof typeof messages] || messages.seller;
};

// Types de rapports adaptatifs selon les rôles
const getRoleBasedReportTypes = (role: string) => {
  const baseTypes = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3, roles: ['admin', 'manager', 'seller'] },
    { id: 'products', label: 'Performances produits', icon: Package, roles: ['admin', 'manager'] },
    { id: 'sellers', label: 'Performance vendeurs', icon: Users, roles: ['admin', 'manager'] },
  ];

  if (role === 'admin') {
    baseTypes.push(
      { id: 'stores', label: 'Performance magasins', icon: Building2, roles: ['admin'] },
      { id: 'growth', label: 'Croissance & tendances', icon: TrendingUp, roles: ['admin'] }
    );
  }

  if (role === 'manager') {
    baseTypes.push(
      { id: 'team', label: 'Performance équipe', icon: Users, roles: ['manager'] },
      { id: 'growth', label: 'Croissance magasin', icon: TrendingUp, roles: ['manager'] }
    );
  }

  if (role === 'seller') {
    baseTypes.push(
      { id: 'personal', label: 'Mes performances', icon: TrendingUp, roles: ['seller'] },
      { id: 'goals', label: 'Mes objectifs', icon: TrendingUp, roles: ['seller'] }
    );
  }

  return baseTypes.filter(type => type.roles.includes(role));
};

// Composant d'accès refusé
const AccessDenied = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <div className="text-center space-y-4">
      <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
      <h3 className="text-xl font-semibold text-gray-900">Accès refusé</h3>
      <p className="text-gray-600 max-w-md">{message}</p>
    </div>
  </div>
);

// Composant pour les métriques avec croissance
const MetricCard = ({ 
  title, 
  value, 
  previousValue, 
  formatValue, 
  icon: Icon, 
  color = "blue",
  showGrowth = true 
}: {
  title: string;
  value: number;
  previousValue?: number;
  formatValue: (value: number) => string;
  icon: any;
  color?: string;
  showGrowth?: boolean;
}) => {
  const getGrowthIcon = (current: number, previous: number) => {
    if (previous === 0) return <Minus className="h-4 w-4" />;
    if (current > previous) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (current < previous) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getGrowthText = (current: number, previous: number) => {
    if (previous === 0) return 'N/A';
    const growth = ((current - previous) / previous) * 100;
    return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
  };

  const getGrowthColor = (current: number, previous: number) => {
    if (previous === 0) return 'text-gray-500';
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
            {showGrowth && previousValue !== undefined && (
              <div className="flex items-center gap-1 mt-1 justify-center">
                {getGrowthIcon(value, previousValue)}
                <span className={`text-sm font-medium ${getGrowthColor(value, previousValue)}`}>
                  {getGrowthText(value, previousValue)}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const Reports = ({ user }) => {
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller, canViewReports } = useUserRoles();
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Messages adaptatifs
  const messages = useMemo(() => getRoleBasedMessages(profile?.role || 'seller'), [profile?.role]);

  // Types de rapports adaptatifs
  const reportTypes = useMemo(() => getRoleBasedReportTypes(profile?.role || 'seller'), [profile?.role]);

  // Permissions adaptatives
  const canExportData = isAdmin || isManager;
  const canViewAllStores = isAdmin;
  const canViewUserMetrics = isAdmin || isManager;

  useEffect(() => {
    if (user && canViewReports) {
      loadReportData();
    }
  }, [selectedPeriod, selectedReport, user, canViewReports]);

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Calculer la période
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '1month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Charger les données selon le type de rapport
      let salesQuery = supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            products (name, category_id)
          ),
          profiles!sales_seller_id_fkey (name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Filtrage adaptatif selon les permissions
      if (!canViewAllStores && profile?.store_ids?.length > 0) {
        salesQuery = salesQuery.in('store_id', profile.store_ids);
      }

      // Filtrage par utilisateur pour les sellers
      if (isSeller) {
        salesQuery = salesQuery.eq('seller_id', profile?.id);
      }

      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Traiter les données selon le type de rapport
      const processedData = processReportData(salesData, selectedReport);
      setReportData(processedData);

    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      setError('Impossible de charger les données du rapport.');
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du rapport.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processReportData = (salesData: any[], reportType: string): ReportData => {
    const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
    const totalTransactions = salesData?.length || 0;
    const completedSales = salesData?.filter(sale => sale.status === 'completed') || [];

    switch (reportType) {
      case 'overview':
        return {
          revenue: totalRevenue,
          transactions: totalTransactions,
          completedSales: completedSales.length,
          averageOrderValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
        } as OverviewReport;

      case 'products':
        const productSales: { [key: string]: ProductReport } = {};
        salesData?.forEach(sale => {
          sale.sale_items?.forEach(item => {
            const productName = item.products?.name || 'Produit inconnu';
            if (!productSales[productName]) {
              productSales[productName] = {
                name: productName,
                sales: 0,
                revenue: 0
              };
            }
            productSales[productName].sales += item.quantity;
            productSales[productName].revenue += item.total_price || 0;
          });
        });
        return {
          topProducts: Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
        } as ProductsReport;

      case 'sellers':
        const sellerPerformance: { [key: string]: SellerReport } = {};
        salesData?.forEach(sale => {
          const sellerName = sale.profiles?.name || 'Vendeur inconnu';
          if (!sellerPerformance[sellerName]) {
            sellerPerformance[sellerName] = {
              name: sellerName,
              sales: 0,
              revenue: 0
            };
          }
          sellerPerformance[sellerName].sales += 1;
          sellerPerformance[sellerName].revenue += sale.total || 0;
        });
        return {
          sellers: Object.values(sellerPerformance)
            .sort((a, b) => b.revenue - a.revenue)
        } as SellersReport;

      default:
        return { revenue: totalRevenue, transactions: totalTransactions, completedSales: 0, averageOrderValue: 0 } as OverviewReport;
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

  const exportReport = async (format: string) => {
    if (!canExportData) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour exporter les rapports.",
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
        description: "Impossible d'exporter les rapports.",
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
    await loadReportData();
  };

  // Vérification des permissions
  if (!canViewReports) {
    return <AccessDenied message={messages.noAccessMessage} />;
  }

  // État de chargement
  if (isLoading) {
    return <LoadingSpinner message="Chargement des rapports..." />;
  }

  // État d'erreur
  if (error) {
    return <ErrorState 
      title="Erreur de chargement"
      description={error}
      onRetry={loadReportData}
    />;
  }

  // Données non disponibles
  if (!reportData) {
    return <EmptyState 
      title="Aucune donnée"
      description={messages.noDataMessage}
      icon={BarChart3}
    />;
  }

  const periods = [
    { id: '1month', label: 'Dernier mois' },
    { id: '3months', label: '3 derniers mois' },
    { id: '6months', label: '6 derniers mois' },
    { id: '1year', label: 'Dernière année' }
  ];

  const renderReport = () => {
    if (isLoading || !reportData) {
      return (
        <div className="text-center py-8">
          <div className="text-lg">Chargement du rapport...</div>
        </div>
      );
    }

    switch (selectedReport) {
      case 'overview':
        const overviewData = reportData as OverviewReport;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Chiffre d'affaires total"
                value={overviewData.revenue}
                formatValue={formatCurrency}
                icon={TrendingUp}
                color="blue"
                showGrowth={false}
              />
              <MetricCard
                title="Ventes terminées"
                value={overviewData.completedSales}
                formatValue={(value) => value.toString()}
                icon={BarChart3}
                color="green"
                showGrowth={false}
              />
              <MetricCard
                title="Total transactions"
                value={overviewData.transactions}
                formatValue={(value) => value.toString()}
                icon={Package}
                color="purple"
                showGrowth={false}
              />
              <MetricCard
                title="Panier moyen"
                value={overviewData.averageOrderValue}
                formatValue={formatCurrency}
                icon={Users}
                color="orange"
                showGrowth={false}
              />
            </div>
          </div>
        );

      case 'products':
        const productsData = reportData as ProductsReport;
        return (
          <Card>
            <CardHeader>
              <CardTitle>Top des produits les plus vendus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productsData.topProducts?.length > 0 ? (
                  productsData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.sales} unités vendues</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState 
                    title="Aucune donnée"
                    description="Aucune donnée de produit disponible"
                    icon={Package}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'sellers':
        const sellersData = reportData as SellersReport;
        return (
          <Card>
            <CardHeader>
              <CardTitle>Performance des vendeurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sellersData.sellers?.length > 0 ? (
                  sellersData.sellers.map((seller, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{seller.name}</p>
                          <p className="text-sm text-gray-600">{seller.sales} ventes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(seller.revenue)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState 
                    title="Aucune donnée"
                    description="Aucune donnée de vendeur disponible"
                    icon={Users}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <EmptyState 
            title="Rapport non disponible"
            description="Ce type de rapport n'est pas encore disponible"
            icon={BarChart3}
          />
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête adaptatif */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{messages.title}</h2>
          <p className="text-gray-600">{messages.description}</p>
          <p className="text-sm text-gray-500">{messages.subtitle}</p>
        </div>
        
        {/* Actions rapides adaptatives */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          {canExportData && (
            <>
              <Button 
                variant="outline" 
                onClick={() => exportReport('csv')}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => exportReport('pdf')}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filtres adaptatifs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Types de rapports adaptatifs */}
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type de rapport
              </label>
              <div className="flex flex-wrap gap-2">
                {reportTypes.map(type => (
                  <Button
                    key={type.id}
                    variant={selectedReport === type.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedReport(type.id)}
                    className="flex items-center gap-2"
                  >
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Période */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Période
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {periods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu du rapport */}
      {renderReport()}

      {/* Indicateur d'export */}
      {isExporting && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 animate-pulse" />
            <span>Export en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
};
