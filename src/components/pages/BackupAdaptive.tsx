import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  Cloud,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Settings,
  Trash2,
  Shield,
  Lock,
  Unlock,
  Database,
  FileText,
  Clock,
  Zap,
  Info,
  Warning,
  X
} from 'lucide-react';
import { useBackupOptimized } from '@/hooks/useBackupOptimized';
import { useAuth } from '@/hooks/useAuth';

interface RoleBasedMessages {
  title: string;
  description: string;
  permissions: string;
  actions: string[];
  tips: string[];
}

const ROLE_MESSAGES: Record<string, RoleBasedMessages> = {
  admin: {
    title: "Gestionnaire de Sauvegardes",
    description: "Contrôle complet des sauvegardes et de la sécurité des données",
    permissions: "Accès complet à toutes les fonctionnalités de sauvegarde",
    actions: [
      "Créer des sauvegardes manuelles et automatiques",
      "Configurer les paramètres de sécurité",
      "Restaurer des données depuis des sauvegardes",
      "Gérer l'historique et nettoyer les anciennes sauvegardes",
      "Exporter et importer des données"
    ],
    tips: [
      "Activez la sauvegarde automatique pour une protection continue",
      "Utilisez le chiffrement pour sécuriser vos données sensibles",
      "Planifiez des sauvegardes régulières selon vos besoins",
      "Surveillez l'utilisation du stockage pour éviter les dépassements"
    ]
  },
  manager: {
    title: "Surveillance des Sauvegardes",
    description: "Consultation et surveillance des sauvegardes système",
    permissions: "Accès en lecture seule aux sauvegardes",
    actions: [
      "Consulter l'historique des sauvegardes",
      "Voir les statistiques d'utilisation",
      "Surveiller l'état des sauvegardes automatiques",
      "Recevoir des notifications de statut"
    ],
    tips: [
      "Surveillez régulièrement l'état des sauvegardes automatiques",
      "Vérifiez l'espace de stockage disponible",
      "Contactez un administrateur en cas de problème",
      "Consultez les rapports de sauvegarde mensuels"
    ]
  },
  user: {
    title: "Informations de Sauvegarde",
    description: "Informations générales sur la protection des données",
    permissions: "Accès limité aux informations de base",
    actions: [
      "Consulter les informations de sécurité",
      "Voir les dernières sauvegardes effectuées",
      "Comprendre la politique de protection des données"
    ],
    tips: [
      "Vos données sont automatiquement sauvegardées",
      "Les sauvegardes sont chiffrées et sécurisées",
      "Contactez votre administrateur pour toute question",
      "Respectez les bonnes pratiques de sécurité"
    ]
  }
};

export const BackupAdaptive: React.FC = () => {
  const { profile } = useAuth();
  const {
    backupSettings,
    backupHistory,
    storageInfo,
    backupStats,
    isLoading,
    isBackingUp,
    isRestoring,
    error,
    updateSettings,
    saveSettings,
    startBackup,
    cancelBackup,
    downloadBackup,
    restoreBackup,
    deleteBackup,
    cleanOldBackups,
    refreshData,
    canManageBackups,
    canViewBackups,
    getBackupProgress,
    validateBackupFile
  } = useBackupOptimized();

  const userRole = profile?.role || 'user';
  const messages = ROLE_MESSAGES[userRole] || ROLE_MESSAGES.user;
  const backupProgress = getBackupProgress();

  // Gestion du fichier de restauration
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (validateBackupFile(file)) {
        restoreBackup(file);
      } else {
        alert('Fichier invalide. Veuillez sélectionner un fichier de sauvegarde valide.');
      }
    }
  };

  // Messages adaptatifs selon le statut
  const getStatusMessage = () => {
    if (isBackingUp) {
      return {
        title: "Sauvegarde en cours...",
        description: `Progression: ${backupProgress}%`,
        icon: <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />,
        variant: "default" as const
      };
    }
    if (isRestoring) {
      return {
        title: "Restauration en cours...",
        description: "Veuillez patienter pendant la restauration des données",
        icon: <Database className="h-5 w-5 animate-spin text-orange-600" />,
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
    if (backupStats.lastBackupDate) {
      const daysSinceLastBackup = Math.floor(
        (Date.now() - backupStats.lastBackupDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastBackup > 7) {
        return {
          title: "Sauvegarde recommandée",
          description: `Dernière sauvegarde il y a ${daysSinceLastBackup} jours`,
          icon: <Warning className="h-5 w-5 text-yellow-600" />,
          variant: "default" as const
        };
      }
    }
    return {
      title: "Système opérationnel",
      description: "Toutes les sauvegardes sont à jour",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      variant: "default" as const
    };
  };

  const statusMessage = getStatusMessage();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chargement des sauvegardes</h3>
              <p className="text-gray-600">Récupération des données de sauvegarde...</p>
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
            <Shield className="h-6 w-6 text-blue-600" />
            {messages.title}
          </h2>
          <p className="text-gray-600">{messages.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lock className="h-4 w-4" />
            <span>{messages.permissions}</span>
          </div>
        </div>
        
        {canManageBackups && (
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => document.getElementById('restore-file')?.click()}
              disabled={isRestoring}
            >
              <Upload className="h-4 w-4 mr-2" />
              Restaurer
            </Button>
            <Button 
              onClick={() => startBackup('manual')}
              disabled={isBackingUp || isRestoring}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isBackingUp ? 'Sauvegarde...' : 'Sauvegarde manuelle'}
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

      {/* Barre de progression pour la sauvegarde */}
      {isBackingUp && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Sauvegarde en cours...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="h-2" />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelBackup}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration adaptative */}
      {canManageBackups && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Paramètres de Sécurité
              </CardTitle>
              <CardDescription>Configuration avancée des sauvegardes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoBackup">Sauvegarde automatique</Label>
                  <p className="text-sm text-gray-600">Protection continue des données</p>
                </div>
                <Switch
                  id="autoBackup"
                  checked={backupSettings.autoBackup}
                  onCheckedChange={(value) => updateSettings('autoBackup', value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence de sauvegarde</Label>
                <select 
                  id="frequency"
                  className="w-full p-2 border rounded-md bg-white"
                  value={backupSettings.backupFrequency}
                  onChange={(e) => updateSettings('backupFrequency', e.target.value)}
                >
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention">Rétention (jours)</Label>
                <Input
                  id="retention"
                  type="number"
                  value={backupSettings.retentionDays}
                  onChange={(e) => updateSettings('retentionDays', parseInt(e.target.value) || 30)}
                  min="1"
                  max="365"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="encryption">Chiffrement</Label>
                  <p className="text-sm text-gray-600">Sécurisation des données</p>
                </div>
                <Switch
                  id="encryption"
                  checked={backupSettings.encryptionEnabled}
                  onCheckedChange={(value) => updateSettings('encryptionEnabled', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cloudSync">Synchronisation cloud</Label>
                  <p className="text-sm text-gray-600">Sauvegarde en ligne</p>
                </div>
                <Switch
                  id="cloudSync"
                  checked={backupSettings.cloudSync}
                  onCheckedChange={(value) => updateSettings('cloudSync', value)}
                />
              </div>

              <Button onClick={saveSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder la configuration
              </Button>
            </CardContent>
          </Card>

          {/* Statistiques d'utilisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-green-600" />
                Utilisation du Stockage
              </CardTitle>
              <CardDescription>Analyse détaillée de l'espace utilisé</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {(storageInfo.used / (1024 * 1024)).toFixed(1)} MB
                </div>
                <div className="text-gray-600">
                  sur {(storageInfo.total / (1024 * 1024)).toFixed(0)} MB utilisés
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((storageInfo.used / storageInfo.total) * 100, 100)}%` }}
                ></div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Données de vente</span>
                  <span className="font-medium">{(storageInfo.breakdown.sales / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produits</span>
                  <span className="font-medium">{(storageInfo.breakdown.products / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Utilisateurs</span>
                  <span className="font-medium">{(storageInfo.breakdown.users / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Images</span>
                  <span className="font-medium">{(storageInfo.breakdown.images / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={cleanOldBackups}>
                <Trash2 className="h-4 w-4 mr-2" />
                Nettoyer les anciennes données
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques générales */}
      {canViewBackups && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Statistiques des Sauvegardes
            </CardTitle>
            <CardDescription>Vue d'ensemble de l'activité de sauvegarde</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{backupStats.totalBackups}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{backupStats.successfulBackups}</div>
                <div className="text-sm text-gray-600">Réussies</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{backupStats.failedBackups}</div>
                <div className="text-sm text-gray-600">Échouées</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {backupStats.averageSize > 0 ? (backupStats.averageSize / (1024 * 1024)).toFixed(1) : '0'} MB
                </div>
                <div className="text-sm text-gray-600">Taille moyenne</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des sauvegardes */}
      {canViewBackups && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Historique des Sauvegardes
            </CardTitle>
            <CardDescription>Liste des sauvegardes récentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {backupHistory.length > 0 ? (
                backupHistory.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {backup.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : backup.status === 'failed' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {backup.date.toLocaleDateString('fr-FR')} à {backup.date.toLocaleTimeString('fr-FR')}
                          </span>
                          <Badge className={
                            backup.status === 'success' ? 'bg-green-100 text-green-800' :
                            backup.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {backup.status === 'success' ? 'Réussie' : 
                             backup.status === 'failed' ? 'Échouée' : 'En cours'}
                          </Badge>
                          <Badge variant="outline">
                            {backup.type === 'auto' ? 'Auto' : 
                             backup.type === 'scheduled' ? 'Programmée' : 'Manuel'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>Taille: {(backup.size / (1024 * 1024)).toFixed(1)} MB</span>
                          <span>•</span>
                          <span>
                            {backup.location === 'cloud' ? (
                              <><Cloud className="h-3 w-3 inline mr-1" />Cloud</>
                            ) : backup.location === 'hybrid' ? (
                              <><Zap className="h-3 w-3 inline mr-1" />Hybride</>
                            ) : (
                              <><HardDrive className="h-3 w-3 inline mr-1" />Local</>
                            )}
                          </span>
                          {backup.recordCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{backup.recordCount.toLocaleString()} enregistrements</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {backup.status === 'success' && canManageBackups && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => downloadBackup(backup.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteBackup(backup.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Save className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune sauvegarde disponible</p>
                  {canManageBackups && (
                    <Button 
                      className="mt-4" 
                      onClick={() => startBackup('manual')}
                      disabled={isBackingUp}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Créer une sauvegarde
                    </Button>
                  )}
                </div>
              )}
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
          <ul className="space-y-2">
            {messages.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Input caché pour la restauration */}
      <input
        id="restore-file"
        type="file"
        accept=".sql,.backup,.zip,.tar.gz"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}; 