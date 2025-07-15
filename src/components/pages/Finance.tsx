
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator,
  Receipt,
  Download,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Store,
  Users,
  Target
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useStores } from '@/hooks/useStores';

interface Expense {
  id: number;
  store_id: number;
  user_id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
  stores?: {
    name: string;
  };
  profiles?: {
    name: string;
  };
}

interface FinanceData {
  revenue: {
    total: number;
    taxAmount: number;
    discounts: number;
  };
  expenses: {
    total: number;
  };
  profit: {
    gross: number;
    net: number;
    margin: number;
  };
  salesCount: number;
}

// Messages adaptatifs selon les rôles
const getRoleBasedMessages = (role: string) => {
  const messages = {
    admin: {
      title: 'Gestion Financière Globale',
      description: 'Vue d\'ensemble financière complète du système',
      subtitle: 'Analyse des finances globales et par magasin',
      noDataMessage: 'Aucune donnée financière disponible pour cette période',
      exportMessage: 'Export des données financières globales en cours...',
      addExpenseMessage: 'Dépense ajoutée au système',
      deleteExpenseMessage: 'Dépense supprimée du système',
      noAccessMessage: 'Accès non autorisé aux finances'
    },
    manager: {
      title: 'Gestion Financière Magasin',
      description: 'Finances de vos magasins assignés',
      subtitle: 'Analyse des finances par magasin et équipe',
      noDataMessage: 'Aucune donnée financière disponible pour vos magasins',
      exportMessage: 'Export des données financières magasin en cours...',
      addExpenseMessage: 'Dépense ajoutée à votre magasin',
      deleteExpenseMessage: 'Dépense supprimée de votre magasin',
      noAccessMessage: 'Accès non autorisé aux finances'
    },
    seller: {
      title: 'Mes Finances',
      description: 'Vos finances personnelles',
      subtitle: 'Analyse de vos performances financières',
      noDataMessage: 'Aucune donnée financière personnelle disponible',
      exportMessage: 'Export de vos données financières en cours...',
      addExpenseMessage: 'Dépense personnelle ajoutée',
      deleteExpenseMessage: 'Dépense personnelle supprimée',
      noAccessMessage: 'Accès non autorisé aux finances'
    }
  };

  return messages[role as keyof typeof messages] || messages.seller;
};

export const Finance = ({ user }) => {
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller, canViewFinance } = useUserRoles();
  const { stores } = useStores();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedStore, setSelectedStore] = useState('all');
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Messages adaptatifs
  const messages = getRoleBasedMessages(profile?.role || 'seller');

  // Permissions adaptatives
  const canViewAllStores = isAdmin;
  const canManageExpenses = isAdmin || isManager;
  const canDeleteExpenses = isAdmin;
  const canExportData = isAdmin || isManager;

  useEffect(() => {
    if (user && canViewFinance) {
      loadFinanceData();
      loadExpenses();
    }
  }, [selectedPeriod, selectedStore, user, canViewFinance]);

  const loadFinanceData = async () => {
    setIsLoading(true);
    try {
      // Calculer les dates selon la période
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Charger les données de ventes
      let salesQuery = supabase
        .from('sales')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Filtrage selon les permissions
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

      // Calculer les métriques financières
      const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const totalTax = salesData?.reduce((sum, sale) => sum + (sale.tax_amount || 0), 0) || 0;
      const totalDiscounts = salesData?.reduce((sum, sale) => sum + (sale.discount_amount || 0), 0) || 0;
      
      // Calculer les dépenses totales depuis la base de données
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      const grossProfit = totalRevenue - totalExpenses;
      const netProfit = grossProfit - totalTax;

      setFinanceData({
        revenue: {
          total: totalRevenue,
          taxAmount: totalTax,
          discounts: totalDiscounts
        },
        expenses: {
          total: totalExpenses
        },
        profit: {
          gross: grossProfit,
          net: netProfit,
          margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        },
        salesCount: salesData?.length || 0
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données financières.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const { startDate, endDate } = getDateRange(selectedPeriod);

      let query = supabase
        .from('expenses')
        .select(`
          *,
          stores (name),
          profiles (name)
        `)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Filtrage selon les permissions
      if (!canViewAllStores) {
        query = query.in('store_id', profile?.store_ids || []);
      }

      if (selectedStore !== 'all') {
        query = query.eq('store_id', parseInt(selectedStore));
      }

      const { data, error } = await query;
      if (error) throw error;

      setExpenses(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des dépenses:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les dépenses.",
        variant: "destructive",
      });
    }
  };

  const getDateRange = (period: string) => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  };

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0 XOF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const addExpense = async () => {
    if (!canManageExpenses) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour ajouter des dépenses.",
        variant: "destructive",
      });
      return;
    }

    if (!newExpense.category || !newExpense.amount || newExpense.amount <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          store_id: selectedStore !== 'all' ? parseInt(selectedStore) : profile?.store_ids?.[0],
          user_id: profile?.id,
          category: newExpense.category,
          amount: newExpense.amount,
          description: newExpense.description,
          date: newExpense.date,
        }])
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev => [data, ...prev]);
      setNewExpense({
        category: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setShowExpenseForm(false);

      toast({
        title: "Succès",
        description: messages.addExpenseMessage,
      });

      // Recharger les données financières
      loadFinanceData();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la dépense:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la dépense.",
        variant: "destructive",
      });
    }
  };

  const removeExpense = async (id: number) => {
    if (!canDeleteExpenses) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour supprimer des dépenses.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses(prev => prev.filter(expense => expense.id !== id));
      toast({
        title: "Succès",
        description: messages.deleteExpenseMessage,
      });

      // Recharger les données financières
      loadFinanceData();
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la dépense.",
        variant: "destructive",
      });
    }
  };

  const exportFinancialReport = async () => {
    if (!canExportData) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour exporter les données financières.",
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
        description: "Impossible d'exporter les données financières.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
                  {messages.noAccessMessage}
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

          <Button variant="outline" onClick={loadFinanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          
          {canExportData && (
            <Button variant="outline" onClick={exportFinancialReport} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Export...' : 'Exporter'}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Financiers adaptatifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold">{formatCurrency(financeData?.revenue?.total || 0)}</p>
                <p className="text-xs text-green-200 mt-1">
                  {isAdmin ? 'CA total système' : 
                   isManager ? 'CA de vos magasins' : 
                   'Votre CA personnel'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Bénéfice Net</p>
                <p className="text-2xl font-bold">{formatCurrency(financeData?.profit?.net || 0)}</p>
                <p className="text-sm">Marge: {financeData?.profit?.margin?.toFixed(1) || 0}%</p>
                <p className="text-xs text-blue-200 mt-1">
                  {isAdmin ? 'Bénéfice système' : 
                   isManager ? 'Bénéfice magasins' : 
                   'Votre bénéfice'}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {(isAdmin || isManager) && (
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Dépenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(financeData?.expenses?.total || 0)}</p>
                  <p className="text-xs text-red-200 mt-1">
                    {isAdmin ? 'Dépenses totales' : 'Dépenses magasins'}
                  </p>
                </div>
                <Receipt className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Ventes</p>
                <p className="text-2xl font-bold">{financeData?.salesCount || 0}</p>
                <p className="text-xs text-purple-200 mt-1">
                  {isAdmin ? 'Total ventes' : 
                   isManager ? 'Ventes magasins' : 
                   'Vos ventes'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des dépenses adaptative */}
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
                  <Button onClick={addExpense}>Ajouter</Button>
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
                        onClick={() => removeExpense(expense.id)}
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
                {isAdmin ? 'Les données présentées sont basées sur toutes les transactions du système.' :
                 isManager ? 'Les données présentées sont basées sur les transactions de vos magasins assignés.' :
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
