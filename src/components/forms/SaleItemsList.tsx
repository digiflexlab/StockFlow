
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SaleItemRow } from './SaleItemRow';
import type { Product } from '@/types/products';

interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name?: string;
}

interface SaleItemsListProps {
  items: SaleItem[];
  products: Product[];
  onAddItem: () => void;
  onUpdateItem: (index: number, field: keyof SaleItem, value: any) => void;
  onRemoveItem: (index: number) => void;
}

export const SaleItemsList = ({ 
  items, 
  products, 
  onAddItem, 
  onUpdateItem, 
  onRemoveItem 
}: SaleItemsListProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Articles</CardTitle>
          <Button type="button" onClick={onAddItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un article
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <SaleItemRow
            key={index}
            item={item}
            index={index}
            products={products}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
          />
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun article ajouté. Cliquez sur "Ajouter un article" pour commencer.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
