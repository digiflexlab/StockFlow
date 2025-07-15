import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  User, 
  CreditCard, 
  Search,
  Plus,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { SimpleSaleModal } from '@/components/modals/SimpleSaleModal';

export const SimpleSaleFormTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const features = [
    {
      icon: Search,
      title: "Recherche Simple",
      description: "Tapez le nom ou SKU du produit pour l'ajouter au panier"
    },
    {
      icon: ShoppingCart,
      title: "Panier Direct",
      description: "Ajoutez les produits directement sans onglets complexes"
    },
    {
      icon: DollarSign,
      title: "Prix Modifiables",
      description: "Le vendeur peut modifier le prix avec validation du minimum"
    },
    {
      icon: User,
      title: "Client Simple",
      description: "Informations client basiques : nom, email, téléphone"
    },
    {
      icon: CreditCard,
      title: "Paiement Direct",
      description: "Choisir le mode de paiement et valider"
    },
    {
      icon: AlertTriangle,
      title: "Validation Prix",
      description: "Seuls admin/manager peuvent vendre sous le prix minimum avec justification"
    }
  ];

  const workflow = [
    {
      step: 1,
      title: "Sélectionner le magasin",
      description: "Choisir le magasin où la vente sera effectuée"
    },
    {
      step: 2,
      title: "Rechercher et ajouter des produits",
      description: "Taper le nom du produit et cliquer pour l'ajouter au panier"
    },
    {
      step: 3,
      title: "Ajuster les quantités et prix",
      description: "Modifier les quantités et prix directement dans le panier"
    },
    {
      step: 4,
      title: "Renseigner le client",
      description: "Saisir nom, email et téléphone du client"
    },
    {
      step: 5,
      title: "Choisir le paiement",
      description: "Sélectionner le mode de paiement et valider"
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Formulaire de Vente Simplifié</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Interface simple et directe pour les ventes quotidiennes. 
          Ajoutez des produits, renseignez le client, ajustez les prix et validez.
        </p>
      </div>

      {/* Fonctionnalités */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Fonctionnalités Principales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Processus de Vente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflow.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Règles de prix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Règles de Prix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Vendeurs</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Peuvent modifier le prix de vente</li>
                  <li>• Ne peuvent pas vendre sous le prix minimum</li>
                  <li>• Alertes automatiques si prix trop bas</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Admin/Manager</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Peuvent vendre sous le prix minimum</li>
                  <li>• Justification obligatoire</li>
                  <li>• Traçabilité complète des décisions</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avantages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Avantages de cette Approche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-600 mb-2">Simple</div>
              <p className="text-sm text-gray-600">Interface claire sans onglets complexes</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-blue-600 mb-2">Rapide</div>
              <p className="text-sm text-gray-600">Processus de vente en 5 étapes</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-purple-600 mb-2">Sécurisé</div>
              <p className="text-sm text-gray-600">Contrôle des prix et permissions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center">
        <Button 
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="px-8"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Tester le Formulaire Simplifié
        </Button>
      </div>

      {/* Modal */}
      <SimpleSaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}; 