import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  Receipt,
  Download,
  Plus,
  Edit,
  Trash2,
  Store,
  Target,
  AlertTriangle,
  Eye,
  Settings,
  UserCheck,
  Building2,
  ChartLine,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinanceOptimized } from '@/hooks/useFinanceOptimized';
import { useStores } from '@/hooks/useStores';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const FinanceAdaptive = () => {
  const { profile } = useAuth();
  const {
    financeData,
    expenses,
    isLoading,
    error,
    selectedPeriod,
    setSelectedPeriod,
    selectedStore,
    setSelectedStore,
    isExporting,
    context,
    messages,
    canViewFinance,
    canViewAllStores,
    canViewUserMetrics,
    canExportData,
    canViewGrowthMetrics,
    canManageExpenses,
    canDeleteExpenses,
    exportFinance,
    refreshData,
    addExpense,
    deleteExpense,
    formatCurrency,
    formatPercentage
  } = useFinanceOptimized();

  const { stores } = useStores();
  const [activeTab, setActiveTab] = useState('overview');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

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

    if (canManageExpenses) {
      actions.push({
        label: 'Ajouter dépense',
        icon: Plus,
        action: () => setShowExpenseForm(true),
        color: 'bg-green-600 hover:bg-green-700',
        roles: ['admin', 'manager']
      });
    }

    if (canExportData) {
      actions.push({
        label: 'Exporter',
        icon: Download,
        action: exportFinance,
        color: 'bg-purple-600 hover:bg-purple-700',
        roles: ['admin', 'manager']
      });
    }

    if (context.isAdmin) {
      actions.push({
        label: 'Configuration',
        icon: Settings,
        action: () => toast({ title: 'Configuration', description: 'Accès à la configuration financière' }),
        color: 'bg-gray-600 hover:bg-gray-700',
        roles: ['admin']
      });
    }

    return actions.filter(action => action.roles.includes(context.role));
  };

  // Métriques adaptatives selon les rôles
  const getAdaptiveMetrics = () => {
    if (!financeData) return [];

    const baseMetrics = [
      {
        title: 'Chiffre d\'Affaires',
        value: formatCurrency(financeData.revenue.total),
        icon: DollarSign,
        color: 'from-green-500 to-green-600',
        growth: canViewGrowthMetrics ? financeData.revenue.growthPercentage : null,
        description: context.isAdmin ? 'CA total du système' : 
                    context.isManager ? 'CA de vos magasins' : 
                    'Votre CA personnel'
      },
      {
        title: 'Bénéfice Net',
        value: formatCurrency(financeData.profit.net),
        icon: Calculator,
        color: 'from-blue-500 to-blue-600',
        growth: canViewGrowthMetrics ? financeData.profit.growth : null,
        description: context.isAdmin ? 'Bénéfice net système' : 
                    context.isManager ? 'Bénéfice net magasins' : 
                    'Votre bénéfice net'
      }
    ];

    if (context.isAdmin || context.isManager) {
      baseMetrics.push({
        title: 'Dépenses',
        value: formatCurrency(financeData.expenses.total),
        icon: Receipt,
        color: 'from-red-500 to-red-600',
        growth: canViewGrowthMetrics ? financeData.expenses.growth : null,
        description: context.isAdmin ? 'Dépenses totales système' : 
                    'Dépenses de vos magasins'
      });
    }

    baseMetrics.push({
      title: 'Marge',
      value: `${financeData.profit.margin.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      growth: null,
      description: context.isAdmin ? 'Marge système' : 
                  context.isManager ? 'Marge magasins' : 
                  'Votre marge'
    });

    if (canViewGrowthMetrics) {
      baseMetrics.push({
        title: 'Ventes',
        value: financeData.salesCount.toString(),
        icon: Target,
        color: 'from-orange-500 to-orange-600',
        growth: null,
        description: 'Nombre de ventes'
      });
    }

    return baseMetrics;
  };

  // Gestion de l'ajout de dépense
  const handleAddExpense = () => {
    if (!newExpense.category || !newExpense.amount || newExpense.amount <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    addExpense({
      store_id: selectedStore !== 'all' ? parseInt(selectedStore) : context.storeIds[0],
      user_id: profile?.id || '',
      category: newExpense.category,
      amount: newExpense.amount,
      description: newExpense.description,
      date: newExpense.date,
    });

    setNewExpense({
      category: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowExpenseForm(false);
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
                  {error.message || 'Impossible de charger les données financières'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gestion des erreurs d'accès
  if (!canViewFinance) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Accès non autorisé</h3>
                <p className="text-red-700 mt-1">
                  Vous n'avez pas les permissions pour accéder aux finances.
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
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
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
            <DollarSign className="h-4 w-4" />
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
                      <span className="text-sm">{formatCurrency(financeData?.revenue.total || 0)}</span>
                      <Badge variant={financeData?.revenue.growthPercentage >= 0 ? 'default' : 'destructive'}>
                        {formatPercentage(financeData?.revenue.growthPercentage || 0)}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(100, Math.max(0, financeData?.revenue.growthPercentage || 0))} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bénéfice net</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatCurrency(financeData?.profit.net || 0)}</span>
                      <Badge variant={financeData?.profit.growth >= 0 ? 'default' : 'destructive'}>
                        {formatPercentage(financeData?.profit.growth || 0)}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(100, Math.max(0, financeData?.profit.growth || 0))} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dépenses par catégorie */}
          {financeData?.expenses.byCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-red-600" />
                  Dépenses par catégorie
                </CardTitle>
                <CardDescription>
                  Répartition des dépenses selon les catégories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financeData.expenses.byCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{category.category}</Badge>
                        <span className="text-sm font-medium">{formatCurrency(category.amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</span>
                        <Progress value={category.percentage} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
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
                  {financeData?.storeMetrics?.length > 0 ? (
                    financeData.storeMetrics.map((store, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{store.storeName}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>CA: {formatCurrency(store.revenue)}</span>
                            <span>•</span>
                            <span>Dépenses: {formatCurrency(store.expenses)}</span>
                            <span>•</span>
                            <span>Bénéfice: {formatCurrency(store.profit)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {store.margin.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Marge</div>
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
                  {financeData?.userMetrics?.length > 0 ? (
                    financeData.userMetrics.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{user.userName}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>CA: {formatCurrency(user.revenue)}</span>
                            <span>•</span>
                            <span>Dépenses: {formatCurrency(user.expenses)}</span>
                            <span>•</span>
                            <span>Bénéfice: {formatCurrency(user.profit)}</span>
                          </div>
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

      {/* Gestion des dépenses */}
      {canManageExpenses && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestion des Dépenses</CardTitle>
              <Button onClick={() => setShowExpenseForm(!showExpenseForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une dépense
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showExpenseForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={newExpense.category} onValueChange={(value) => setNewExpense(prev => ({...prev, category: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loyer">Loyer</SelectItem>
                        <SelectItem value="salaires">Salaires</SelectItem>
                        <SelectItem value="electricite">Électricité</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Montant (XOF)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({...prev, amount: parseFloat(e.target.value) || 0}))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense(prev => ({...prev, date: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense(prev => ({...prev, description: e.target.value}))}
                      placeholder="Description optionnelle"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddExpense}>Ajouter</Button>
                  <Button variant="outline" onClick={() => setShowExpenseForm(false)}>Annuler</Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{expense.category}</Badge>
                        <span className="font-medium">{formatCurrency(expense.amount)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {expense.description} - {new Date(expense.date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {expense.stores?.name} • {expense.profiles?.name}
                      </p>
                    </div>
                    {canDeleteExpenses && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{messages.noDataMessage}</p>
                  <p className="text-sm">Commencez par ajouter vos dépenses pour un suivi financier complet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note informative adaptative */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Données financières en temps réel</h4>
              <p className="text-sm text-blue-700 mt-1">
                {context.isAdmin ? 'Les données présentées sont basées sur toutes les transactions du système.' :
                 context.isManager ? 'Les données présentées sont basées sur les transactions de vos magasins assignés.' :
                 'Les données présentées sont basées sur vos transactions personnelles.'}
                Les métriques sont calculées pour la période sélectionnée.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 