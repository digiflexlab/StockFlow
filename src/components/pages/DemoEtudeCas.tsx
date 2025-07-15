import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
  User,
  ArrowRight,
  Clock,
  TrendingUp,
  Database,
  FileText,
  Zap
} from 'lucide-react';
import { PurchaseOrderModal } from '@/components/modals/PurchaseOrderModal';
import { toast } from '@/hooks/use-toast';

interface DemoStep {
  id: number;
  title: string;
  description: string;
  action: string;
  status: 'pending' | 'completed' | 'current';
  data?: any;
}

interface DemoCase {
  id: number;
  title: string;
  description: string;
  scenario: {
    supplier: string;
    product: string;
    quantity: number;
    purchasePrice: number;
    minSalePrice: number;
    stores: Array<{ name: string; quantity: number; currentStock?: number }>;
    isNewProduct: boolean;
  };
  steps: DemoStep[];
  expectedResults: string[];
  currentStep: number;
  isCompleted: boolean;
}

export const DemoEtudeCas = () => {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DemoCase | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [demoData, setDemoData] = useState({
    products: [
      { id: 1, name: 'TECNO', sku: 'TECNO-001', category_id: 1, supplier_id: 1, purchase_price: 40000, min_sale_price: 50000, current_price: 50000 }
    ],
    suppliers: [
      { id: 1, name: 'MOLO', contact_person: 'M. Molo', phone: '+221 77 123 4567' },
      { id: 2, name: 'Nouveau Fournisseur', contact_person: 'M. Nouveau', phone: '+221 77 987 6543' }
    ],
    stores: [
      { id: 1, name: 'JOJO', address: 'Dakar, Sénégal' },
      { id: 2, name: 'SOSO', address: 'Thiès, Sénégal' }
    ],
    stock: [
      { product_id: 1, store_id: 1, quantity: 0, min_threshold: 5 },
      { product_id: 1, store_id: 2, quantity: 2, min_threshold: 5 }
    ]
  });

  const demoCases: DemoCase[] = [
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
        stores: [{ name: "JOJO", quantity: 14 }],
        isNewProduct: true
      },
      steps: [
        {
          id: 1,
          title: "Sélection du Fournisseur",
          description: "Choisir le fournisseur MOLO pour l'achat",
          action: "Sélectionner MOLO dans la liste des fournisseurs",
          status: 'pending'
        },
        {
          id: 2,
          title: "Création du Nouveau Produit",
          description: "Créer le produit TECNO qui n'existe pas encore",
          action: "Ajouter un nouvel article avec les informations TECNO",
          status: 'pending'
        },
        {
          id: 3,
          title: "Configuration des Prix",
          description: "Définir le prix d'achat et le prix de vente minimum",
          action: "Prix d'achat: 40,000 XOF, Prix de vente min: 50,000 XOF",
          status: 'pending'
        },
        {
          id: 4,
          title: "Allocation au Magasin JOJO",
          description: "Allouer les 14 unités au magasin JOJO",
          action: "Assigner 14 unités au magasin JOJO",
          status: 'pending'
        },
        {
          id: 5,
          title: "Enregistrement de la Commande",
          description: "Valider et enregistrer la commande d'achat",
          action: "Cliquer sur 'Enregistrer la Commande'",
          status: 'pending'
        }
      ],
      expectedResults: [
        "Produit TECNO créé dans la base de données",
        "Stock de 14 unités disponible au magasin JOJO",
        "Prix de vente minimum configuré à 50,000 XOF",
        "Produit disponible pour les ventes immédiatement"
      ],
      currentStep: 0,
      isCompleted: false
    },
    {
      id: 2,
      title: "Cas 2 : Réapprovisionnement Multi-Magasins",
      description: "Achat de 30 TECNO à 35,000 XOF - 20 pour JOJO, 10 pour SOSO",
      scenario: {
        supplier: "Nouveau Fournisseur",
        product: "TECNO",
        quantity: 30,
        purchasePrice: 35000,
        minSalePrice: 55000,
        stores: [
          { name: "JOJO", quantity: 20, currentStock: 14 },
          { name: "SOSO", quantity: 10, currentStock: 0 }
        ],
        isNewProduct: false
      },
      steps: [
        {
          id: 1,
          title: "Sélection du Nouveau Fournisseur",
          description: "Choisir le nouveau fournisseur pour l'achat",
          action: "Sélectionner le nouveau fournisseur dans la liste",
          status: 'pending'
        },
        {
          id: 2,
          title: "Recherche du Produit Existant",
          description: "Trouver le produit TECNO déjà en base",
          action: "Rechercher 'TECNO' dans la liste des produits",
          status: 'pending'
        },
        {
          id: 3,
          title: "Mise à Jour des Prix",
          description: "Modifier les prix d'achat et de vente",
          action: "Prix d'achat: 35,000 XOF, Prix de vente min: 55,000 XOF",
          status: 'pending'
        },
        {
          id: 4,
          title: "Allocation Multi-Magasins",
          description: "Répartir les 30 unités entre JOJO et SOSO",
          action: "20 unités pour JOJO, 10 unités pour SOSO",
          status: 'pending'
        },
        {
          id: 5,
          title: "Enregistrement de la Commande",
          description: "Valider et enregistrer la commande d'achat",
          action: "Cliquer sur 'Enregistrer la Commande'",
          status: 'pending'
        }
      ],
      expectedResults: [
        "Stock JOJO mis à jour: 14 + 20 = 34 unités",
        "Stock SOSO créé: 10 unités",
        "Prix de vente minimum mis à jour: 55,000 XOF",
        "Prix d'achat mis à jour: 35,000 XOF"
      ],
      currentStep: 0,
      isCompleted: false
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
        stores: [
          { name: "SOSO", quantity: 15, currentStock: 2 }
        ],
        isNewProduct: false
      },
      steps: [
        {
          id: 1,
          title: "Sélection du Fournisseur MOLO",
          description: "Choisir le fournisseur MOLO pour l'achat",
          action: "Sélectionner MOLO dans la liste des fournisseurs",
          status: 'pending'
        },
        {
          id: 2,
          title: "Recherche du Produit TECNO",
          description: "Trouver le produit TECNO existant",
          action: "Rechercher 'TECNO' dans la liste des produits",
          status: 'pending'
        },
        {
          id: 3,
          title: "Mise à Jour des Prix",
          description: "Modifier les prix d'achat et de vente",
          action: "Prix d'achat: 45,000 XOF, Prix de vente min: 60,000 XOF",
          status: 'pending'
        },
        {
          id: 4,
          title: "Allocation au Magasin SOSO",
          description: "Allouer les 15 unités au magasin SOSO",
          action: "Assigner 15 unités au magasin SOSO",
          status: 'pending'
        },
        {
          id: 5,
          title: "Enregistrement de la Commande",
          description: "Valider et enregistrer la commande d'achat",
          action: "Cliquer sur 'Enregistrer la Commande'",
          status: 'pending'
        }
      ],
      expectedResults: [
        "Stock SOSO mis à jour: 2 + 15 = 17 unités",
        "Prix de vente minimum mis à jour: 60,000 XOF",
        "Prix d'achat mis à jour: 45,000 XOF",
        "Traçabilité complète des mouvements"
      ],
      currentStep: 0,
      isCompleted: false
    }
  ];

  const [cases, setCases] = useState<DemoCase[]>(demoCases);

  const handleCaseSelect = (demoCase: DemoCase) => {
    setSelectedCase(demoCase);
    setCurrentStepIndex(0);
    setIsPurchaseModalOpen(true);
  };

  const handleStepComplete = (caseId: number, stepId: number) => {
    setCases(prevCases => 
      prevCases.map(demoCase => {
        if (demoCase.id === caseId) {
          const updatedSteps = demoCase.steps.map(step => {
            if (step.id === stepId) {
              return { ...step, status: 'completed' as const };
            }
            if (step.id === stepId + 1) {
              return { ...step, status: 'current' as const };
            }
            return step;
          });

          const isCompleted = updatedSteps.every(step => step.status === 'completed');

          return {
            ...demoCase,
            steps: updatedSteps,
            currentStep: demoCase.currentStep + 1,
            isCompleted
          };
        }
        return demoCase;
      })
    );
  };

  const handlePurchaseSuccess = () => {
    if (selectedCase) {
      // Marquer toutes les étapes comme complétées
      setCases(prevCases => 
        prevCases.map(demoCase => {
          if (demoCase.id === selectedCase.id) {
            const updatedSteps = demoCase.steps.map(step => ({
              ...step,
              status: 'completed' as const
            }));

            return {
              ...demoCase,
              steps: updatedSteps,
              isCompleted: true
            };
          }
          return demoCase;
        })
      );

      toast({
        title: "Démonstration Réussie !",
        description: `Cas ${selectedCase.id} : ${selectedCase.title} - Toutes les étapes ont été complétées avec succès.`,
      });
    }
  };

  const getProgressPercentage = (demoCase: DemoCase) => {
    const completedSteps = demoCase.steps.filter(step => step.status === 'completed').length;
    return (completedSteps / demoCase.steps.length) * 100;
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Démonstration Interactive - Étude de Cas</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Cette démonstration vous guide à travers les 3 cas d'usage de votre étude de cas, 
          montrant comment le système d'achat gère efficacement les nouveaux produits et les réapprovisionnements.
        </p>
      </div>

      {/* Cas de démonstration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {cases.map((demoCase) => (
          <Card key={demoCase.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{demoCase.title}</CardTitle>
                <Badge variant={demoCase.isCompleted ? "default" : "secondary"}>
                  {demoCase.isCompleted ? "Terminé" : "En cours"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{demoCase.description}</p>

              {/* Progression */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression</span>
                  <span>{Math.round(getProgressPercentage(demoCase))}%</span>
                </div>
                <Progress value={getProgressPercentage(demoCase)} className="h-2" />
              </div>

              {/* Scénario */}
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Scénario</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div><strong>Fournisseur:</strong> {demoCase.scenario.supplier}</div>
                  <div><strong>Produit:</strong> {demoCase.scenario.product}</div>
                  <div><strong>Quantité:</strong> {demoCase.scenario.quantity} unités</div>
                  <div><strong>Prix d'achat:</strong> {demoCase.scenario.purchasePrice.toLocaleString()} XOF</div>
                  <div><strong>Prix de vente min:</strong> {demoCase.scenario.minSalePrice.toLocaleString()} XOF</div>
                  <div><strong>Magasins:</strong> {demoCase.scenario.stores.map(s => `${s.name} (${s.quantity})`).join(', ')}</div>
                </div>
              </div>

              {/* Étapes */}
              <div>
                <h4 className="font-medium mb-2">Étapes ({demoCase.steps.filter(s => s.status === 'completed').length}/{demoCase.steps.length})</h4>
                <div className="space-y-2">
                  {demoCase.steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      {step.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : step.status === 'current' ? (
                        <Clock className="h-4 w-4 text-blue-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={step.status === 'completed' ? 'text-green-700' : step.status === 'current' ? 'text-blue-700' : 'text-gray-500'}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Résultats attendus */}
              <div>
                <h4 className="font-medium mb-2">Résultats Attendus</h4>
                <ul className="text-sm space-y-1">
                  {demoCase.expectedResults.map((result, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      {result}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bouton de démonstration */}
              <Button 
                onClick={() => handleCaseSelect(demoCase)}
                className="w-full"
                variant={demoCase.isCompleted ? "outline" : "default"}
                disabled={demoCase.isCompleted}
              >
                <Play className="h-4 w-4 mr-2" />
                {demoCase.isCompleted ? "Démonstration Terminée" : "Lancer la Démonstration"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guide d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Guide de la Démonstration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Comment Procéder</h4>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">1</span>
                  <span>Sélectionnez un cas d'usage à tester</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">2</span>
                  <span>Suivez les étapes guidées dans le modal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">3</span>
                  <span>Remplissez les informations selon le scénario</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">4</span>
                  <span>Validez et enregistrez la commande</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">5</span>
                  <span>Vérifiez les résultats automatiques</span>
                </li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-3">Fonctionnalités Démonstrées</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-600" />
                  Création automatique de nouveaux produits
                </li>
                <li className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-green-600" />
                  Gestion multi-magasins
                </li>
                <li className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-green-600" />
                  Calculs automatiques des coûts
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Mise à jour des prix
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  Traitement en temps réel
                </li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note importante:</strong> Cette démonstration utilise des données simulées. 
              Dans un environnement de production, les données seraient persistées en base de données 
              et synchronisées en temps réel avec le système de gestion de stock.
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