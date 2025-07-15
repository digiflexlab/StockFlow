import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  Package, 
  Building2, 
  Truck,
  Calculator,
  Play,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Store,
  User
} from 'lucide-react';
import { PurchaseOrderModal } from '@/components/modals/PurchaseOrderModal';
import { toast } from '@/hooks/use-toast';

export const PurchaseOrderTest = () => {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<number | null>(null);

  const testCases = [
    {
      id: 1,
      title: "Cas 1 : Nouveau Produit TECNO",
      description: "Achat de 14 TECNO à 40,000 XOF l'unité - Nouveau produit pour le magasin JOJO",
      scenario: {
        supplier: "MOLO",
        product: "TECNO",
        quantity: 14,
        purchasePrice: 40000,
        minSalePrice: 50000,
        store: "JOJO",
        isNewProduct: true
      },
      steps: [
        "Sélectionner le fournisseur MOLO",
        "Ajouter un nouvel article TECNO",
        "Définir le prix d'achat: 40,000 XOF",
        "Définir le prix de vente minimum: 50,000 XOF",
        "Allouer 14 unités au magasin JOJO",
        "Enregistrer la commande"
      ],
      expectedResult: "Produit TECNO créé et disponible en vente au magasin JOJO"
    },
    {
      id: 2,
      title: "Cas 2 : Réapprovisionnement Multi-Magasins",
      description: "Achat de 30 TECNO à 35,000 XOF - 20 pour JOJO, 10 pour SOSO",
      scenario: {
        supplier: "Nouveau fournisseur",
        product: "TECNO",
        quantity: 30,
        purchasePrice: 35000,
        minSalePrice: 55000,
        stores: [
          { name: "JOJO", quantity: 20 },
          { name: "SOSO", quantity: 10 }
        ],
        isNewProduct: false
      },
      steps: [
        "Sélectionner le nouveau fournisseur",
        "Rechercher le produit TECNO existant",
        "Définir le nouveau prix d'achat: 35,000 XOF",
        "Définir le nouveau prix de vente minimum: 55,000 XOF",
        "Allouer 20 unités au magasin JOJO",
        "Allouer 10 unités au magasin SOSO",
        "Enregistrer la commande"
      ],
      expectedResult: "Stock mis à jour dans les deux magasins avec nouveaux prix"
    },
    {
      id: 3,
      title: "Cas 3 : Réapprovisionnement SOSO",
      description: "Achat de 15 TECNO à 45,000 XOF pour SOSO (reste 2 en stock)",
      scenario: {
        supplier: "MOLO",
        product: "TECNO",
        quantity: 15,
        purchasePrice: 45000,
        minSalePrice: 60000,
        store: "SOSO",
        currentStock: 2,
        isNewProduct: false
      },
      steps: [
        "Sélectionner le fournisseur MOLO",
        "Rechercher le produit TECNO existant",
        "Définir le prix d'achat: 45,000 XOF",
        "Définir le prix de vente minimum: 60,000 XOF",
        "Allouer 15 unités au magasin SOSO",
        "Enregistrer la commande"
      ],
      expectedResult: "Stock SOSO mis à jour: 2 + 15 = 17 unités avec nouveau prix"
    }
  ];

  const handleCaseSelect = (caseId: number) => {
    setSelectedCase(caseId);
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseSuccess = () => {
    toast({
      title: "Succès",
      description: `Cas ${selectedCase} traité avec succès !`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Étude de Cas - Système d'Achat</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Test des 3 scénarios d'achat et de gestion de stock pour démontrer 
          la capacité du système à gérer les nouveaux produits et les réapprovisionnements.
        </p>
      </div>

      {/* Cas de test */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {testCases.map((testCase) => (
          <Card key={testCase.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{testCase.title}</CardTitle>
                <Badge variant={testCase.id === selectedCase ? "default" : "secondary"}>
                  Cas {testCase.id}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{testCase.description}</p>

              {/* Scénario */}
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Scénario</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div><strong>Fournisseur:</strong> {testCase.scenario.supplier}</div>
                  <div><strong>Produit:</strong> {testCase.scenario.product}</div>
                  <div><strong>Quantité:</strong> {testCase.scenario.quantity} unités</div>
                  <div><strong>Prix d'achat:</strong> {testCase.scenario.purchasePrice.toLocaleString()} XOF</div>
                  <div><strong>Prix de vente min:</strong> {testCase.scenario.minSalePrice.toLocaleString()} XOF</div>
                  {testCase.scenario.stores ? (
                    <div><strong>Magasins:</strong> {testCase.scenario.stores.map(s => `${s.name} (${s.quantity})`).join(', ')}</div>
                  ) : (
                    <div><strong>Magasin:</strong> {testCase.scenario.store}</div>
                  )}
                  {testCase.scenario.currentStock && (
                    <div><strong>Stock actuel:</strong> {testCase.scenario.currentStock} unités</div>
                  )}
                </div>
              </div>

              {/* Étapes */}
              <div>
                <h4 className="font-medium mb-2">Étapes à suivre</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  {testCase.steps.map((step, index) => (
                    <li key={index} className="text-gray-700">{step}</li>
                  ))}
                </ol>
              </div>

              {/* Résultat attendu */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Résultat attendu:</strong> {testCase.expectedResult}
                </AlertDescription>
              </Alert>

              {/* Bouton de test */}
              <Button 
                onClick={() => handleCaseSelect(testCase.id)}
                className="w-full"
                variant={testCase.id === selectedCase ? "default" : "outline"}
              >
                <Play className="h-4 w-4 mr-2" />
                Tester ce cas
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guide d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Guide d'Utilisation du Système d'Achat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Fonctionnalités Principales</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Création automatique de nouveaux produits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Gestion multi-magasins
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Calculs automatiques des coûts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Mise à jour automatique du stock
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Historique des mouvements de stock
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">Avantages du Système</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Réduction des erreurs de saisie
                </li>
                <li className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-600" />
                  Gestion centralisée des achats
                </li>
                <li className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Traçabilité complète
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  Optimisation des coûts
                </li>
                <li className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Interface intuitive
                </li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note importante:</strong> Le système gère automatiquement la création de produits, 
              la mise à jour des prix et l'allocation du stock selon les spécifications de chaque magasin.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Modal d'achat */}
      <PurchaseOrderModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setSelectedCase(null);
        }}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  );
}; 