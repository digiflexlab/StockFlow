
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
  Shield,
  Info,
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { StatusBadge } from '@/components/common/StatusBadge';

export const Currencies = ({ user }) => {
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [converterAmount, setConverterAmount] = useState(1000);
  const [fromCurrency, setFromCurrency] = useState('XOF');
  const [toCurrency, setToCurrency] = useState('EUR');

  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller } = useUserRoles();

  const {
    currencies,
    baseCurrency,
    isLoading,
    error,
    updateExchangeRates,
    toggleCurrencyStatus,
    convertAmount,
    formatCurrency,
    deleteCurrency,
  } = useCurrencies();

  // Contexte utilisateur pour l'adaptation
  const userContext = {
    role: profile?.role || 'seller',
    isAdmin,
    isManager,
    isSeller,
    canManageCurrencies: isAdmin || isManager,
    canUpdateRates: isAdmin || isManager,
    canDeleteCurrencies: isAdmin,
  };

  // Messages adaptatifs par rôle
  const getRoleMessage = (type: string) => {
    const messages = {
      loading: {
        admin: "Configuration du système de devises...",
        manager: "Récupération des devises disponibles...",
        seller: "Chargement des taux de change...",
        default: "Chargement des devises..."
      },
      empty: {
        admin: "Aucune devise configurée. Créez la première devise pour commencer.",
        manager: "Aucune devise disponible. Contactez l'administrateur.",
        seller: "Aucune devise configurée pour les conversions.",
        default: "Aucune devise configurée."
      },
      error: {
        admin: "Erreur lors du chargement. Vérifiez la configuration système.",
        manager: "Impossible de charger les devises. Contactez l'administrateur.",
        seller: "Erreur de connexion aux taux de change.",
        default: "Erreur lors du chargement des devises."
      }
    };
    
    return messages[type]?.[userContext.role] || messages[type]?.default || "Erreur inconnue";
  };

  if (isLoading && currencies.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getRoleMessage('loading')}
          </h3>
          <p className="text-gray-600">
            {userContext.isAdmin && "Configuration du système de devises..."}
            {userContext.isManager && "Récupération des devises disponibles..."}
            {userContext.isSeller && "Chargement des taux de change..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">
            {getRoleMessage('error')}
          </p>
          {userContext.canManageCurrencies && (
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          )}
        </div>
      </div>
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
              type="role"
              value={userContext.role}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <p>
              {userContext.isAdmin && "Configuration complète du système de devises"}
              {userContext.isManager && "Gestion des devises et taux de change"}
              {userContext.isSeller && "Consultation des taux de change"}
            </p>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>{currencies.length} devises</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {userContext.canUpdateRates && (
          <Button 
            variant="outline" 
            onClick={updateExchangeRates}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser les taux
          </Button>
          )}
          {userContext.canManageCurrencies && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter devise
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
                <p className="text-2xl font-bold text-gray-900">{currencies.length}</p>
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
                <p className="text-2xl font-bold text-green-600">
                  {currencies.filter(c => c.is_active).length}
                </p>
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
                <p className="text-2xl font-bold text-purple-600">
                  {baseCurrency?.code || 'XOF'}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Permissions</p>
                <p className="text-2xl font-bold text-orange-600">
                  {userContext.canManageCurrencies ? 'Gestion' : 'Lecture'}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
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
            {userContext.isAdmin && (
              <Badge variant="secondary" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {userContext.isAdmin && "Devise de référence pour tous les calculs système"}
            {userContext.isManager && "Devise de base configurée par l'administrateur"}
            {userContext.isSeller && "Devise de référence pour les conversions"}
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
                  {currencies.find(c => c.is_base)?.last_updated ? 
                    new Date(currencies.find(c => c.is_base)!.last_updated).toLocaleString('fr-FR') :
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
            {!userContext.canManageCurrencies && (
              <Badge variant="outline" className="ml-2">
                <Info className="h-3 w-3 mr-1" />
                Lecture seule
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {userContext.isAdmin && "Gérez toutes les devises supportées par votre système"}
            {userContext.isManager && "Consultez et modifiez les devises disponibles"}
            {userContext.isSeller && "Devises disponibles pour les conversions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currencies.length > 0 ? (
              currencies.map((currency) => (
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
                    {userContext.canManageCurrencies && !currency.is_base && (
                    <Switch
                        checked={currency.is_active}
                        onCheckedChange={() => toggleCurrencyStatus(currency.id)}
                    />
                  )}
                    {userContext.canManageCurrencies && (
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                    )}
                    {userContext.canDeleteCurrencies && !currency.is_base && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteCurrency(currency.id)}
                      >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">Aucune devise configurée</h3>
                <p className="text-gray-600 mb-4">
                  {getRoleMessage('empty')}
                </p>
                {userContext.canManageCurrencies && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer la première devise
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Convertisseur rapide adaptatif */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Convertisseur Rapide
          </CardTitle>
          <CardDescription>
            {userContext.isAdmin && "Testez les conversions et vérifiez les taux"}
            {userContext.isManager && "Vérifiez les taux de change actuels"}
            {userContext.isSeller && "Convertissez rapidement entre devises"}
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
    </div>
  );
};
