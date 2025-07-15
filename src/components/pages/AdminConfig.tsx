
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const AdminConfig = () => {
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const { config, userLoading } = useGamification();
  
  const [isSaving, setIsSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  // Vérifier les permissions
  if (!hasPermission('admin')) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Accès refusé</h3>
              <p className="text-sm text-gray-600 mt-2">
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userLoading) {
    return <LoadingSpinner />;
  }

  const handleConfigChange = (section: string, key: string, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleNestedConfigChange = (section: string, nestedKey: string, key: string, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedKey]: {
          ...prev[section][nestedKey],
          [key]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Ici, vous devriez appeler votre API pour sauvegarder la configuration
      // await updateGamificationConfig(localConfig);
      
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres de gamification ont été mis à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration Admin</h1>
          <p className="text-gray-600">Gérer les paramètres de gamification du système</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <Tabs defaultValue="points" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="trophies">Trophées</TabsTrigger>
          <TabsTrigger value="goals">Objectifs</TabsTrigger>
          <TabsTrigger value="levels">Niveaux</TabsTrigger>
        </TabsList>

        {/* Configuration des Points */}
        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Points de Base</CardTitle>
              <CardDescription>
                Points attribués pour différentes actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sale_completed">Vente complétée</Label>
                  <Input
                    id="sale_completed"
                    type="number"
                    value={localConfig?.base_points?.sale_completed || 0}
                    onChange={(e) => handleConfigChange('base_points', 'sale_completed', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="product_sold">Produit vendu</Label>
                  <Input
                    id="product_sold"
                    type="number"
                    value={localConfig?.base_points?.product_sold || 0}
                    onChange={(e) => handleConfigChange('base_points', 'product_sold', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="customer_satisfaction">Satisfaction client</Label>
                  <Input
                    id="customer_satisfaction"
                    type="number"
                    value={localConfig?.base_points?.customer_satisfaction || 0}
                    onChange={(e) => handleConfigChange('base_points', 'customer_satisfaction', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="training_completed">Formation complétée</Label>
                  <Input
                    id="training_completed"
                    type="number"
                    value={localConfig?.base_points?.training_completed || 0}
                    onChange={(e) => handleConfigChange('base_points', 'training_completed', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multiplicateurs</CardTitle>
              <CardDescription>
                Multiplicateurs de points pour des conditions spéciales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weekend_sale">Vente weekend</Label>
                  <Input
                    id="weekend_sale"
                    type="number"
                    step="0.1"
                    value={localConfig?.multipliers?.weekend_sale || 1}
                    onChange={(e) => handleConfigChange('multipliers', 'weekend_sale', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="holiday_sale">Vente jour férié</Label>
                  <Input
                    id="holiday_sale"
                    type="number"
                    step="0.1"
                    value={localConfig?.multipliers?.holiday_sale || 1}
                    onChange={(e) => handleConfigChange('multipliers', 'holiday_sale', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="premium_product">Produit premium</Label>
                  <Input
                    id="premium_product"
                    type="number"
                    step="0.1"
                    value={localConfig?.multipliers?.premium_product || 1}
                    onChange={(e) => handleConfigChange('multipliers', 'premium_product', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="new_customer">Nouveau client</Label>
                  <Input
                    id="new_customer"
                    type="number"
                    step="0.1"
                    value={localConfig?.multipliers?.new_customer || 1}
                    onChange={(e) => handleConfigChange('multipliers', 'new_customer', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pénalités</CardTitle>
              <CardDescription>
                Points soustraits pour des infractions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="late_arrival">Retard</Label>
                  <Input
                    id="late_arrival"
                    type="number"
                    value={localConfig?.penalties?.late_arrival || 0}
                    onChange={(e) => handleConfigChange('penalties', 'late_arrival', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="customer_complaint">Plainte client</Label>
                  <Input
                    id="customer_complaint"
                    type="number"
                    value={localConfig?.penalties?.customer_complaint || 0}
                    onChange={(e) => handleConfigChange('penalties', 'customer_complaint', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="product_return">Retour produit</Label>
                  <Input
                    id="product_return"
                    type="number"
                    value={localConfig?.penalties?.product_return || 0}
                    onChange={(e) => handleConfigChange('penalties', 'product_return', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="no_sales_daily">Aucune vente quotidienne</Label>
                  <Input
                    id="no_sales_daily"
                    type="number"
                    value={localConfig?.penalties?.no_sales_daily || 0}
                    onChange={(e) => handleConfigChange('penalties', 'no_sales_daily', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Admin */}
        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Administrateur</CardTitle>
              <CardDescription>
                Configuration des privilèges et restrictions admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Ajustement de Points</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cooldown_hours">Délai entre ajustements (heures)</Label>
                    <Input
                      id="cooldown_hours"
                      type="number"
                      value={localConfig?.admin_config?.point_adjustment_cooldown_hours || 20}
                      onChange={(e) => handleNestedConfigChange('admin_config', 'point_adjustment_cooldown_hours', 'value', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_daily_adjustment">Maximum quotidien</Label>
                    <Input
                      id="max_daily_adjustment"
                      type="number"
                      value={localConfig?.admin_config?.max_daily_point_adjustment || 100}
                      onChange={(e) => handleNestedConfigChange('admin_config', 'max_daily_point_adjustment', 'value', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Pénalités Automatiques</h4>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_penalty"
                    checked={localConfig?.admin_config?.auto_penalty_no_sales || false}
                    onCheckedChange={(checked) => handleNestedConfigChange('admin_config', 'auto_penalty_no_sales', 'value', checked)}
                  />
                  <Label htmlFor="auto_penalty">Pénalité automatique pour absence de ventes</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Exigences Badges Managers</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="total_sales_threshold">Seuil ventes totales</Label>
                    <Input
                      id="total_sales_threshold"
                      type="number"
                      value={localConfig?.admin_config?.manager_badge_requirements?.total_sales_threshold || 1000}
                      onChange={(e) => handleNestedConfigChange('admin_config', 'manager_badge_requirements', 'total_sales_threshold', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sales_count_threshold">Seuil nombre de ventes</Label>
                    <Input
                      id="sales_count_threshold"
                      type="number"
                      value={localConfig?.admin_config?.manager_badge_requirements?.sales_count_threshold || 50}
                      onChange={(e) => handleNestedConfigChange('admin_config', 'manager_badge_requirements', 'sales_count_threshold', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration des Badges */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>
                Configuration des badges et leurs critères
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localConfig?.badges?.map((badge, index) => (
                  <div key={badge.type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{badge.name}</h4>
                      <div className="flex items-center space-x-2">
                        {badge.is_manager_only && (
                          <Badge variant="secondary">Manager</Badge>
                        )}
                        <Badge variant={badge.is_active ? "default" : "secondary"}>
                          {badge.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Points requis</Label>
                        <Input
                          type="number"
                          value={badge.required_points}
                          onChange={(e) => {
                            const newBadges = [...localConfig.badges];
                            newBadges[index].required_points = parseInt(e.target.value);
                            setLocalConfig(prev => ({ ...prev, badges: newBadges }));
                          }}
                        />
                      </div>
                      {badge.is_manager_only && badge.manager_requirements && (
                        <>
                          <div>
                            <Label>Ventes totales requises</Label>
                            <Input
                              type="number"
                              value={badge.manager_requirements.total_sales}
                              onChange={(e) => {
                                const newBadges = [...localConfig.badges];
                                newBadges[index].manager_requirements.total_sales = parseInt(e.target.value);
                                setLocalConfig(prev => ({ ...prev, badges: newBadges }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>Nombre de ventes requis</Label>
                            <Input
                              type="number"
                              value={badge.manager_requirements.sales_count}
                              onChange={(e) => {
                                const newBadges = [...localConfig.badges];
                                newBadges[index].manager_requirements.sales_count = parseInt(e.target.value);
                                setLocalConfig(prev => ({ ...prev, badges: newBadges }));
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration des Trophées */}
        <TabsContent value="trophies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trophées</CardTitle>
              <CardDescription>
                Configuration des trophées et leurs critères
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localConfig?.trophies?.map((trophy, index) => (
                  <div key={trophy.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{trophy.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{trophy.category}</Badge>
                        {trophy.applies_to_all_users && (
                          <Badge variant="secondary">Tous utilisateurs</Badge>
                        )}
                        <Badge variant={trophy.is_active ? "default" : "secondary"}>
                          {trophy.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{trophy.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Points de récompense</Label>
                        <Input
                          type="number"
                          value={trophy.points_reward}
                          onChange={(e) => {
                            const newTrophies = [...localConfig.trophies];
                            newTrophies[index].points_reward = parseInt(e.target.value);
                            setLocalConfig(prev => ({ ...prev, trophies: newTrophies }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>Catégorie</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={trophy.category}
                          onChange={(e) => {
                            const newTrophies = [...localConfig.trophies];
                            newTrophies[index].category = e.target.value as any;
                            setLocalConfig(prev => ({ ...prev, trophies: newTrophies }));
                          }}
                        >
                          <option value="monthly">Mensuel</option>
                          <option value="quarterly">Trimestriel</option>
                          <option value="yearly">Annuel</option>
                          <option value="special">Spécial</option>
                          <option value="consecutive">Consécutif</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration des Objectifs */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Objectifs Quotidiens</CardTitle>
              <CardDescription>
                Configuration des objectifs quotidiens pour les utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sales_count_goal">Nombre de ventes</Label>
                  <Input
                    id="sales_count_goal"
                    type="number"
                    value={localConfig?.daily_goals?.sales_count || 0}
                    onChange={(e) => handleConfigChange('daily_goals', 'sales_count', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="sales_amount_goal">Montant des ventes</Label>
                  <Input
                    id="sales_amount_goal"
                    type="number"
                    value={localConfig?.daily_goals?.sales_amount || 0}
                    onChange={(e) => handleConfigChange('daily_goals', 'sales_amount', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="products_sold_goal">Produits vendus</Label>
                  <Input
                    id="products_sold_goal"
                    type="number"
                    value={localConfig?.daily_goals?.products_sold || 0}
                    onChange={(e) => handleConfigChange('daily_goals', 'products_sold', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="satisfaction_goal">Satisfaction client</Label>
                  <Input
                    id="satisfaction_goal"
                    type="number"
                    step="0.1"
                    value={localConfig?.daily_goals?.customer_satisfaction || 0}
                    onChange={(e) => handleConfigChange('daily_goals', 'customer_satisfaction', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration des Niveaux */}
        <TabsContent value="levels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Niveaux d'Avatar</CardTitle>
              <CardDescription>
                Configuration des niveaux et leurs avantages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localConfig?.avatar_levels?.map((level, index) => (
                  <div key={level.level} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Niveau {level.level}: {level.name}</h4>
                      <Badge variant="outline">{level.required_points} points</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Points requis</Label>
                        <Input
                          type="number"
                          value={level.required_points}
                          onChange={(e) => {
                            const newLevels = [...localConfig.avatar_levels];
                            newLevels[index].required_points = parseInt(e.target.value);
                            setLocalConfig(prev => ({ ...prev, avatar_levels: newLevels }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>URL de l'avatar</Label>
                        <Input
                          value={level.avatar_url}
                          onChange={(e) => {
                            const newLevels = [...localConfig.avatar_levels];
                            newLevels[index].avatar_url = e.target.value;
                            setLocalConfig(prev => ({ ...prev, avatar_levels: newLevels }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Avantages</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {level.benefits.map((benefit, benefitIndex) => (
                          <Badge key={benefitIndex} variant="secondary">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
