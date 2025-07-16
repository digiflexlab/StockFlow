import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Award, 
  Star, 
  TrendingUp, 
  Target, 
  Users, 
  Crown,
  Medal,
  Zap,
  Fire,
  Diamond,
  Gold,
  Silver,
  Bronze,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Settings,
  BarChart3,
  Gift,
  Sparkles
} from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { usePendingValidation } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const UserProfileGamified = () => {
  const { profile } = useAuth();
  const {
    userGamification,
    leaderboard,
    notifications,
    stats,
    userLoading,
    addPoints,
    markNotificationAsRead
  } = useGamification();

  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const isPending = usePendingValidation(profile);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-yellow-700 font-semibold">Votre inscription est en attente de validation par un administrateur.</p>
          <p className="text-gray-500 mt-2">Vous recevrez un email dès que votre compte sera activé.</p>
        </div>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!userGamification) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Profil de gamification non trouvé</p>
        </div>
      </div>
    );
  }

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'bronze': return <Bronze className="h-4 w-4" />;
      case 'silver': return <Silver className="h-4 w-4" />;
      case 'gold': return <Gold className="h-4 w-4" />;
      case 'diamond': return <Diamond className="h-4 w-4" />;
      case 'platinum': return <Crown className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'bronze': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'diamond': return 'bg-blue-100 text-blue-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête du profil */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={userGamification.current_avatar} alt={profile?.name} />
            <AvatarFallback className="text-2xl">
              {profile?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
            <p className="text-gray-600">{profile?.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Trophy className="h-3 w-3" />
                <span>Niveau {userGamification.current_level}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{userGamification.total_points} points</span>
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {notifications.length}
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {showNotifications && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications ({notifications.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune nouvelle notification</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {notification.type === 'badge' && <Award className="h-5 w-5 text-yellow-600" />}
                        {notification.type === 'achievement' && <Trophy className="h-5 w-5 text-blue-600" />}
                        {notification.type === 'level_up' && <TrendingUp className="h-5 w-5 text-green-600" />}
                        {notification.type === 'daily_goal' && <Target className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="achievements">Réalisations</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Classement</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Niveau actuel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Niveau Actuel</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {stats?.currentLevel?.name || 'Débutant'}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {stats?.currentLevel?.description || 'Niveau de base'}
                  </p>
                  {stats?.nextLevel && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progression</span>
                        <span>{Math.round(stats.progressToNextLevel)}%</span>
                      </div>
                      <Progress value={stats.progressToNextLevel} className="h-2" />
                      <p className="text-xs text-gray-500 mt-2">
                        {userGamification.total_points - (stats.currentLevel?.required_points || 0)} / 
                        {(stats.nextLevel?.required_points || 0) - (stats.currentLevel?.required_points || 0)} points
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Points totaux */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span>Points Totaux</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {userGamification.total_points.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Points cumulés</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Classement</span>
                      <span className="font-medium">#{stats?.rank || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Badges</span>
                      <span className="font-medium">{stats?.totalBadges}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Réalisations</span>
                      <span className="font-medium">{stats?.totalAchievements}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Objectifs quotidiens */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>Objectifs Quotidiens</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userGamification.daily_goals?.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{goal.goal_type.replace('_', ' ')}</span>
                        <span className="font-medium">
                          {goal.current_value} / {goal.target_value}
                        </span>
                      </div>
                      <Progress 
                        value={(goal.current_value / goal.target_value) * 100} 
                        className="h-2" 
                      />
                      {goal.is_completed && (
                        <div className="flex items-center space-x-1 text-green-600 text-xs">
                          <CheckCircle className="h-3 w-3" />
                          <span>Objectif atteint ! +{goal.points_earned} points</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Avantages du niveau */}
          {stats?.currentLevel?.benefits && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5 text-green-600" />
                  <span>Avantages du Niveau {userGamification.current_level}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.currentLevel.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Réalisations */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Réalisations ({userGamification.achievements?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userGamification.achievements?.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune réalisation encore</p>
                  <p className="text-sm text-gray-400 mt-2">Continuez à performer pour débloquer des réalisations !</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userGamification.achievements.map((achievement) => (
                    <div key={achievement.id} className="border rounded-lg p-4 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Trophy className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-sm mb-1">{achievement.achievement_name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{achievement.achievement_description}</p>
                      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                        <Star className="h-3 w-3" />
                        <span>+{achievement.points_earned} points</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Badges ({userGamification.badges?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userGamification.badges?.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun badge encore</p>
                  <p className="text-sm text-gray-400 mt-2">Gagnez des points pour débloquer des badges !</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userGamification.badges.map((badge) => (
                    <div key={badge.id} className="border rounded-lg p-4 text-center">
                      <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                        {getBadgeIcon(badge.badge_type)}
                      </div>
                      <h4 className="font-medium text-sm mb-1">{badge.badge_name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{badge.badge_description}</p>
                      <Badge className={getBadgeColor(badge.badge_type)}>
                        {badge.badge_type.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classement */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5" />
                <span>Classement des Meilleurs Vendeurs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.user_id === profile?.id 
                        ? 'bg-blue-50 border-2 border-blue-200' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {index === 0 && <Crown className="h-5 w-5 text-yellow-600" />}
                        {index === 1 && <Medal className="h-5 w-5 text-gray-600" />}
                        {index === 2 && <Medal className="h-5 w-5 text-amber-600" />}
                        <span className="font-bold text-lg">#{entry.rank}</span>
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.user_avatar} alt={entry.user_name} />
                        <AvatarFallback>{entry.user_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{entry.user_name}</p>
                        <p className="text-sm text-gray-600">Niveau {entry.current_level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.total_points.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistiques */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Statistiques mensuelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Statistiques Mensuelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Ventes totales</span>
                    <span className="font-medium">{userGamification.monthly_stats?.total_sales || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Montant total</span>
                    <span className="font-medium">{(userGamification.monthly_stats?.total_amount || 0).toLocaleString()} XOF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Produits vendus</span>
                    <span className="font-medium">{userGamification.monthly_stats?.total_products_sold || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Satisfaction client</span>
                    <span className="font-medium">{(userGamification.monthly_stats?.average_satisfaction || 0).toFixed(1)}/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points du mois */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Points du Mois</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Points gagnés</span>
                    <span className="font-medium text-green-600">+{userGamification.monthly_stats?.total_points_earned || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points perdus</span>
                    <span className="font-medium text-red-600">-{Math.abs(userGamification.monthly_stats?.total_points_lost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points nets</span>
                    <span className="font-medium">{userGamification.monthly_stats?.net_points || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Classement</span>
                    <span className="font-medium">#{userGamification.monthly_stats?.rank || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 
