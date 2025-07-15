import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Shield, 
  Palette, 
  Bell, 
  Database, 
  Key, 
  Save, 
  RotateCcw, 
  Package, 
  Users, 
  Lock, 
  UserCheck,
  Crown,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Activity,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Zap,
  Globe,
  Clock,
  Mail,
  Smartphone
} from 'lucide-react';
import { useAdminConfigOptimized } from '@/hooks/useAdminConfigOptimized';
import { useAuth } from '@/hooks/useAuth';
import { StatsGrid } from '@/components/common/StatsGrid';
import { FilterSelect } from '@/components/common/FilterSelect';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PERMISSION_CATEGORIES, CURRENCY_OPTIONS, USER_ROLES } from '@/utils/constants';
import { getRoleLabel, getRoleBadgeColor } from '@/utils/helpers';

interface RoleBasedMessages {
  title: string;
  description: string;
  permissions: string;
  actions: string[];
  tips: string[];
  warnings: string[];
}

const ROLE_MESSAGES: Record<string, RoleBasedMessages> = {
  admin: {
    title: "Configuration Système Avancée",
    description: "Contrôle complet de la configuration et des permissions système",
    permissions: "Accès complet à toutes les fonctionnalités d'administration",
    actions: [
      "Gérer les utilisateurs et leurs rôles",
      "Configurer les permissions granulaires",
      "Modifier les paramètres système",
      "Surveiller les statistiques système",
      "Gérer la sécurité et les notifications"
    ],
    tips: [
      "Vérifiez régulièrement les permissions utilisateur",
      "Surveillez les tentatives de connexion suspectes",
      "Maintenez les paramètres de sécurité à jour",
      "Documentez les changements de configuration"
    ],
    warnings: [
      "Les modifications de rôles sont irréversibles",
      "Certaines configurations peuvent affecter tous les utilisateurs",
      "Sauvegardez avant les modifications importantes"
    ]
  },
  manager: {
    title: "Surveillance Système",
    description: "Consultation et surveillance des paramètres système",
    permissions: "Accès en lecture seule aux configurations",
    actions: [
      "Consulter les statistiques système",
      "Voir les utilisateurs actifs",
      "Surveiller les performances",
      "Recevoir les alertes système"
    ],
    tips: [
      "Surveillez régulièrement les statistiques",
      "Signalez les anomalies à l'administrateur",
      "Vérifiez l'état des utilisateurs",
      "Consultez les rapports de performance"
    ],
    warnings: [
      "Vous ne pouvez pas modifier les configurations",
      "Contactez un administrateur pour les changements"
    ]
  },
  user: {
    title: "Informations Système",
    description: "Informations générales sur le système",
    permissions: "Accès limité aux informations de base",
    actions: [
      "Voir les informations générales",
      "Consulter les paramètres de base",
      "Comprendre les politiques système"
    ],
    tips: [
      "Respectez les politiques de sécurité",
      "Contactez votre administrateur pour toute question",
      "Signalez les problèmes techniques"
    ],
    warnings: [
      "Accès restreint aux fonctionnalités avancées"
    ]
  }
};

export const AdminConfigAdaptive: React.FC = () => {
  const { profile } = useAuth();
  const {
    users,
    systemStats,
    systemConfig,
    permissions,
    settings,
    isLoading,
    isUpdating,
    error,
    updateUserRole,
    updateUserStatus,
    updatePermission,
    updateSystemConfig,
    updateSettings,
    refreshData,
    canManageUsers,
    canManagePermissions,
    canManageSystemConfig,
    getUserPermissions,
    validateRoleChange,
    getConfigValue
  } = useAdminConfigOptimized();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const userRole = profile?.role || 'user';
  const messages = ROLE_MESSAGES[userRole] || ROLE_MESSAGES.user;

  // Messages adaptatifs selon le statut
  const getStatusMessage = () => {
    if (isLoading) {
      return {
        title: "Chargement en cours...",
        description: "Récupération des données de configuration",
        icon: <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />,
        variant: "default" as const
      };
    }
    if (isUpdating) {
      return {
        title: "Mise à jour en cours...",
        description: "Sauvegarde des modifications",
        icon: <Save className="h-5 w-5 animate-spin text-green-600" />,
        variant: "default" as const
      };
    }
    if (error) {
      return {
        title: "Erreur détectée",
        description: error,
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        variant: "destructive" as const
      };
    }
    if (systemStats.lowStockProducts > 0) {
      return {
        title: "Attention requise",
        description: `${systemStats.lowStockProducts} produits en stock faible`,
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        variant: "default" as const
      };
    }
    return {
      title: "Système opérationnel",
      description: "Toutes les configurations sont à jour",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      variant: "default" as const
    };
  };

  const statusMessage = getStatusMessage();

  // Validation des modifications
  const handleUserRoleChange = async (userId: string, newRole: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const validationError = validateRoleChange(user.role, newRole);
    if (validationError) {
      alert(validationError);
      return;
    }

    await updateUserRole(userId, newRole);
  };

  // Gestion des permissions
  const handlePermissionChange = async (userId: string, permissionType: string, permissionKey: string, isGranted: boolean) => {
    await updatePermission(userId, permissionType, permissionKey, isGranted);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chargement de la configuration</h3>
              <p className="text-gray-600">Récupération des données système...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête adaptatif */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="h-6 w-6 text-blue-600" />
            {messages.title}
          </h2>
          <p className="text-gray-600">{messages.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>{messages.permissions}</span>
          </div>
        </div>
        
        {canManageSystemConfig && (
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={refreshData}
              disabled={isUpdating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button 
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              variant="outline"
            >
              {showAdvancedSettings ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showAdvancedSettings ? 'Masquer' : 'Avancé'}
            </Button>
          </div>
        )}
      </div>

      {/* Message de statut adaptatif */}
      <Card className={`border-l-4 ${
        statusMessage.variant === 'destructive' ? 'border-red-500 bg-red-50' :
        statusMessage.variant === 'default' ? 'border-blue-500 bg-blue-50' :
        'border-green-500 bg-green-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {statusMessage.icon}
            <div className="flex-1">
              <h4 className="font-medium">{statusMessage.title}</h4>
              <p className="text-sm text-gray-600">{statusMessage.description}</p>
            </div>
            {error && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshData()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Barre de progression pour les mises à jour */}
      {isUpdating && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Mise à jour en cours...</span>
                <span>Sauvegarde des modifications</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques système améliorées */}
      {canManageSystemConfig && (
        <StatsGrid
          stats={[
            {
              icon: Users,
              value: systemStats.totalUsers,
              label: 'Utilisateurs',
              color: 'text-blue-600',
              subtitle: `${systemStats.activeUsers} actifs`
            },
            {
              icon: Package,
              value: systemStats.totalProducts,
              label: 'Produits',
              color: 'text-green-600',
              subtitle: `${systemStats.lowStockProducts} en stock faible`
            },
            {
              icon: Database,
              value: systemStats.totalSales,
              label: 'Ventes',
              color: 'text-purple-600',
              subtitle: `${systemStats.averageOrderValue.toFixed(0)} FCFA moyenne`
            },
            {
              icon: TrendingUp,
              value: systemStats.totalRevenue.toLocaleString(),
              label: 'Revenus',
              color: 'text-orange-600',
              subtitle: 'Total des ventes'
            }
          ]}
        />
      )}

      {/* Onglets de navigation adaptatifs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'general', label: 'Général', icon: Settings, visible: true },
          { key: 'permissions', label: 'Permissions', icon: UserCheck, visible: canManagePermissions },
          { key: 'users', label: 'Utilisateurs', icon: Users, visible: canManageUsers },
          { key: 'security', label: 'Sécurité', icon: Shield, visible: canManageSystemConfig },
          { key: 'advanced', label: 'Avancé', icon: Zap, visible: showAdvancedSettings && canManageSystemConfig }
        ].filter(tab => tab.visible).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.key 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres généraux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-blue-600" />
                Paramètres généraux
              </CardTitle>
              <CardDescription>Configuration de base du système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de l'entreprise</Label>
                <Input
                  value={settings.general.companyName}
                  onChange={(e) => updateSettings('general', 'companyName', e.target.value)}
                  disabled={!canManageSystemConfig}
                />
              </div>
              <div className="space-y-2">
                <Label>Devise par défaut</Label>
                <FilterSelect
                  value={settings.general.defaultCurrency}
                  onChange={(value) => updateSettings('general', 'defaultCurrency', value)}
                  options={CURRENCY_OPTIONS.map(currency => ({
                    value: currency.value,
                    label: currency.label
                  }))}
                  placeholder="Sélectionner une devise"
                  disabled={!canManageSystemConfig}
                />
              </div>
              <div className="space-y-2">
                <Label>Langue</Label>
                <FilterSelect
                  value={settings.general.language}
                  onChange={(value) => updateSettings('general', 'language', value)}
                  options={[
                    { value: 'fr', label: 'Français' },
                    { value: 'en', label: 'English' }
                  ]}
                  placeholder="Sélectionner une langue"
                  disabled={!canManageSystemConfig}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fonctionnalités */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Fonctionnalités
              </CardTitle>
              <CardDescription>Activation des modules système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Module de vente</Label>
                  <p className="text-sm text-gray-500">Gestion des ventes et transactions</p>
                </div>
                <Switch
                  checked={settings.features.enableSalesModule}
                  onCheckedChange={(checked) => updateSettings('features', 'enableSalesModule', checked)}
                  disabled={!canManageSystemConfig}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Module de retours</Label>
                  <p className="text-sm text-gray-500">Gestion des retours et remboursements</p>
                </div>
                <Switch
                  checked={settings.features.enableReturnsModule}
                  onCheckedChange={(checked) => updateSettings('features', 'enableReturnsModule', checked)}
                  disabled={!canManageSystemConfig}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Multi-magasins</Label>
                  <p className="text-sm text-gray-500">Gestion de plusieurs points de vente</p>
                </div>
                <Switch
                  checked={settings.features.enableMultiStore}
                  onCheckedChange={(checked) => updateSettings('features', 'enableMultiStore', checked)}
                  disabled={!canManageSystemConfig}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Journal d'audit</Label>
                  <p className="text-sm text-gray-500">Traçabilité des actions utilisateur</p>
                </div>
                <Switch
                  checked={settings.features.enableAuditLog}
                  onCheckedChange={(checked) => updateSettings('features', 'enableAuditLog', checked)}
                  disabled={!canManageSystemConfig}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'permissions' && canManagePermissions && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
                Gestion des permissions granulaires
              </CardTitle>
              <CardDescription>
                Définissez des permissions spécifiques pour chaque utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Sélectionner un utilisateur</Label>
                  <select
                    value={selectedUser || ''}
                    onChange={(e) => setSelectedUser(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Choisir un utilisateur...</option>
                    {users.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {getRoleLabel(user.role)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUser && (
                  <div className="space-y-6 mt-6">
                    {PERMISSION_CATEGORIES.map(category => (
                      <Card key={category.key}>
                        <CardHeader>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.permissions.map(permission => (
                              <div key={permission.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <Label className="text-sm">{permission.name}</Label>
                                <Switch
                                  checked={getUserPermissions(selectedUser).find(p => 
                                    p.permission_type === category.key && p.permission_key === permission.key
                                  )?.is_granted || false}
                                  onCheckedChange={(checked) => handlePermissionChange(selectedUser, category.key, permission.key, checked)}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && canManageUsers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Gestion des utilisateurs
            </CardTitle>
            <CardDescription>Gérez les utilisateurs et leurs rôles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-xs text-gray-500">
                        Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="role" value={getRoleLabel(user.role)} />
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FilterSelect
                      value={user.role}
                      onChange={(value) => handleUserRoleChange(user.id, value)}
                      options={[
                        { value: USER_ROLES.ADMIN, label: 'Admin' },
                        { value: USER_ROLES.MANAGER, label: 'Manager' },
                        { value: USER_ROLES.SELLER, label: 'Vendeur' }
                      ]}
                      placeholder="Sélectionner un rôle"
                      className="text-xs px-2 py-1"
                    />
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(checked) => updateUserStatus(user.id, checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && canManageSystemConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Paramètres de sécurité
              </CardTitle>
              <CardDescription>Configuration de la sécurité système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Authentification à deux facteurs</Label>
                  <p className="text-sm text-gray-500">Sécurité renforcée</p>
                </div>
                <Switch
                  checked={settings.security.requireTwoFactor}
                  onCheckedChange={(checked) => updateSettings('security', 'requireTwoFactor', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label>Timeout de session (secondes)</Label>
                <Input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value) || 3600)}
                  min="300"
                  max="86400"
                />
              </div>
              <div className="space-y-2">
                <Label>Tentatives de connexion max</Label>
                <Input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value) || 5)}
                  min="1"
                  max="10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Notifications
              </CardTitle>
              <CardDescription>Configuration des alertes système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-gray-500">Alertes importantes par email</p>
                </div>
                <Switch
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => updateSettings('notifications', 'emailNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications SMS</Label>
                  <p className="text-sm text-gray-500">Alertes par SMS</p>
                </div>
                <Switch
                  checked={settings.notifications.smsNotifications}
                  onCheckedChange={(checked) => updateSettings('notifications', 'smsNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Alertes de stock faible</Label>
                  <p className="text-sm text-gray-500">Notifications automatiques</p>
                </div>
                <Switch
                  checked={settings.notifications.lowStockAlerts}
                  onCheckedChange={(checked) => updateSettings('notifications', 'lowStockAlerts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'advanced' && showAdvancedSettings && canManageSystemConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Paramètres avancés
            </CardTitle>
            <CardDescription>Configuration système avancée</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fuseau horaire</Label>
                <Input
                  value={settings.general.timezone}
                  onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Format de date</Label>
                <Input
                  value={settings.general.dateFormat}
                  onChange={(e) => updateSettings('general', 'dateFormat', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Suppression de produits autorisée</Label>
                <p className="text-sm text-gray-500">Permettre la suppression définitive</p>
              </div>
              <Switch
                checked={settings.features.allowProductDeletion}
                onCheckedChange={(checked) => updateSettings('features', 'allowProductDeletion', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Liste blanche IP</Label>
                <p className="text-sm text-gray-500">Restreindre l'accès par IP</p>
              </div>
              <Switch
                checked={settings.security.enableIpWhitelist}
                onCheckedChange={(checked) => updateSettings('security', 'enableIpWhitelist', checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conseils adaptatifs */}
      <Card className="border-l-4 border-blue-500 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Conseils pour {userRole === 'admin' ? 'l\'administrateur' : userRole === 'manager' ? 'le gestionnaire' : 'l\'utilisateur'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Actions recommandées :</h4>
              <ul className="space-y-1">
                {messages.actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Conseils :</h4>
              <ul className="space-y-1">
                {messages.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            {messages.warnings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-orange-700">Avertissements :</h4>
                <ul className="space-y-1">
                  {messages.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-orange-700">{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 