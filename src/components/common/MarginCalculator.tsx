import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, AlertTriangle } from 'lucide-react';

interface MarginCalculatorProps {
  purchasePrice: number;
  currentPrice: number;
  taxRate: number;
  minSalePrice?: number;
}

export const MarginCalculator = ({ 
  purchasePrice, 
  currentPrice, 
  taxRate, 
  minSalePrice 
}: MarginCalculatorProps) => {
  const margin = currentPrice - purchasePrice;
  const marginPercentage = purchasePrice > 0 ? (margin / purchasePrice) * 100 : 0;
  const taxAmount = (currentPrice * taxRate) / 100;
  const priceWithTax = currentPrice + taxAmount;
  const profitAfterTax = priceWithTax - purchasePrice;
  const profitPercentage = purchasePrice > 0 ? (profitAfterTax / purchasePrice) * 100 : 0;

  const isLowMargin = marginPercentage < 10;
  const isGoodMargin = marginPercentage >= 20;
  const isBelowMinPrice = minSalePrice && currentPrice < minSalePrice;

  const getMarginColor = () => {
    if (isLowMargin) return 'text-red-600';
    if (isGoodMargin) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getMarginBadgeVariant = () => {
    if (isLowMargin) return 'destructive';
    if (isGoodMargin) return 'default';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calculator className="h-4 w-4" />
          Calcul des marges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix d'achat:</span>
              <span className="font-medium">{purchasePrice.toFixed(2)} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix de vente:</span>
              <span className="font-medium">{currentPrice.toFixed(2)} FCFA</span>
            </div>
            {minSalePrice && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prix minimum:</span>
                <span className="font-medium">{minSalePrice.toFixed(2)} FCFA</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Marge brute:</span>
              <div className="flex items-center gap-1">
                <span className={`font-medium ${getMarginColor()}`}>
                  {margin.toFixed(2)} FCFA
                </span>
                <Badge variant={getMarginBadgeVariant()} className="text-xs">
                  {marginPercentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA ({taxRate}%):</span>
              <span className="font-medium">{taxAmount.toFixed(2)} FCFA</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-medium">Prix TTC:</span>
              <span className="font-bold">{priceWithTax.toFixed(2)} FCFA</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Bénéfice net:</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${profitAfterTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitAfterTax.toFixed(2)} FCFA
              </span>
              <Badge variant={profitAfterTax >= 0 ? 'default' : 'destructive'} className="text-xs">
                {profitPercentage.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Alertes */}
        <div className="space-y-2">
          {isLowMargin && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">
                Marge faible ({marginPercentage.toFixed(1)}%). Considérez augmenter le prix de vente.
              </span>
            </div>
          )}

          {isGoodMargin && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                Excellente marge ({marginPercentage.toFixed(1)}%) !
              </span>
            </div>
          )}

          {isBelowMinPrice && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Prix en dessous du minimum recommandé.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 