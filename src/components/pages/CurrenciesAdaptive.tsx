import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Euro, 
  Plus, 
  Settings, 
  RefreshCw, 
  TrendingUp,
  Globe,
  Edit,
  Trash2,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle,
  Info,
  Shield,
  Users,
  BarChart3
} from 'lucide-react';
import { useCurrenciesOptimized } from '@/hooks/useCurrenciesOptimized';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';

export const CurrenciesAdaptive = ({ user }) => {
  const [converterAmount, setConverterAmount] = useState(1000);
  const [fromCurrency, setFromCurrency] = useState('XOF');
  const [toCurrency, setToCurrency] = useState('EUR');

  const {
    currencies,
    baseCurrency,
    metrics,
    context,
    messages,
    isLoading,
    error,
    isExporting,
    selectedCurrency,
    conversionHistory,
    refetch,
    setSelectedCurrency,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    toggleCurrencyStatus,
    updateExchangeRates,
    convertAmount,
    formatCurrency,
    exportCurrencies,
    createCurrencyMutation,
    updateCurrencyMutation,
    deleteCurrencyMutation,
  } = useCurrenciesOptimized();

  // États de chargement adaptatifs
  if (isLoading && currencies.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {messages.loading[context.role as keyof typeof messages.loading] || messages.loading.default}
            </h3>
            <p className="text-gray-600">
              {context.isAdmin && "Configuration du système de devises..."}
              {context.isManager && "Récupération des devises disponibles..."}
              {context.isSeller && "Chargement des taux de change..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // États d'erreur adaptatifs
  if (error) {
    return (
      <ErrorState
        title="Erreur de chargement"
        message={messages.error[context.role as keyof typeof messages.error] || messages.error.default}
        onRetry={refetch}
        showRetry={context.canManageCurrencies}
      />
    );
  }

  // États vides adaptatifs
  if (currencies.length === 0) {
    return (
      <EmptyState
        icon={Globe}
        title="Aucune devise configurée"
        message={messages.empty[context.role as keyof typeof messages.empty] || messages.empty.default}
        action={
          context.canManageCurrencies ? {
            label: "Créer la première devise",
            onClick: () => {/* TODO: Open create modal */}
          } : undefined
        }
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête adaptatif */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Devises</h2>
            <StatusBadge 
              status={context.isAdmin ? 'admin' : context.isManager ? 'manager' : 'user'}
              text={context.role}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <p>
              {context.isAdmin && "Configuration complète du système de devises"}
              {context.isManager && "Gestion des devises et taux de change"}
              {context.isSeller && "Consultation des taux de change"}
            </p>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>{metrics.totalCurrencies} devises</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {context.canUpdateRates && (
            <Button 
              variant="outline" 
              onClick={updateExchangeRates}
              disabled={isLoading || updateCurrencyMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser les taux
            </Button>
          )}
          
          {context.canManageCurrencies && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter devise
            </Button>
          )}
          
          {context.canManageCurrencies && (
            <Button 
              variant="outline" 
              onClick={exportCurrencies}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Export...' : 'Exporter'}
            </Button>
          )}
        </div>
      </div>

      {/* Métriques adaptatives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Devises</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalCurrencies}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Devises Actives</p>
                <p className="text-2xl font-bold text-green-600">{metrics.activeCurrencies}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Devise de Base</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.baseCurrency}</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.conversionCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration de base adaptative */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Configuration de Base
            {context.isAdmin && (
              <Badge variant="secondary" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {context.isAdmin && "Devise de référence pour tous les calculs système"}
            {context.isManager && "Devise de base configurée par l'administrateur"}
            {context.isSeller && "Devise de référence pour les conversions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="baseCurrency">Devise de base</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {baseCurrency?.code || 'XOF'}
                </Badge>
                <span className="text-gray-600">
                  {baseCurrency?.name || 'Franc CFA (BCEAO)'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dernière mise à jour</Label>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="h-4 w-4" />
                <span>
                  {baseCurrency?.last_updated ? 
                    new Date(baseCurrency.last_updated).toLocaleString('fr-FR') :
                    'Jamais'
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des devises adaptative */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            Devises Configurées
            {!context.canManageCurrencies && (
              <Badge variant="outline" className="ml-2">
                <Info className="h-3 w-3 mr-1" />
                Lecture seule
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {context.isAdmin && "Gérez toutes les devises supportées par votre système"}
            {context.isManager && "Consultez et modifiez les devises disponibles"}
            {context.isSeller && "Devises disponibles pour les conversions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currencies.map((currency) => (
              <div key={currency.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600">{currency.symbol}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{currency.code}</h3>
                      {currency.is_base && <Badge variant="secondary">Base</Badge>}
                      <Badge variant={currency.is_active ? "default" : "outline"}>
                        {currency.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{currency.name}</p>
                    <p className="text-xs text-gray-500">
                      Taux: {currency.rate.toFixed(currency.is_base ? 0 : 6)} 
                      {!currency.is_base && ` ${currency.code}/${baseCurrency?.code}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {context.canManageCurrencies && !currency.is_base && (
                    <Switch
                      checked={currency.is_active}
                      onCheckedChange={() => toggleCurrencyStatus(currency.id)}
                      disabled={updateCurrencyMutation.isPending}
                    />
                  )}
                  
                  {context.canManageCurrencies && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedCurrency(currency)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {context.canDeleteCurrencies && !currency.is_base && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteCurrency(currency.id)}
                      disabled={deleteCurrencyMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Convertisseur rapide adaptatif */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Convertisseur Rapide
            {conversionHistory.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {conversionHistory.length} conversions
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {context.isAdmin && "Testez les conversions et vérifiez les taux"}
            {context.isManager && "Vérifiez les taux de change actuels"}
            {context.isSeller && "Convertissez rapidement entre devises"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant</Label>
              <Input
                id="amount"
                type="number"
                placeholder="1000"
                value={converterAmount}
                onChange={(e) => setConverterAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromCurrency">De</Label>
              <select
                id="fromCurrency"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
              >
                {currencies.filter(c => c.is_active).map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toCurrency">Vers</Label>
              <select
                id="toCurrency"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
              >
                {currencies.filter(c => c.is_active).map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Résultat</Label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm">
                <span className="font-medium">
                  {formatCurrency(convertAmount(converterAmount, fromCurrency, toCurrency), toCurrency)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des conversions (pour les admins et managers) */}
      {(context.isAdmin || context.isManager) && conversionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Historique des Conversions
            </CardTitle>
            <CardDescription>
              Dernières conversions effectuées dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conversionHistory.slice(-10).reverse().map((conversion, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span>
                    {formatCurrency(conversion.amount, conversion.from)} → {formatCurrency(conversion.result, conversion.to)}
                  </span>
                  <span className="text-gray-500">
                    {conversion.timestamp.toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 