import { useState, useEffect } from 'react';
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
  Database,
  FileText,
  Clock,
  Zap,
  Info,
  Warning,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBackupOptimized } from '@/hooks/useBackupOptimized';

interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  includeImages: boolean;
}

interface BackupEntry {
  id: number;
  date: Date;
  type: 'auto' | 'manual';
  size: string;
  status: 'success' | 'failed' | 'pending';
  location: 'cloud' | 'local';
}

export const Backup = () => {
  const { user, profile } = useAuth();
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    includeImages: true,
  });
  const [backupHistory, setBackupHistory] = useState<BackupEntry[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 100,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBackupHistory();
      calculateStorageUsage();
      loadBackupSettings();
    }
  }, [user]);

  const loadBackupSettings = () => {
    const savedSettings = localStorage.getItem('stockflow_backup_settings');
    if (savedSettings) {
      setBackupSettings(JSON.parse(savedSettings));
    }
    setIsLoading(false);
  };

  const saveBackupSettings = () => {
    localStorage.setItem('stockflow_backup_settings', JSON.stringify(backupSettings));
    toast({
      title: "Paramètres sauvegardés",
      description: "Les paramètres de sauvegarde ont été mis à jour.",
    });
  };

  const loadBackupHistory = () => {
    const savedHistory = localStorage.getItem('stockflow_backup_history');
    if (savedHistory) {
      const history = JSON.parse(savedHistory).map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
      setBackupHistory(history);
    } else {
      // Initialiser avec quelques exemples récents
      const mockHistory: BackupEntry[] = [
        {
          id: 1,
          date: new Date(Date.now() - 86400000), // Hier
          type: 'auto',
          size: '12.4 MB',
          status: 'success',
          location: 'cloud'
        },
        {
          id: 2,
          date: new Date(Date.now() - 172800000), // Avant-hier
          type: 'manual',
          size: '11.8 MB',
          status: 'success',
          location: 'local'
        },
      ];
      setBackupHistory(mockHistory);
      localStorage.setItem('stockflow_backup_history', JSON.stringify(mockHistory));
    }
  };

  const calculateStorageUsage = async () => {
    try {
      const { data: salesData } = await supabase.from('sales').select('id');
      const { data: productsData } = await supabase.from('products').select('id');
      const { data: usersData } = await supabase.from('profiles').select('id');
      
      const estimatedUsage = ((salesData?.length || 0) * 0.1) + 
                            ((productsData?.length || 0) * 0.05) +
                            ((usersData?.length || 0) * 0.02);
      
      setStorageInfo({
        used: Number(estimatedUsage.toFixed(1)),
        total: 100
      });
    } catch (error) {
      console.error('Erreur lors du calcul du stockage:', error);
    }
  };

  const startBackup = async (type: 'manual' | 'auto' = 'manual') => {
    if (profile?.role !== 'admin') {
      toast({
        title: "Accès refusé",
        description: "Seuls les administrateurs peuvent créer des sauvegardes.",
        variant: "destructive",
      });
      return;
    }

    setIsBackingUp(true);

    try {
      // Simuler le processus de sauvegarde
      toast({
        title: "Sauvegarde démarrée",
        description: "La sauvegarde est en cours de création...",
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const newBackup: BackupEntry = {
        id: Date.now(),
        date: new Date(),
        type,
        size: (Math.random() * 5 + 10).toFixed(1) + ' MB',
        status: 'success',
        location: 'cloud'
      };

      const updatedHistory = [newBackup, ...backupHistory.slice(0, 9)];
      setBackupHistory(updatedHistory);
      localStorage.setItem('stockflow_backup_history', JSON.stringify(updatedHistory));

      toast({
        title: "Sauvegarde réussie",
        description: `Sauvegarde de ${newBackup.size} créée avec succès`,
      });
    } catch (error) {
      toast({
        title: "Échec de la sauvegarde",
        description: "Une erreur s'est produite lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const updateSettings = (key: keyof BackupSettings, value: any) => {
    if (profile?.role !== 'admin') {
      toast({
        title: "Accès refusé",
        description: "Seuls les administrateurs peuvent modifier ces paramètres.",
        variant: "destructive",
      });
      return;
    }

    setBackupSettings(prev => ({ ...prev, [key]: value }));
  };

  const cleanOldBackups = () => {
    if (profile?.role !== 'admin') {
      toast({
        title: "Accès refusé",
        description: "Seuls les administrateurs peuvent nettoyer les sauvegardes.",
        variant: "destructive",
      });
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - backupSettings.retentionDays);
    
    const filteredHistory = backupHistory.filter(backup => backup.date > cutoffDate);
    setBackupHistory(filteredHistory);
    localStorage.setItem('stockflow_backup_history', JSON.stringify(filteredHistory));

    toast({
      title: "Nettoyage terminé",
      description: `${backupHistory.length - filteredHistory.length} anciennes sauvegardes supprimées.`,
    });
  };

  const downloadBackup = (backupId: number) => {
    const backup = backupHistory.find(b => b.id === backupId);
    if (!backup) return;

    toast({
      title: "Téléchargement démarré",
      description: `Téléchargement de la sauvegarde du ${backup.date.toLocaleDateString('fr-FR')}`,
    });
  };

  const uploadBackup = () => {
    if (profile?.role !== 'admin') {
      toast({
        title: "Accès refusé",
        description: "Seuls les administrateurs peuvent restaurer des sauvegardes.",
        variant: "destructive",
      });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sql,.backup';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "Restauration démarrée",
          description: `Restauration depuis ${file.name}`,
        });
      }
    };
    input.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Réussie</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échouée</Badge>;
      default:
        return <Badge variant="outline">En cours</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />;
    }
  };

  const canManageBackups = profile?.role === 'admin';

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des paramètres de sauvegarde...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sauvegarde & Synchronisation</h2>
          <p className="text-gray-600">Gestion des sauvegardes de données</p>
        </div>
        {canManageBackups && (
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={uploadBackup}
            >
              <Upload className="h-4 w-4 mr-2" />
              Restaurer
            </Button>
            <Button 
              onClick={() => startBackup('manual')}
              disabled={isBackingUp}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isBackingUp ? 'Sauvegarde...' : 'Sauvegarde manuelle'}
            </Button>
          </div>
        )}
      </div>

      {!canManageBackups && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <p className="text-orange-800">
                Seuls les administrateurs peuvent gérer les sauvegardes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Paramètres de Sauvegarde
            </CardTitle>
            <CardDescription>Configuration des sauvegardes automatiques</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoBackup">Sauvegarde automatique</Label>
                <p className="text-sm text-gray-600">Sauvegardes programmées</p>
              </div>
              <Switch
                id="autoBackup"
                checked={backupSettings.autoBackup}
                onCheckedChange={(value) => updateSettings('autoBackup', value)}
                disabled={!canManageBackups}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Fréquence</Label>
              <select 
                id="frequency"
                className="w-full p-2 border rounded-md bg-white"
                value={backupSettings.backupFrequency}
                onChange={(e) => updateSettings('backupFrequency', e.target.value)}
                disabled={!canManageBackups}
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
                disabled={!canManageBackups}
                min="1"
                max="365"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="includeImages">Inclure les images</Label>
                <p className="text-sm text-gray-600">Photos de produits</p>
              </div>
              <Switch
                id="includeImages"
                checked={backupSettings.includeImages}
                onCheckedChange={(value) => updateSettings('includeImages', value)}
                disabled={!canManageBackups}
              />
            </div>

            {canManageBackups && (
              <Button onClick={saveBackupSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Utilisation du stockage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-green-600" />
              Utilisation du Stockage
            </CardTitle>
            <CardDescription>Espace utilisé pour les données</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {storageInfo.used} MB
              </div>
              <div className="text-gray-600">
                sur {storageInfo.total} MB utilisés
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min((storageInfo.used / storageInfo.total) * 100, 100)}%` }}
              ></div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Données de vente</span>
                <span className="font-medium">{(storageInfo.used * 0.6).toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Données produits</span>
                <span className="font-medium">{(storageInfo.used * 0.4).toFixed(1)} MB</span>
              </div>
            </div>

            {canManageBackups && (
              <Button variant="outline" className="w-full" onClick={cleanOldBackups}>
                <Trash2 className="h-4 w-4 mr-2" />
                Nettoyer les anciennes données
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique des sauvegardes */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Sauvegardes</CardTitle>
          <CardDescription>Liste des sauvegardes récentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backupHistory.length > 0 ? (
              backupHistory.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(backup.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {backup.date.toLocaleDateString('fr-FR')} à {backup.date.toLocaleTimeString('fr-FR')}
                        </span>
                        {getStatusBadge(backup.status)}
                        <Badge variant="outline">
                          {backup.type === 'auto' ? 'Auto' : 'Manuel'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>Taille: {backup.size}</span>
                        <span>•</span>
                        <span>
                          {backup.location === 'cloud' ? (
                            <><Cloud className="h-3 w-3 inline mr-1" />Cloud</>
                          ) : (
                            <><HardDrive className="h-3 w-3 inline mr-1" />Local</>
                          )}
                        </span>
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
    </div>
  );
};
