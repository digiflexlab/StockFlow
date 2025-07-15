import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductModalEnhanced } from '@/components/modals/ProductModalEnhanced';
import { Product } from '@/types/products';

export const ProductModalTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testProduct, setTestProduct] = useState<Product | null>(null);

  const handleTestNewProduct = () => {
    setTestProduct(null);
    setIsModalOpen(true);
  };

  const handleTestEditProduct = () => {
    // Produit de test pour le scénario "Huile palmiste"
    const mockProduct: Product = {
      id: 1,
      name: 'Huile palmiste',
      sku: 'HUILE-PALM-001',
      barcode: '6123456789012',
      category_id: 1,
      supplier_id: 1,
      unit_id: 2, // Bidon de 25L
      purchase_price: 15000,
      min_sale_price: 18000,
      current_price: 20000,
      tax_rate: 18,
      min_stock_threshold: 5,
      store_ids: [1, 2],
      description: 'Huile de palmiste pure, bidon de 25 litres',
      expiration_date: '2025-12-31',
      is_active: true,
      created_at: '2024-12-10T10:00:00Z',
      updated_at: '2024-12-10T10:00:00Z',
      categories: { name: 'Huiles' },
      suppliers: { name: 'Fournisseur Huiles' },
      units: { name: 'Bidon de 25L', symbol: '25L' }
    };
    
    setTestProduct(mockProduct);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test du ProductModal Enhanced</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleTestNewProduct} variant="default">
              Tester Nouveau Produit
            </Button>
            <Button onClick={handleTestEditProduct} variant="outline">
              Tester Édition Produit (Huile palmiste)
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Ce composant permet de tester le ProductModalEnhanced avec :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Génération automatique de SKU et code barre</li>
              <li>Calcul automatique des marges</li>
              <li>Validation des prix</li>
              <li>Sélection d'unités de vente</li>
              <li>Gestion des magasins multiples</li>
              <li>Calcul des taxes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <ProductModalEnhanced
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={testProduct}
      />
    </div>
  );
}; 