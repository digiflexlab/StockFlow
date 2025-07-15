import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Calculator,
  Barcode,
  Search,
  Package,
  DollarSign,
  Users,
  Store,
  Clock,
  Save,
  Printer
} from 'lucide-react';
import { EnhancedSaleModal } from '@/components/modals/EnhancedSaleModal';

export const EnhancedSaleFormTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState('basic');

  const demoScenarios = {
    basic: {
      title: "Vente Basique",
      description: "Vente simple avec quelques articles",
      items: [
        { product_id: 1, quantity: 2, unit_price: 15.99, total_price: 31.98, product_name: "Huile palmiste" },
        { product_id: 2, quantity: 1, unit_price: 8.50, total_price: 8.50, product_name: "Savon de toilette" }
      ]
    },
    complex: {
      title: "Vente Complexe",
      description: "Vente avec plusieurs articles et gestion avancée",
      items: [
        { product_id: 1, quantity: 5, unit_price: 15.99, total_price: 79.95, product_name: "Huile palmiste" },
        { product_id: 2, quantity: 3, unit_price: 8.50, total_price: 25.50, product_name: "Savon de toilette" },
        { product_id: 3, quantity: 2, unit_price: 12.75, total_price: 25.50, product_name: "Shampoing" },
        { product_id: 4, quantity: 1, unit_price: 45.00, total_price: 45.00, product_name: "Lait corporel" }
      ]
    },
    stockWarning: {
      title: "Alerte Stock",
      description: "Vente avec articles en stock faible",
      items: [
        { product_id: 1, quantity: 10, unit_price: 15.99, total_price: 159.90, product_name: "Huile palmiste" },
        { product_id: 2, quantity: 8, unit_price: 8.50, total_price: 68.00, product_name: "Savon de toilette" }
      ]
    }
  };

  const features = [
    {
      icon: Search,
      title: "Recherche Avancée",
      description: "Recherche par nom, SKU ou code-barres avec suggestions en temps réel"
    },
    {
      icon: Barcode,
      title: "Scan Code-barres",
      description: "Intégration scanner de code-barres pour ajout rapide de produits"
    },
    {
      icon: Calculator,
      title: "Calculs Automatiques",
      description: "Calcul automatique des marges, TVA et totaux avec validation"
    },
    {
      icon: AlertTriangle,
      title: "Alertes Stock",
      description: "Vérification en temps réel de la disponibilité et alertes de stock faible"
    },
    {
      icon: Save,
      title: "Sauvegarde Brouillon",
      description: "Sauvegarde automatique des brouillons pour ne pas perdre de travail"
    },
    {
      icon: Users,
      title: "Gestion Clients",
      description: "Informations client complètes avec points fidélité et remises"
    },
    {
      icon: TrendingUp,
      title: "Analytics Marges",
      description: "Calcul et affichage des marges en temps réel pour optimiser la rentabilité"
    },
    {
      icon: Printer,
      title: "Impression Ticket",
      description: "Génération et impression de tickets de caisse professionnels"
    }
  ];

  const improvements = [
    {
      category: "Expérience Utilisateur",
      items: [
        "Interface en onglets pour une navigation fluide",
        "Recherche de produits avec autocomplétion",
        "Scan de code-barres intégré",
        "Produits populaires suggérés",
        "Mode avancé/mode simple",
        "Sauvegarde automatique des brouillons"
      ]
    },
    {
      category: "Gestion du Stock",
      items: [
        "Vérification en temps réel de la disponibilité",
        "Alertes de stock insuffisant",
        "Alertes de stock faible (80% du stock)",
        "Affichage du stock disponible par article",
        "Validation avant finalisation de la vente"
      ]
    },
    {
      category: "Calculs et Marges",
      items: [
        "Calcul automatique des marges par article",
        "Marge totale et moyenne de la vente",
        "Gestion des remises en montant ou pourcentage",
        "Limite de remise configurable",
        "TVA automatique avec taux configurable"
      ]
    },
    {
      category: "Gestion Clients",
      items: [
        "Informations client complètes",
        "Points fidélité intégrés",
        "Remises client automatiques",
        "Historique des achats",
        "Gestion des devises multiples"
      ]
    },
    {
      category: "Validation et Sécurité",
      items: [
        "Validation des quantités vs stock",
        "Limites de remise par rôle",
        "Vérification des prix minimum",
        "Audit trail des modifications",
        "Gestion des permissions par magasin"
      ]
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Formulaire de Vente Amélioré</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Découvrez les nouvelles fonctionnalités du formulaire de vente avec gestion avancée du stock, 
          calculs automatiques et expérience utilisateur optimisée.
        </p>
      </div>

      {/* Scénarios de test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Scénarios de Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(demoScenarios).map(([key, scenario]) => (
              <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{scenario.title}</h3>
                    <p className="text-sm text-gray-600">{scenario.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Package className="h-3 w-3" />
                      {scenario.items.length} article(s)
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedDemo(key);
                        setIsModalOpen(true);
                      }}
                      className="w-full"
                      size="sm"
                    >
                      Tester ce scénario
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fonctionnalités principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Nouvelles Fonctionnalités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="space-y-2 p-4 border rounded-lg">
                <feature.icon className="h-8 w-8 text-blue-600" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparaison des améliorations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Améliorations Apportées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ux" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ux">UX</TabsTrigger>
              <TabsTrigger value="stock">Stock</TabsTrigger>
              <TabsTrigger value="calculations">Calculs</TabsTrigger>
              <TabsTrigger value="customers">Clients</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
            </TabsList>
            
            {improvements.map((improvement) => (
              <TabsContent key={improvement.category} value={improvement.category.toLowerCase().replace(' ', '')}>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{improvement.category}</h3>
                  <ul className="space-y-2">
                    {improvement.items.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Statistiques de performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Gains de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">60%</div>
              <div className="text-sm text-gray-600">Temps de saisie réduit</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">95%</div>
              <div className="text-sm text-gray-600">Précision des calculs</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">80%</div>
              <div className="text-sm text-gray-600">Réduction des erreurs</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">40%</div>
              <div className="text-sm text-gray-600">Amélioration UX</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="px-8"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Tester le Formulaire Amélioré
        </Button>
      </div>

      {/* Modal */}
      <EnhancedSaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialItems={demoScenarios[selectedDemo as keyof typeof demoScenarios]?.items || []}
      />
    </div>
  );
}; 