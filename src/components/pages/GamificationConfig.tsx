import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Trophy, 
  Award, 
  Star, 
  Target, 
  Users, 
  Crown,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  ShoppingCart,
  UserCheck,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { GamificationAdminConfig, AvatarLevelConfig, BadgeConfig, TrophyConfig } from '@/types/gamification';

export const GamificationConfig = () => {
  const { profile } = useAuth();
  const { isAdmin } = useUserRoles();
  const [activeTab, setActiveTab] = useState('points');
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<GamificationAdminConfig>({
    base_points: {
      sale_completed: 10,
      product_sold: 5,
      customer_satisfaction: 15,
      training_completed: 20,
      perfect_attendance: 25
    },
    multipliers: {
      weekend_sale: 1.5,
      holiday_sale: 2.0,
      premium_product: 1.3,
      new_customer: 1.2,
      repeat_customer: 1.1
    },
    penalties: {
      late_arrival: -10,
      customer_complaint: -20,
      product_return: -15,
      missed_target: -25,
      training_missed: -30
    },
    daily_goals: {
      sales_count: 5,
      sales_amount: 50000,
      products_sold: 20,
      customer_satisfaction: 4.5
    },
    avatar_levels: [
      { level: 1, name: "Débutant", required_points: 0, avatar_url: "/avatars/level1.png", benefits: ["Accès de base"] },
      { level: 2, name: "Vendeur", required_points: 100, avatar_url: "/avatars/level2.png", benefits: ["Badge Bronze"] },
      { level: 3, name: "Vendeur Confirmé", required_points: 300, avatar_url: "/avatars/level3.png", benefits: ["Badge Argent"] },
      { level: 4, name: "Expert", required_points: 600, avatar_url: "/avatars/level4.png", benefits: ["Badge Or"] },
      { level: 5, name: "Maître Vendeur", required_points: 1000, avatar_url: "/avatars/level5.png", benefits: ["Badge Diamant"] }
    ],
    badges: [
      { type: "bronze", name: "Bronze", description: "Premier pas", icon_url: "/badges/bronze.png", required_points: 100, is_active: true },
      { type: "silver", name: "Argent", description: "Vendeur confirmé", icon_url: "/badges/silver.png", required_points: 300, is_active: true },
      { type: "gold", name: "Or", description: "Expert vendeur", icon_url: "/badges/gold.png", required_points: 600, is_active: true },
      { type: "diamond", name: "Diamant", description: "Maître vendeur", icon_url: "/badges/diamond.png", required_points: 1000, is_active: true },
      { type: "platinum", name: "Platine", description: "Légende", icon_url: "/badges/platinum.png", required_points: 2000, is_active: true }
    ],
    trophies: [
      {
        name: "Meilleur Vendeur du Mois",
        description: "Vendeur avec le plus de ventes du mois",
        category: "monthly",
        icon_url: "/trophies/monthly.png",
        points_reward: 100,
        criteria: [
          { type: "sales_amount", operator: "greater_than", value: 1000000, period: "monthly" }
        ],
        is_active: true
      },
      {
        name: "Objectif Quotidien",
        description: "Atteindre l'objectif quotidien 7 jours de suite",
        category: "special",
        icon_url: "/trophies/daily.png",
        points_reward: 50,
        criteria: [
          { type: "sales_count", operator: "greater_than", value: 5, period: "daily" }
        ],
        is_active: true
      }
    ]
  });

  // Vérifier les permissions
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions pour accéder à cette page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Charger la configuration
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('gamification_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('gamification_config')
        .upsert({
          id: 'default',
          config: config,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres de gamification ont été mis à jour avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateBasePoints = (key: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      base_points: {
        ...prev.base_points,
        [key]: value
      }
    }));
  };

  const updateMultipliers = (key: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      multipliers: {
        ...prev.multipliers,
        [key]: value
      }
    }));
  };

  const updatePenalties = (key: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      penalties: {
        ...prev.penalties,
        [key]: value
      }
    }));
  };

  const updateDailyGoals = (key: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      daily_goals: {
        ...prev.daily_goals,
        [key]: value
      }
    }));
  };

  const addAvatarLevel = () => {
    const newLevel: AvatarLevelConfig = {
      level: config.avatar_levels.length + 1,
      name: `Niveau ${config.avatar_levels.length + 1}`,
      required_points: config.avatar_levels[config.avatar_levels.length - 1]?.required_points + 100 || 100,
      avatar_url: `/avatars/level${config.avatar_levels.length + 1}.png`,
      benefits: ["Nouveau niveau"]
    };

    setConfig(prev => ({
      ...prev,
      avatar_levels: [...prev.avatar_levels, newLevel]
    }));
  };

  const updateAvatarLevel = (index: number, field: keyof AvatarLevelConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      avatar_levels: prev.avatar_levels.map((level, i) => 
        i === index ? { ...level, [field]: value } : level
      )
    }));
  };

  const removeAvatarLevel = (index: number) => {
    setConfig(prev => ({
      ...prev,
      avatar_levels: prev.avatar_levels.filter((_, i) => i !== index)
    }));
  };

  const addBadge = () => {
    const newBadge: BadgeConfig = {
      type: "bronze",
      name: "Nouveau Badge",
      description: "Description du badge",
      icon_url: "/badges/new.png",
      required_points: 100,
      is_active: true
    };

    setConfig(prev => ({
      ...prev,
      badges: [...prev.badges, newBadge]
    }));
  };

  const updateBadge = (index: number, field: keyof BadgeConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      badges: prev.badges.map((badge, i) => 
        i === index ? { ...badge, [field]: value } : badge
      )
    }));
  };

  const removeBadge = (index: number) => {
    setConfig(prev => ({
      ...prev,
      badges: prev.badges.filter((_, i) => i !== index)
    }));
  };

  const addTrophy = () => {
    const newTrophy: TrophyConfig = {
      name: "Nouveau Trophée",
      description: "Description du trophée",
      category: "special",
      icon_url: "/trophies/new.png",
      points_reward: 50,
      criteria: [
        { type: "sales_count", operator: "greater_than", value: 10, period: "daily" }
      ],
      is_active: true
    };

    setConfig(prev => ({
      ...prev,
      trophies: [...prev.trophies, newTrophy]
    }));
  };

  const updateTrophy = (index: number, field: keyof TrophyConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      trophies: prev.trophies.map((trophy, i) => 
        i === index ? { ...trophy, [field]: value } : trophy
      )
    }));
  };

  const removeTrophy = (index: number) => {
    setConfig(prev => ({
      ...prev,
      trophies: prev.trophies.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuration Gamification</h1>
          <p className="text-gray-600">Gérez les paramètres du système de gamification</p>
        </div>
        <Button onClick={saveConfig} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {/* Onglets de configuration */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="levels">Niveaux</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="trophies">Trophées</TabsTrigger>
          <TabsTrigger value="goals">Objectifs</TabsTrigger>
        </TabsList>

        {/* Configuration des points */}
        <TabsContent value="points" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Points de base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span>Points de Base</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sale_completed">Vente complétée</Label>
                  <Input
                    id="sale_completed"
                    type="number"
                    value={config.base_points.sale_completed}
                    onChange={(e) => updateBasePoints('sale_completed', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="product_sold">Produit vendu</Label>
                  <Input
                    id="product_sold"
                    type="number"
                    value={config.base_points.product_sold}
                    onChange={(e) => updateBasePoints('product_sold', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="customer_satisfaction">Satisfaction client</Label>
                  <Input
                    id="customer_satisfaction"
                    type="number"
                    value={config.base_points.customer_satisfaction}
                    onChange={(e) => updateBasePoints('customer_satisfaction', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="training_completed">Formation complétée</Label>
                  <Input
                    id="training_completed"
                    type="number"
                    value={config.base_points.training_completed}
                    onChange={(e) => updateBasePoints('training_completed', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="perfect_attendance">Présence parfaite</Label>
                  <Input
                    id="perfect_attendance"
                    type="number"
                    value={config.base_points.perfect_attendance}
                    onChange={(e) => updateBasePoints('perfect_attendance', parseInt(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Multiplicateurs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>Multiplicateurs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="weekend_sale">Vente weekend</Label>
                  <Input
                    id="weekend_sale"
                    type="number"
                    step="0.1"
                    value={config.multipliers.weekend_sale}
                    onChange={(e) => updateMultipliers('weekend_sale', parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label htmlFor="holiday_sale">Vente jour férié</Label>
                  <Input
                    id="holiday_sale"
                    type="number"
                    step="0.1"
                    value={config.multipliers.holiday_sale}
                    onChange={(e) => updateMultipliers('holiday_sale', parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label htmlFor="premium_product">Produit premium</Label>
                  <Input
                    id="premium_product"
                    type="number"
                    step="0.1"
                    value={config.multipliers.premium_product}
                    onChange={(e) => updateMultipliers('premium_product', parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label htmlFor="new_customer">Nouveau client</Label>
                  <Input
                    id="new_customer"
                    type="number"
                    step="0.1"
                    value={config.multipliers.new_customer}
                    onChange={(e) => updateMultipliers('new_customer', parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label htmlFor="repeat_customer">Client fidèle</Label>
                  <Input
                    id="repeat_customer"
                    type="number"
                    step="0.1"
                    value={config.multipliers.repeat_customer}
                    onChange={(e) => updateMultipliers('repeat_customer', parseFloat(e.target.value) || 1)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pénalités */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Pénalités</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="late_arrival">Retard</Label>
                  <Input
                    id="late_arrival"
                    type="number"
                    value={config.penalties.late_arrival}
                    onChange={(e) => updatePenalties('late_arrival', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="customer_complaint">Plainte client</Label>
                  <Input
                    id="customer_complaint"
                    type="number"
                    value={config.penalties.customer_complaint}
                    onChange={(e) => updatePenalties('customer_complaint', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="product_return">Retour produit</Label>
                  <Input
                    id="product_return"
                    type="number"
                    value={config.penalties.product_return}
                    onChange={(e) => updatePenalties('product_return', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="missed_target">Objectif manqué</Label>
                  <Input
                    id="missed_target"
                    type="number"
                    value={config.penalties.missed_target}
                    onChange={(e) => updatePenalties('missed_target', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="training_missed">Formation manquée</Label>
                  <Input
                    id="training_missed"
                    type="number"
                    value={config.penalties.training_missed}
                    onChange={(e) => updatePenalties('training_missed', parseInt(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration des niveaux */}
        <TabsContent value="levels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Niveaux d'Avatar</span>
                </CardTitle>
                <Button onClick={addAvatarLevel} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Niveau
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.avatar_levels.map((level, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Niveau {level.level}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAvatarLevel(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={level.name}
                          onChange={(e) => updateAvatarLevel(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Points requis</Label>
                        <Input
                          type="number"
                          value={level.required_points}
                          onChange={(e) => updateAvatarLevel(index, 'required_points', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>URL Avatar</Label>
                        <Input
                          value={level.avatar_url}
                          onChange={(e) => updateAvatarLevel(index, 'avatar_url', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Avantages</Label>
                        <Textarea
                          value={level.benefits.join(', ')}
                          onChange={(e) => updateAvatarLevel(index, 'benefits', e.target.value.split(', '))}
                          placeholder="Avantage 1, Avantage 2, ..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration des badges */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Badges</span>
                </CardTitle>
                <Button onClick={addBadge} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Badge
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.badges.map((badge, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{badge.type.toUpperCase()}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeBadge(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={badge.type}
                          onValueChange={(value) => updateBadge(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bronze">Bronze</SelectItem>
                            <SelectItem value="silver">Argent</SelectItem>
                            <SelectItem value="gold">Or</SelectItem>
                            <SelectItem value="diamond">Diamant</SelectItem>
                            <SelectItem value="platinum">Platine</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={badge.name}
                          onChange={(e) => updateBadge(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={badge.description}
                          onChange={(e) => updateBadge(index, 'description', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Points requis</Label>
                        <Input
                          type="number"
                          value={badge.required_points}
                          onChange={(e) => updateBadge(index, 'required_points', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>URL Icône</Label>
                        <Input
                          value={badge.icon_url}
                          onChange={(e) => updateBadge(index, 'icon_url', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={badge.is_active}
                          onCheckedChange={(checked) => updateBadge(index, 'is_active', checked)}
                        />
                        <Label>Actif</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration des trophées */}
        <TabsContent value="trophies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Trophées</span>
                </CardTitle>
                <Button onClick={addTrophy} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Trophée
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.trophies.map((trophy, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{trophy.name}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTrophy(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={trophy.name}
                          onChange={(e) => updateTrophy(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Catégorie</Label>
                        <Select
                          value={trophy.category}
                          onValueChange={(value) => updateTrophy(index, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Mensuel</SelectItem>
                            <SelectItem value="quarterly">Trimestriel</SelectItem>
                            <SelectItem value="yearly">Annuel</SelectItem>
                            <SelectItem value="special">Spécial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={trophy.description}
                          onChange={(e) => updateTrophy(index, 'description', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Points de récompense</Label>
                        <Input
                          type="number"
                          value={trophy.points_reward}
                          onChange={(e) => updateTrophy(index, 'points_reward', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>URL Icône</Label>
                        <Input
                          value={trophy.icon_url}
                          onChange={(e) => updateTrophy(index, 'icon_url', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={trophy.is_active}
                          onCheckedChange={(checked) => updateTrophy(index, 'is_active', checked)}
                        />
                        <Label>Actif</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration des objectifs */}
        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Objectifs Quotidiens</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="daily_sales_count">Nombre de ventes</Label>
                  <Input
                    id="daily_sales_count"
                    type="number"
                    value={config.daily_goals.sales_count}
                    onChange={(e) => updateDailyGoals('sales_count', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="daily_sales_amount">Montant des ventes (XOF)</Label>
                  <Input
                    id="daily_sales_amount"
                    type="number"
                    value={config.daily_goals.sales_amount}
                    onChange={(e) => updateDailyGoals('sales_amount', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="daily_products_sold">Produits vendus</Label>
                  <Input
                    id="daily_products_sold"
                    type="number"
                    value={config.daily_goals.products_sold}
                    onChange={(e) => updateDailyGoals('products_sold', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="daily_satisfaction">Satisfaction client (/5)</Label>
                  <Input
                    id="daily_satisfaction"
                    type="number"
                    step="0.1"
                    value={config.daily_goals.customer_satisfaction}
                    onChange={(e) => updateDailyGoals('customer_satisfaction', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 