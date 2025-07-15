
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Package } from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useAuth } from '@/hooks/useAuth';

export const LowStockAlert = () => {
  const { profile } = useAuth();
  const { getLowStockItems } = useStock();
  const [isVisible, setIsVisible] = useState(true);
  
  const lowStockItems = getLowStockItems();
  
  // Ne pas afficher l'alerte si pas d'éléments en stock faible ou si l'utilisateur l'a fermée
  if (!isVisible || lowStockItems.length === 0 || profile?.role === 'seller') {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-orange-800">
            <strong>{lowStockItems.length}</strong> produit(s) en stock faible
          </span>
          <div className="flex gap-2">
            {lowStockItems.slice(0, 3).map((item) => (
              <Badge key={`${item.product_id}-${item.store_id}`} variant="outline" className="text-orange-700 border-orange-300">
                {item.products?.name} ({item.quantity})
              </Badge>
            ))}
            {lowStockItems.length > 3 && (
              <Badge variant="outline" className="text-orange-700 border-orange-300">
                +{lowStockItems.length - 3} autres
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-orange-600 hover:text-orange-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
