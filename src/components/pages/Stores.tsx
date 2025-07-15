
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  Edit,
  ArrowRightLeft,
  MapPin,
  Phone,
  Mail,
  Search,
  Users,
  TrendingUp,
  AlertCircle,
  Settings,
  Eye,
  Clock,
  BarChart3
} from 'lucide-react';
import { StoreModal } from '@/components/modals/StoreModal';
import { TransferModal } from '@/components/modals/TransferModal';
import { LowStockAlert } from '@/components/alerts/LowStockAlert';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/formatters';

export const Stores = () => {
  const { user, profile } = useAuth();
  const { canCreateStores, canEditStores } = usePermissions();
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false);

  useEffect(() => {
    if (user) {
      loadStores();
    }
  }, [user]);

  // Contexte utilisateur pour adaptation automatique
  const userContext = useMemo(() => {
    const role = profile?.role || 'seller';
    const storeIds = profile?.store_ids || [];
    const storeCount = storeIds.length;
    
    return {
      role,
      storeIds,
      storeCount,
      permissions: profile?.permissions || [],
      isManager: role === 'manager',
      isSeller: role === 'seller',
      isAdmin: role === 'admin',
    };
  }, [profile]);

  // Contenu adaptatif selon le rôle
  const roleContent = useMemo(() => {
    const { role, storeCount } = userContext;
    
    switch (role) {
      case 'seller':
        return {
          title: `Mes Magasins - ${storeCount} magasin${storeCount > 1 ? 's' : ''}`,
          subtitle: 'Accédez aux informations de vos magasins assignés',
          quickActions: ['Voir mes magasins', 'Statistiques', 'Contact', 'Historique'],
          canCreate: false,
          canEdit: false,
          canDelete: false
        };
      case 'manager':
        return {
          title: `Gestion des Magasins - ${storeCount} magasin${storeCount > 1 ? 's' : ''}`,
          subtitle: 'Supervisez vos magasins et gérez votre équipe',
          quickActions: ['Nouveau magasin', 'Gestion équipe', 'Rapports', 'Configuration'],
          canCreate: true,
          canEdit: true,
          canDelete: false
        };
      case 'admin':
        return {
          title: 'Gestion Globale des Magasins',
          subtitle: 'Vue d\'ensemble de tous les magasins du système',
          quickActions: ['Nouveau magasin', 'Configuration', 'Rapports globaux', 'Audit'],
          canCreate: true,
          canEdit: true,
          canDelete: true
        };
      default:
        return {
          title: 'Gestion des Magasins',
          subtitle: 'Gérez vos magasins',
          quickActions: ['Nouveau magasin'],
          canCreate: false,
          canEdit: false,
          canDelete: false
        };
    }
  }, [userContext]);

  // Message personnalisé selon le rôle
  const getPersonalizedMessage = () => {
    const { role, storeCount } = userContext;
    const timeOfDay = new Date().getHours();
    let greeting = '';
    
    if (timeOfDay < 12) greeting = 'Bonjour';
    else if (timeOfDay < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';
    
    switch (role) {
      case 'seller':
        return `${greeting} ! Accédez aux informations de vos ${storeCount} magasin${storeCount > 1 ? 's' : ''} assigné${storeCount > 1 ? 's' : ''}.`;
      case 'manager':
        return `${greeting} ! Gérez vos ${storeCount} magasin${storeCount > 1 ? 's' : ''} et supervisez votre équipe.`;
      case 'admin':
        return `${greeting} ! Vue d'ensemble de tous les magasins du système.`;
      default:
        return `${greeting} !`;
    }
  };

  const loadStores = async () => {
    try {
      let query = supabase.from('stores').select('*');
      
      // Filtrer selon les permissions de l'utilisateur
      if (profile?.role === 'manager' && profile?.store_ids?.length > 0) {
        query = query.in('id', profile.store_ids);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des magasins:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les magasins.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStoreStatus = async (storeId) => {
    if (!canEditStores) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour modifier les magasins.",
        variant: "destructive",
      });
      return;
    }

    try {
      const store = stores.find(s => s.id === storeId);
      if (!store) return;

      const { error } = await supabase
        .from('stores')
        .update({ 
          is_active: !store.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      if (error) throw error;

      // Mettre à jour l'état local immédiatement
      setStores(prevStores => 
        prevStores.map(s => 
          s.id === storeId 
            ? { ...s, is_active: !s.is_active }
            : s
        )
      );
      
      toast({
        title: store.is_active ? "Magasin désactivé" : "Magasin activé",
        description: `${store.name} a été ${store.is_active ? 'désactivé' : 'activé'}.`,
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du changement de statut.",
        variant: "destructive",
      });
    }
  };

  const handleCloseStoreModal = () => {
    setIsStoreModalOpen(false);
    setEditingStore(null);
  };

  // Actions rapides selon le rôle
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Nouveau magasin':
        setIsStoreModalOpen(true);
        break;
      case 'Gestion équipe':
        setShowEmployeeManagement(true);
        break;
      case 'Voir mes magasins':
      case 'Statistiques':
      case 'Contact':
      case 'Historique':
      case 'Rapports':
      case 'Configuration':
      case 'Rapports globaux':
      case 'Audit':
        toast({
          title: "Fonctionnalité à venir",
          description: `La fonctionnalité "${action}" sera bientôt disponible.`,
        });
        break;
      default:
        console.log(`Action: ${action}`);
    }
  };

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Chargement des magasins...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Alerte stock faible */}
      <LowStockAlert />

      {/* En-tête adaptatif */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">{roleContent.title}</h2>
            <p className="text-gray-600">{roleContent.subtitle}</p>
            <p className="text-sm text-blue-600 font-medium">
              {getPersonalizedMessage()}
            </p>
          </div>
          <div className="flex gap-3">
            {stores.length >= 2 && (
              <Button 
                onClick={() => setIsTransferModalOpen(true)}
                variant="outline"
                className="h-12"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfert de stock
              </Button>
            )}
            {canCreateStores && (
              <Button 
                onClick={() => setIsStoreModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 h-12"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau magasin
              </Button>
            )}
          </div>
        </div>

        {/* Actions rapides selon le rôle */}
        <div className="flex flex-wrap gap-3">
          {roleContent.quickActions.map((action) => {
            const getActionIcon = (action: string) => {
              switch (action) {
                case 'Voir mes magasins': return Eye;
                case 'Statistiques': return BarChart3;
                case 'Contact': return Phone;
                case 'Historique': return Clock;
                case 'Nouveau magasin': return Plus;
                case 'Gestion équipe': return Users;
                case 'Rapports': return BarChart3;
                case 'Configuration': return Settings;
                case 'Rapports globaux': return BarChart3;
                case 'Audit': return Eye;
                default: return Plus;
              }
            };

            const Icon = getActionIcon(action);
            
            return (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {action}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un magasin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des magasins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStores.map((store) => (
          <Card key={store.id} className={`${!store.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    {store.name}
                  </CardTitle>
                  <CardDescription>
                    Créé le {new Date(store.created_at).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={store.is_active ? "default" : "secondary"}>
                    {store.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                  {canEditStores && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingStore(store);
                        setIsStoreModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Informations de contact */}
                <div className="space-y-2">
                  {store.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{store.address}</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{store.phone}</span>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{store.email}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canEditStores && (
                  <div className="pt-4 border-t flex gap-2">
                    <Button
                      variant={store.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleStoreStatus(store.id)}
                    >
                      {store.is_active ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* État vide */}
      {filteredStores.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Aucun magasin trouvé' : 'Aucun magasin'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Aucun magasin ne correspond à votre recherche.'
                : profile?.role === 'admin' 
                  ? 'Commencez par créer votre premier magasin.' 
                  : 'Aucun magasin n\'est assigné à votre compte.'}
            </p>
            {canCreateStores && !searchTerm && (
              <Button onClick={() => setIsStoreModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un magasin
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistiques rapides */}
      {stores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{stores.filter(s => s.is_active).length}</div>
              <p className="text-sm text-gray-600">Magasins actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-900">{stores.length}</div>
              <p className="text-sm text-gray-600">Total magasins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stores.filter(s => s.manager_id).length}
              </div>
              <p className="text-sm text-gray-600">Magasins avec responsable</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={handleCloseStoreModal}
        store={editingStore}
      />

      {/* Gestion des employés pour les managers et admins */}
      {showEmployeeManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Gestion des employés
              </CardTitle>
              <CardDescription>
                Gérez les employés de vos magasins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-center py-8 text-gray-500">
                  Interface de gestion des employés à implémenter
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Fonctionnalités à venir</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Liste des employés par magasin</li>
                      <li>• Gestion des rôles et permissions</li>
                      <li>• Historique des performances</li>
                      <li>• Planification des horaires</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Statistiques</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Nombre d'employés: 0</li>
                      <li>• Employés actifs: 0</li>
                      <li>• Performance moyenne: 0%</li>
                      <li>• Taux de rotation: 0%</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEmployeeManagement(false)}
                >
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        stores={stores.filter(s => s.is_active)}
      />
    </div>
  );
};
