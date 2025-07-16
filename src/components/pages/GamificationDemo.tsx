import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  Trophy, 
  Award, 
  Star, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus
} from 'lucide-react';

export const GamificationDemo = () => {
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const { 
    userGamification, 
    leaderboard, 
    notifications, 
    config, 
    stats,
    userLoading,
    addPoints,
    subtractPoints,
    adminAdjustPoints,
    applyNoSalesPenalty,
    checkAndAwardManagerBadges,
    updateBestSellerStatus,
    checkConsecutiveTrophies
  } = useGamification();

  const [selectedUser, setSelectedUser] = useState('');
  const [pointsToAdjust, setPointsToAdjust] = useState(10);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [simulationType, setSimulationType] = useState('sale');
  const [simulationValue, setSimulationValue] = useState(100);

  if (userLoading) {
    return <LoadingSpinner />;
  }

  const handleAdminAdjustPoints = async () => {
    if (!selectedUser || !adjustmentReason) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un utilisateur et fournir une raison.",
        variant: "destructive"
      });
      return;
    }

    try {
      await adminAdjustPoints({
        targetUserId: selectedUser,
        points: pointsToAdjust,
        reason: adjustmentReason,
        adjustmentType
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSimulateAction = async () => {
    if (!profile?.id) return;

    try {
      switch (simulationType) {
        case 'sale':
          await addPoints({
            userId: profile.id,
            points: config.base_points.sale_completed,
            reason: 'Vente simulée'
          });
          break;
        case 'satisfaction':
          await addPoints({
            userId: profile.id,
            points: config.base_points.customer_satisfaction,
            reason: 'Satisfaction client simulée'
          });
          break;
        case 'penalty':
          await subtractPoints({
            userId: profile.id,
            points: Math.abs(config.penalties.late_arrival),
            reason: 'Retard simulé'
          });
          break;
        case 'no_sales_penalty':
          await applyNoSalesPenalty(profile.id);
          break;
        case 'manager_badge':
          if (profile?.role === 'manager') {
            await checkAndAwardManagerBadges(profile.id, 'manager');
          }
          break;
        case 'best_seller':
          const currentMonth = new Date().toISOString().slice(0, 7);
          await updateBestSellerStatus(profile.id, currentMonth);
          break;
      }

      toast({
        title: "Action simulée",
        description: `Action ${simulationType} exécutée avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la simulation.",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'badge':
        return <Award className="h-4 w-4 text-blue-500" />;
      case 'level_up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'trophy':
        return <Star className="h-4 w-4 text-purple-500" />;
      case 'penalty':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'admin_adjustment':
        return <Users className="h-4 w-4 text-orange-500" />;
      case 'no_sales_penalty':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Démonstration Gamification</h1>
          <p className="text-gray-600">Testez toutes les fonctionnalités de gamification</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {profile?.role || 'Utilisateur'}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="leaderboard">Classement</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Totaux</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userGamification?.total_points || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Niveau {userGamification?.current_level || 1}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Badges</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userGamification?.badges?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {userGamification?.badges?.filter(b => b.is_manager_only).length || 0} badges manager
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trophées</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userGamification?.achievements?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Meilleur vendeur {userGamification?.consecutive_best_seller_count || 0} fois consécutives
                </p>
              </CardContent>
            </Card>
          </div>

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Progression</CardTitle>
                <CardDescription>Votre progression vers le prochain niveau</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Niveau actuel: {stats.currentLevel?.name}</span>
                    <span>Niveau suivant: {stats.nextLevel?.name}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, stats.progressToNextLevel)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {userGamification?.total_points || 0} / {stats.nextLevel?.required_points || 0} points
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Badges Obtenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userGamification?.badges?.map((badge) => (
                    <div key={badge.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{badge.badge_name}</span>
                        {badge.is_manager_only && (
                          <Badge variant="secondary" className="text-xs">Manager</Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {(!userGamification?.badges || userGamification.badges.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucun badge obtenu pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trophées Obtenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userGamification?.achievements?.map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{achievement.achievement_name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">+{achievement.points_earned} pts</div>
                        <div className="text-xs text-gray-500">
                          {new Date(achievement.earned_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!userGamification?.achievements || userGamification.achievements.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucun trophée obtenu pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fonctionnalités Admin */}
        <TabsContent value="admin" className="space-y-4">
          {hasPermission('admin') ? (
            <Card>
              <CardHeader>
                <CardTitle>Ajustement de Points</CardTitle>
                <CardDescription>
                  Ajuster les points d'un utilisateur (délai de {config?.admin_config?.point_adjustment_cooldown_hours || 20}h entre les ajustements)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-select">Utilisateur</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un utilisateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaderboard.map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.user_name} ({user.total_points} pts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="adjustment-type">Type d'ajustement</Label>
                    <Select value={adjustmentType} onValueChange={(value: 'add' | 'subtract') => setAdjustmentType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">
                          <div className="flex items-center space-x-2">
                            <Plus className="h-4 w-4 text-green-500" />
                            <span>Ajouter</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="subtract">
                          <div className="flex items-center space-x-2">
                            <Minus className="h-4 w-4 text-red-500" />
                            <span>Soustraire</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={pointsToAdjust}
                      onChange={(e) => setPointsToAdjust(parseInt(e.target.value))}
                      min="1"
                      max={config?.admin_config?.max_daily_point_adjustment || 100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: {config?.admin_config?.max_daily_point_adjustment || 100} points/jour
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="reason">Raison</Label>
                    <Input
                      id="reason"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      placeholder="Raison de l'ajustement"
                    />
                  </div>
                </div>
                <Button onClick={handleAdminAdjustPoints} className="w-full">
                  Ajuster les Points
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès restreint</h3>
                  <p className="text-gray-600">
                    Seuls les administrateurs peuvent ajuster les points des utilisateurs.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Simulation */}
        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulation d'Actions</CardTitle>
              <CardDescription>
                Simulez différentes actions pour tester le système de gamification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="simulation-type">Type d'action</Label>
                  <Select value={simulationType} onValueChange={setSimulationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Vente complétée</SelectItem>
                      <SelectItem value="satisfaction">Satisfaction client</SelectItem>
                      <SelectItem value="penalty">Pénalité (retard)</SelectItem>
                      <SelectItem value="no_sales_penalty">Pénalité absence de ventes</SelectItem>
                      <SelectItem value="manager_badge">Vérifier badge manager</SelectItem>
                      <SelectItem value="best_seller">Mettre à jour meilleur vendeur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="simulation-value">Valeur</Label>
                  <Input
                    id="simulation-value"
                    type="number"
                    value={simulationValue}
                    onChange={(e) => setSimulationValue(parseInt(e.target.value))}
                    placeholder="Valeur de simulation"
                  />
                </div>
              </div>
              <Button onClick={handleSimulateAction} className="w-full">
                Simuler l'Action
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Actuelle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Points par vente:</span>
                  <span className="font-medium">{config?.base_points?.sale_completed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Satisfaction client:</span>
                  <span className="font-medium">{config?.base_points?.customer_satisfaction}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pénalité retard:</span>
                  <span className="font-medium text-red-600">{config?.penalties?.late_arrival}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pénalité absence ventes:</span>
                  <span className="font-medium text-red-600">{config?.penalties?.no_sales_daily}</span>
                </div>
                <div className="flex justify-between">
                  <span>Délai admin (heures):</span>
                  <span className="font-medium">{config?.admin_config?.point_adjustment_cooldown_hours}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Objectifs Quotidiens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Ventes:</span>
                  <span className="font-medium">{config?.daily_goals?.sales_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Montant:</span>
                  <span className="font-medium">{config?.daily_goals?.sales_amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Produits vendus:</span>
                  <span className="font-medium">{config?.daily_goals?.products_sold}</span>
                </div>
                <div className="flex justify-between">
                  <span>Satisfaction:</span>
                  <span className="font-medium">{config?.daily_goals?.customer_satisfaction}/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Classement */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Classement des Utilisateurs</CardTitle>
              <CardDescription>
                Top 10 des utilisateurs par points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((user, index) => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-600">#{user.rank}</span>
                      </div>
                      <div>
                        <div className="font-medium">{user.user_name}</div>
                        <div className="text-sm text-gray-500">
                          Niveau {user.current_level} • {user.badge_count} badges • {user.achievement_count} trophées
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{user.total_points} pts</div>
                      <div className="text-sm text-gray-500">
                        {user.monthly_sales} ventes ce mois
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications de Gamification</CardTitle>
              <CardDescription>
                Historique des événements et notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-gray-600">{notification.message}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        {notification.points && (
                          <Badge variant={notification.points > 0 ? "default" : "destructive"}>
                            {notification.points > 0 ? '+' : ''}{notification.points} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune notification pour le moment
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 
