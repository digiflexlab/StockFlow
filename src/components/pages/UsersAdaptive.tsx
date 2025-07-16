import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users as UsersIcon, 
  Plus, 
  Edit,
  Search,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
  Activity,
  TrendingUp,
  Settings,
  Trash2,
  Eye,
  UserPlus,
  UserMinus,
  Clock,
  Calendar,
  Building2
} from 'lucide-react';
import { useUsersOptimized } from '@/hooks/useUsersOptimized';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';

// Composant d'accès refusé
const AccessDenied = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <div className="text-center space-y-4">
      <Shield className="h-16 w-16 text-red-500 mx-auto" />
      <h3 className="text-xl font-semibold text-gray-900">Accès refusé</h3>
      <p className="text-gray-600 max-w-md">{message}</p>
    </div>
  </div>
);

// Composant pour les métriques utilisateur
const UserMetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue",
  subtitle = "",
  trend = null
}: {
  title: string;
  value: number;
  icon: any;
  color?: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean } | null;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className={`h-4 w-4 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
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

// Composant pour la liste des utilisateurs
const UsersList = ({ 
  users, 
  getRoleLabel, 
  getRoleBadgeColor, 
  getInitials, 
  onEdit, 
  onDelete, 
  canEdit, 
  canDelete 
}: {
  users: any[];
  getRoleLabel: (role: string) => string;
  getRoleBadgeColor: (role: string) => string;
  getInitials: (name: string) => string;
  onEdit: (user: any) => void;
  onDelete: (userId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}) => (
  <div className="grid grid-cols-1 gap-4">
    {users.map((user) => (
      <Card key={user.id}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                  <Badge className={getRoleBadgeColor(user?.role)}>
                    {getRoleLabel(user?.role)}
                  </Badge>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{user.email}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                  {user.last_login && (
                    <span>Dernière connexion: {new Date(user.last_login).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <p className="text-gray-600">Magasins assignés:</p>
                <p className="font-medium">
                  {user.store_ids?.length > 0 ? `${user.store_ids.length} magasin(s)` : 'Aucun magasin'}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(user)}
                  disabled={!canEdit}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(user.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Composant pour l'activité récente
const RecentActivity = ({ activity }: { activity: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Activité récente
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {activity?.length > 0 ? (
          activity.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.userName}</p>
                <p className="text-sm text-gray-600">{item.action}</p>
                <p className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          ))
        ) : (
          <EmptyState 
            title="Aucune activité"
            description="Aucune activité récente à afficher"
            icon={Activity}
          />
        )}
      </div>
    </CardContent>
  </Card>
);

// Composant principal adaptatif
export const UsersAdaptive = () => {
  const {
    users,
    userStats,
    recentActivity,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    selectedStore,
    setSelectedStore,
    isCreating,
    isUpdating,
    isDeleting,
    context,
    messages,
    actions,
    canViewUsers,
    canViewAllUsers,
    canViewTeamUsers,
    canViewOwnProfile,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canManagePermissions,
    canViewActivity,
    createUser,
    updateUser,
    deleteUser,
    refreshData,
    getRoleLabel,
    getRoleBadgeColor,
    getInitials,
    availableRoles
  } = useUsersOptimized();

  // Vérification des permissions
  if (!canViewUsers) {
    return <AccessDenied message={messages.noAccessMessage} />;
  }

  // État de chargement
  if (isLoading) {
    return <LoadingSpinner message="Chargement des utilisateurs..." />;
  }

  // État d'erreur
  if (error) {
    return <ErrorState 
      title="Erreur de chargement"
      description="Impossible de charger les utilisateurs. Veuillez réessayer."
      onRetry={refreshData}
    />;
  }

  // Données non disponibles
  if (!users) {
    return <EmptyState 
      title="Aucune donnée"
      description={messages.noDataMessage}
      icon={UsersIcon}
    />;
  }

  // Gestionnaires d'actions
  const handleEditUser = (user: any) => {
    // À implémenter avec un modal d'édition
    console.log('Éditer utilisateur:', user);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      await deleteUser(userId);
    }
  };

  const handleCreateUser = () => {
    // À implémenter avec un modal de création
    console.log('Créer un nouvel utilisateur');
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
          
          {canCreateUsers && (
            <Button 
              onClick={handleCreateUser}
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques adaptatives */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <UserMetricCard
            title="Total utilisateurs"
            value={userStats.total}
            icon={UsersIcon}
            color="blue"
          />
          <UserMetricCard
            title="Utilisateurs actifs"
            value={userStats.active}
            icon={UserCheck}
            color="green"
            subtitle={`${((userStats.active / userStats.total) * 100).toFixed(1)}% du total`}
          />
          <UserMetricCard
            title="Nouveaux ce mois"
            value={userStats.newThisMonth}
            icon={UserPlus}
            color="purple"
          />
          <UserMetricCard
            title="Activité récente"
            value={userStats.recentActivity}
            icon={Activity}
            color="orange"
            subtitle="7 derniers jours"
          />
        </div>
      )}

      {/* Répartition par rôle */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UserMetricCard
            title="Administrateurs"
            value={userStats.byRole.admin}
            icon={Shield}
            color="red"
          />
          <UserMetricCard
            title="Gérants"
            value={userStats.byRole.manager}
            icon={Settings}
            color="blue"
          />
          <UserMetricCard
            title="Vendeurs"
            value={userStats.byRole.seller}
            icon={UsersIcon}
            color="green"
          />
        </div>
      )}

      {/* Onglets principaux */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            {messages.teamMessage}
          </TabsTrigger>
          {canViewActivity && (
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activité
            </TabsTrigger>
          )}
          {canManagePermissions && (
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filtres adaptatifs */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md h-12 bg-white"
                >
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {canViewAllUsers && (
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md h-12 bg-white"
                  >
                    <option value="all">Tous les magasins</option>
                    {/* Options de magasins à implémenter */}
                  </select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Liste des utilisateurs */}
          {users.length > 0 ? (
            <UsersList
              users={users}
              getRoleLabel={getRoleLabel}
              getRoleBadgeColor={getRoleBadgeColor}
              getInitials={getInitials}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              canEdit={canEditUsers}
              canDelete={canDeleteUsers}
            />
          ) : (
            <EmptyState 
              title="Aucun utilisateur trouvé"
              description={searchTerm ? 'Aucun utilisateur ne correspond à votre recherche.' : messages.noDataMessage}
              icon={UsersIcon}
            />
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <RecentActivity activity={recentActivity || []} />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Gestion des permissions</h3>
                <p className="text-gray-600">
                  Interface de gestion des permissions granulaires (à implémenter)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Indicateurs d'état */}
      {(isCreating || isUpdating || isDeleting) && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>
              {isCreating && "Création en cours..."}
              {isUpdating && "Mise à jour en cours..."}
              {isDeleting && "Suppression en cours..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 
