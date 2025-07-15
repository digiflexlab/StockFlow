import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Truck, 
  RotateCcw, 
  Plus,
  Settings,
  Shield,
  Building2,
  Package,
  ShoppingCart,
  FileText,
  CheckCircle
} from 'lucide-react';
import { UserModalEnhanced } from '@/components/modals/UserModalEnhanced';
import { TransferModal } from '@/components/modals/TransferModal';
import { ReturnModal } from '@/components/modals/ReturnModal';
import { toast } from '@/hooks/use-toast';

export const TestFormulaires = () => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Données de test
  const testUser = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'manager',
    store_ids: [1, 2],
    permissions: ['users:view', 'users:create', 'products:view', 'sales:view'],
    is_active: true,
    phone: '+221 77 123 4567',
    department: 'Ventes',
    notes: 'Manager expérimenté'
  };

  const handleUserSave = async (userData: any) => {
    console.log('Données utilisateur à sauvegarder:', userData);
    // Simulation d'une sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Utilisateur sauvegardé",
      description: "Les données ont été enregistrées avec succès",
    });
  };

  const handleTransferSave = async (transferData: any) => {
    console.log('Données de transfert à sauvegarder:', transferData);
    // Simulation d'une sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Transfert créé",
      description: "Le transfert a été enregistré avec succès",
    });
  };

  const handleReturnSave = async (returnData: any) => {
    console.log('Données de retour à sauvegarder:', returnData);
    // Simulation d'une sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Retour créé",
      description: "Le retour a été enregistré avec succès",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Test des Formulaires Améliorés</h1>
        <p className="text-gray-600">
          Testez les 3 formulaires critiques du système de gestion d'inventaire
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Test UserModal */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Gestion des Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Statut:</span>
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Amélioré
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priorité:</span>
                <Badge variant="destructive">Critique</Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <h4 className="font-medium">Fonctionnalités:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Gestion des permissions granulaires</li>
                <li>• Validation avancée des mots de passe</li>
                <li>• Attribution multi-magasins</li>
                <li>• Interface avec onglets</li>
                <li>• Indicateur de force du mot de passe</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => setIsUserModalOpen(true)}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tester UserModal
              </Button>
              <Button 
                onClick={() => setIsUserModalOpen(true)}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Modifier Utilisateur
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test TransferModal */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              Transferts Inter-Magasins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Statut:</span>
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Amélioré
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priorité:</span>
                <Badge variant="destructive">Critique</Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <h4 className="font-medium">Fonctionnalités:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Validation du stock en temps réel</li>
                <li>• Gestion des priorités</li>
                <li>• Recherche de produits</li>
                <li>• Calculs automatiques</li>
                <li>• Suivi des transferts</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => setIsTransferModalOpen(true)}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tester TransferModal
              </Button>
              <Button 
                onClick={() => setIsTransferModalOpen(true)}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Nouveau Transfert
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test ReturnModal */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-red-600" />
              Retours Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Statut:</span>
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Amélioré
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priorité:</span>
                <Badge variant="destructive">Critique</Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <h4 className="font-medium">Fonctionnalités:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Recherche de ventes</li>
                <li>• Gestion des états produits</li>
                <li>• Calculs de remboursement</li>
                <li>• Retours partiels/complets</li>
                <li>• Méthodes de remboursement</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => setIsReturnModalOpen(true)}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tester ReturnModal
              </Button>
              <Button 
                onClick={() => setIsReturnModalOpen(true)}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Nouveau Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résumé des améliorations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Résumé des Améliorations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Améliorations Techniques:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Validation avancée avec schémas TypeScript</li>
                <li>• Gestion d'état optimisée avec useMemo et useCallback</li>
                <li>• Interface utilisateur moderne et responsive</li>
                <li>• Gestion des erreurs et feedback utilisateur</li>
                <li>• Intégration avec les hooks existants</li>
                <li>• Permissions granulaires et sécurisées</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Améliorations UX:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Interface intuitive avec onglets et cartes</li>
                <li>• Recherche en temps réel</li>
                <li>• Calculs automatiques et validation</li>
                <li>• Indicateurs visuels de statut</li>
                <li>• Messages d'erreur contextuels</li>
                <li>• Boutons d'action avec états de chargement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Instructions d'Utilisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. UserModal Enhanced:</h4>
              <p className="text-sm text-gray-600">
                Testez la création et modification d'utilisateurs avec gestion des permissions, 
                validation des mots de passe, et attribution multi-magasins.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. TransferModal:</h4>
              <p className="text-sm text-gray-600">
                Testez les transferts entre magasins avec validation du stock, 
                gestion des priorités, et suivi des mouvements.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. ReturnModal:</h4>
              <p className="text-sm text-gray-600">
                Testez la gestion des retours clients avec recherche de ventes, 
                gestion des états produits, et calculs de remboursement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <UserModalEnhanced
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleUserSave}
        user={testUser}
        stores={[
          { id: 1, name: 'Magasin Principal' },
          { id: 2, name: 'Magasin Secondaire' },
          { id: 3, name: 'Magasin Tertiaire' }
        ]}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSave={handleTransferSave}
      />

      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSave={handleReturnSave}
      />
    </div>
  );
}; 