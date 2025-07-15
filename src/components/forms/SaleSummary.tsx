
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface SaleSummaryProps {
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  onDiscountChange: (value: number) => void;
}

export const SaleSummary = ({ 
  subtotal, 
  taxAmount, 
  discount, 
  total, 
  onDiscountChange 
}: SaleSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Récapitulatif</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span>Sous-total:</span>
          <span>{subtotal.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between">
          <span>TVA (20%):</span>
          <span>{taxAmount.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Remise:</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={discount}
              onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
              className="w-20"
            />
            <span>€</span>
          </div>
        </div>
        <hr />
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>{total.toFixed(2)}€</span>
        </div>
      </CardContent>
    </Card>
  );
};
