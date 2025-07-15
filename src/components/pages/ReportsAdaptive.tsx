import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  Package,
  Download,
  Calendar,
  Building2,
  Target,
  Flag,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { useReportsOptimized } from '@/hooks/useReportsOptimized';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';

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
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
            {showGrowth && previousValue !== undefined && (
              <div className="flex items-center gap-1 mt-1">
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

// Composant pour les listes de performance
const PerformanceList = ({ 
  items, 
  title, 
  formatValue, 
  getIcon, 
  getSubtitle 
}: {
  items: any[];
  title: string;
  formatValue: (item: any) => string;
  getIcon: (index: number) => any;
  getSubtitle: (item: any) => string;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {items?.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {getIcon(index + 1)}
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">{getSubtitle(item)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatValue(item)}</p>
              </div>
            </div>
          ))
        ) : (
          <EmptyState 
            title="Aucune donnée"
            description="Aucune donnée disponible pour cette période"
            icon={BarChart3}
          />
        )}
      </div>
    </CardContent>
  </Card>
);

// Composant pour les métriques personnelles (sellers)
const PersonalMetrics = ({ userMetrics, formatCurrency }: { 
  userMetrics: any; 
  formatCurrency: (value: number) => string;
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
        title="Mes ventes"
        value={userMetrics.personalSales}
        formatValue={(value) => value.toString()}
        icon={ShoppingCart}
        color="green"
        showGrowth={false}
      />
      <MetricCard
        title="Mon chiffre d'affaires"
        value={userMetrics.personalRevenue}
        formatValue={formatCurrency}
        icon={TrendingUp}
        color="blue"
        showGrowth={false}
      />
      <MetricCard
        title="Performance"
        value={userMetrics.performance}
        formatValue={(value) => `${value.toFixed(1)}%`}
        icon={Target}
        color="purple"
        showGrowth={false}
      />
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle>Objectifs</CardTitle>
        <CardDescription>Vos objectifs de vente</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Objectif mensuel</span>
            <span className="font-semibold">{formatCurrency(userMetrics.target)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(userMetrics.performance, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Progression</span>
            <span>{userMetrics.performance.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Composant principal adaptatif
export const ReportsAdaptive = () => {
  const {
    reportsData,
    isLoading,
    error,
    selectedPeriod,
    setSelectedPeriod,
    selectedReport,
    setSelectedReport,
    selectedStore,
    setSelectedStore,
    isExporting,
    context,
    messages,
    reportTypes,
    periods,
    canViewReports,
    canViewAllStores,
    canViewUserMetrics,
    canExportData,
    canViewGrowthMetrics,
    canViewStoreMetrics,
    canViewPersonalMetrics,
    exportReport,
    refreshData,
    formatCurrency,
    formatPercentage
  } = useReportsOptimized();

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
      description="Impossible de charger les rapports. Veuillez réessayer."
      onRetry={refreshData}
    />;
  }

  // Données non disponibles
  if (!reportsData) {
    return <EmptyState 
      title="Aucune donnée"
      description={messages.noDataMessage}
      icon={BarChart3}
    />;
  }

  // Rendu du rapport selon le type sélectionné
  const renderReport = () => {
    switch (selectedReport) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Chiffre d'affaires"
                value={reportsData.overview.revenue.total}
                previousValue={reportsData.overview.revenue.previous}
                formatValue={formatCurrency}
                icon={TrendingUp}
                color="blue"
              />
              <MetricCard
                title="Transactions"
                value={reportsData.overview.transactions.total}
                previousValue={reportsData.overview.transactions.total - reportsData.overview.transactions.growth}
                formatValue={(value) => value.toString()}
                icon={ShoppingCart}
                color="green"
              />
              <MetricCard
                title="Ventes terminées"
                value={reportsData.overview.transactions.completed}
                formatValue={(value) => value.toString()}
                icon={CheckCircle}
                color="purple"
                showGrowth={false}
              />
              <MetricCard
                title="Panier moyen"
                value={reportsData.overview.averageOrderValue.current}
                previousValue={reportsData.overview.averageOrderValue.previous}
                formatValue={formatCurrency}
                icon={Package}
                color="orange"
              />
            </div>

            {/* Top produits et vendeurs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceList
                items={reportsData.overview.topProducts.slice(0, 5)}
                title="Top produits"
                formatValue={(item) => formatCurrency(item.revenue)}
                getIcon={(index) => index}
                getSubtitle={(item) => `${item.sales} unités vendues`}
              />
              <PerformanceList
                items={reportsData.overview.topSellers.slice(0, 5)}
                title="Top vendeurs"
                formatValue={(item) => formatCurrency(item.revenue)}
                getIcon={(index) => index}
                getSubtitle={(item) => `${item.sales} ventes`}
              />
            </div>

            {/* Performance par magasin (admin/manager) */}
            {canViewStoreMetrics && reportsData.overview.storePerformance.length > 0 && (
              <PerformanceList
                items={reportsData.overview.storePerformance}
                title="Performance par magasin"
                formatValue={(item) => formatCurrency(item.revenue)}
                getIcon={(index) => index}
                getSubtitle={(item) => `${item.sales} ventes - ${formatCurrency(item.averageOrderValue)} panier moyen`}
              />
            )}
          </div>
        );

      case 'products':
        return (
          <PerformanceList
            items={reportsData.products}
            title="Performances produits"
            formatValue={(item) => formatCurrency(item.revenue)}
            getIcon={(index) => index}
            getSubtitle={(item) => `${item.sales} unités vendues`}
          />
        );

      case 'sellers':
        return (
          <PerformanceList
            items={reportsData.sellers}
            title="Performance vendeurs"
            formatValue={(item) => formatCurrency(item.revenue)}
            getIcon={(index) => index}
            getSubtitle={(item) => `${item.sales} ventes - ${formatCurrency(item.averageOrderValue)} panier moyen`}
          />
        );

      case 'stores':
        return (
          <PerformanceList
            items={reportsData.stores}
            title="Performance magasins"
            formatValue={(item) => formatCurrency(item.revenue)}
            getIcon={(index) => index}
            getSubtitle={(item) => `${item.sales} ventes - ${formatCurrency(item.averageOrderValue)} panier moyen`}
          />
        );

      case 'personal':
        return reportsData.userMetrics ? (
          <PersonalMetrics 
            userMetrics={reportsData.userMetrics} 
            formatCurrency={formatCurrency} 
          />
        ) : (
          <EmptyState 
            title="Aucune donnée personnelle"
            description="Aucune donnée personnelle disponible pour cette période"
            icon={Target}
          />
        );

      case 'growth':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Croissance & Tendances</CardTitle>
                <CardDescription>Évolution des performances sur {selectedPeriod}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Chiffre d'affaires</h4>
                    <div className="text-3xl font-bold">{formatCurrency(reportsData.growth.revenue)}</div>
                    <div className="flex items-center gap-2">
                      {reportsData.growth.growth.revenue > 0 ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      )}
                      <span className={reportsData.growth.growth.revenue > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(Math.abs(reportsData.growth.growth.revenue))}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Transactions</h4>
                    <div className="text-3xl font-bold">{reportsData.growth.transactions}</div>
                    <div className="flex items-center gap-2">
                      {reportsData.growth.growth.transactions > 0 ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      )}
                      <span className={reportsData.growth.growth.transactions > 0 ? 'text-green-600' : 'text-red-600'}>
                        {reportsData.growth.growth.transactions > 0 ? '+' : ''}{reportsData.growth.growth.transactions}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                    {React.createElement(BarChart3, { className: "h-4 w-4" })}
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

            {/* Sélection magasin (admin/manager) */}
            {canViewStoreMetrics && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Magasin
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les magasins</option>
                  {/* Options de magasins à implémenter */}
                </select>
              </div>
            )}
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