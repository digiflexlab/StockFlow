
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { UserModal } from '@/components/modals/UserModal';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';

// Messages adaptatifs selon les rôles
const getRoleBasedMessages = (role: string) => {
  const messages = {
    admin: {
      title: 'Gestion Globale des Utilisateurs',
      description: 'Gestion complète de tous les utilisateurs du système',
      subtitle: 'Créez, modifiez et gérez les utilisateurs et leurs permissions',
      noDataMessage: 'Aucun utilisateur dans le système',
      createMessage: 'Création d\'un nouvel utilisateur...',
      updateMessage: 'Mise à jour de l\'utilisateur...',
      deleteMessage: 'Suppression de l\'utilisateur...',
      noAccessMessage: 'Accès non autorisé à la gestion des utilisateurs',
      teamMessage: 'Tous les utilisateurs du système'
    },
    manager: {
      title: 'Gestion de l\'Équipe',
      description: 'Gestion de votre équipe et des utilisateurs assignés',
      subtitle: 'Supervisez votre équipe et gérez leurs permissions',
      noDataMessage: 'Aucun membre dans votre équipe',
      createMessage: 'Ajout d\'un membre à l\'équipe...',
      updateMessage: 'Mise à jour du membre...',
      deleteMessage: 'Retrait du membre...',
      noAccessMessage: 'Accès non autorisé à la gestion des utilisateurs',
      teamMessage: 'Votre équipe'
    },
    seller: {
      title: 'Mon Profil',
      description: 'Gestion de votre profil personnel',
      subtitle: 'Modifiez vos informations et préférences',
      noDataMessage: 'Aucune information de profil disponible',
      createMessage: 'Création du profil...',
      updateMessage: 'Mise à jour du profil...',
      deleteMessage: 'Suppression du profil...',
      noAccessMessage: 'Accès non autorisé à la gestion des utilisateurs',
      teamMessage: 'Mon profil'
    }
  };

  return messages[role as keyof typeof messages] || messages.seller;
};

// Types d'actions adaptatifs selon les rôles
const getRoleBasedActions = (role: string) => {
  const baseActions = [
    { id: 'view', label: 'Voir', icon: Eye, roles: ['admin', 'manager', 'seller'] },
    { id: 'edit', label: 'Modifier', icon: Edit, roles: ['admin', 'manager', 'seller'] },
  ];

  if (role === 'admin') {
    baseActions.push(
      { id: 'create', label: 'Créer', icon: Plus, roles: ['admin'] },
      { id: 'delete', label: 'Supprimer', icon: Trash2, roles: ['admin'] },
      { id: 'permissions', label: 'Permissions', icon: Shield, roles: ['admin'] },
      { id: 'activity', label: 'Activité', icon: Activity, roles: ['admin'] }
    );
  }

  if (role === 'manager') {
    baseActions.push(
      { id: 'team', label: 'Équipe', icon: UsersIcon, roles: ['manager'] },
      { id: 'performance', label: 'Performance', icon: TrendingUp, roles: ['manager'] }
    );
  }

  return baseActions.filter(action => action.roles.includes(role));
};

// Composant d'accès refusé
const AccessDenied = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <div className="text-center space-y-4">
      <Shield className="h-16 w-16 text-red-500 mx-auto" />
      <h3 className="text-xl font-semibold text-gray-900">Accès restreint</h3>
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
    <CardContent className="p-6 text-center">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-1 justify-center">
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

export const Users = ({ user }) => {
  const { profile } = useAuth();
  const { isAdmin, isManager, isSeller, canCreateUsers, canEditUsers, canDeleteUsers } = useUserRoles();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Messages adaptatifs
  const messages = useMemo(() => getRoleBasedMessages(profile?.role || 'seller'), [profile?.role]);

  // Types d'actions adaptatifs
  const actions = useMemo(() => getRoleBasedActions(profile?.role || 'seller'), [profile?.role]);

  // Permissions adaptatives
  const canViewUsers = isAdmin || isManager || isSeller;
  const canViewAllUsers = isAdmin;
  const canViewTeamUsers = isManager;
  const canViewOwnProfile = isSeller;

  useEffect(() => {
    if (canViewUsers) {
      loadUsers();
      if (canViewAllUsers) {
        loadStores();
      }
    } else {
      setIsLoading(false);
    }
  }, [profile, canViewUsers, canViewAllUsers]);

  const loadUsers = async () => {
    try {
      let usersQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrage selon les permissions
      if (!canViewAllUsers) {
        if (canViewTeamUsers) {
          // Managers voient leur équipe (utilisateurs des magasins assignés)
          usersQuery = usersQuery.in('store_ids', profile?.store_ids || []);
        } else if (canViewOwnProfile) {
          // Sellers voient seulement leur profil
          usersQuery = usersQuery.eq('id', profile?.id);
        }
      }

      const { data, error } = await usersQuery;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setError('Impossible de charger les utilisateurs.');
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des magasins:', error);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        // Mise à jour
        const { error } = await supabase
          .from('profiles')
          .update({
            name: userData.name,
            email: userData.email,
            role: userData.role,
            store_ids: userData.storeIds || [],
            permissions: userData.permissions || [],
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: "Utilisateur mis à jour",
          description: messages.updateMessage,
        });
      } else {
        // Création - nécessite l'inscription via Supabase Auth
        toast({
          title: "Information",
          description: "La création d'utilisateurs doit être faite via le système d'authentification.",
          variant: "default",
        });
      }

      await loadUsers();
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    toast({
      title: "Actualisation",
      description: "Actualisation des données utilisateurs...",
    });
    await loadUsers();
    setIsRefreshing(false);
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: 'Administrateur',
      manager: 'Gérant',
      seller: 'Vendeur'
    };
    return roleLabels[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      seller: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUserStores = (storeIds) => {
    if (!storeIds || storeIds.length === 0) return 'Tous les magasins';
    return storeIds.map(id => stores.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'Magasins non assignés';
  };

  // Calcul des statistiques
  const userStats = useMemo(() => {
    if (!users.length) return null;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: users.length,
      active: users.filter(u => u.is_active !== false).length,
      inactive: users.filter(u => u.is_active === false).length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        manager: users.filter(u => u.role === 'manager').length,
        seller: users.filter(u => u.role === 'seller').length
      },
      newThisMonth: users.filter(u => new Date(u.created_at) >= thisMonth).length,
      recentActivity: users.filter(u => 
        u.last_login && new Date(u.last_login) >= sevenDaysAgo
      ).length
    };
  }, [users]);

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
      description={error}
      onRetry={loadUsers}
    />;
  }

  // Données non disponibles
  if (!users.length) {
    return <EmptyState 
      title="Aucune donnée"
      description={messages.noDataMessage}
      icon={UsersIcon}
    />;
  }

  const availableRoles = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'admin', label: 'Administrateurs' },
    { value: 'manager', label: 'Gérants' },
    { value: 'seller', label: 'Vendeurs' }
  ];

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
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          {canCreateUsers && (
            <Button 
              onClick={() => setIsUserModalOpen(true)}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 h-12"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques adaptatives */}
      {userStats && (
        <>
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

          {/* Répartition par rôle */}
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
        </>
      )}

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
      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{u.name}</h3>
                      <Badge className={getRoleBadgeColor(u.role)}>
                        {getRoleLabel(u.role)}
                      </Badge>
                      <Badge variant={u.is_active !== false ? "default" : "secondary"}>
                        {u.is_active !== false ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{u.email}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Créé le {new Date(u.created_at).toLocaleDateString('fr-FR')}</span>
                      {u.last_login && (
                        <span>Dernière connexion: {new Date(u.last_login).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-sm">
                    <p className="text-gray-600">Magasins assignés:</p>
                    <p className="font-medium">{getUserStores(u.store_ids)}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {canEditUsers && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(u);
                          setIsUserModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteUsers && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                            // Implémenter la suppression
                            console.log('Supprimer utilisateur:', u.id);
                          }
                        }}
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

      {filteredUsers.length === 0 && (
        <EmptyState 
          title="Aucun utilisateur trouvé"
          description={searchTerm ? 'Aucun utilisateur ne correspond à votre recherche.' : messages.noDataMessage}
          icon={UsersIcon}
        />
      )}

      {/* Modal de création/édition d'utilisateur */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        user={editingUser}
        stores={stores}
      />
    </div>
  );
};
