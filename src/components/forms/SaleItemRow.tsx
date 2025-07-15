
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { Product } from '@/types/products';

interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name?: string;
}

interface SaleItemRowProps {
  item: SaleItem;
  index: number;
  products: Product[];
  onUpdate: (index: number, field: keyof SaleItem, value: any) => void;
  onRemove: (index: number) => void;
}

export const SaleItemRow = ({ item, index, products, onUpdate, onRemove }: SaleItemRowProps) => {
  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      <div className="col-span-5">
        <Label>Produit</Label>
        <Select 
          value={item.product_id.toString()} 
          onValueChange={(value) => onUpdate(index, 'product_id', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un produit" />
          </SelectTrigger>
          <SelectContent>
            {products.map(product => (
              <SelectItem key={product.id} value={product.id.toString()}>
                {product.name} - {product.current_price}€
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2">
        <Label>Quantité</Label>
        <Input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
        />
      </div>

      <div className="col-span-2">
        <Label>Prix unitaire</Label>
        <Input
          type="number"
          step="0.01"
          value={item.unit_price}
          onChange={(e) => onUpdate(index, 'unit_price', parseFloat(e.target.value) || 0)}
        />
      </div>

      <div className="col-span-2">
        <Label>Total</Label>
        <Input
          type="number"
          step="0.01"
          value={item.total_price.toFixed(2)}
          readOnly
          className="bg-gray-50"
        />
      </div>

      <div className="col-span-1">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onRemove(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
