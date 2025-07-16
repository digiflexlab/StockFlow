
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bell, Package, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: Record<string, number>;
  minStock?: number;
}

interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  severity: 'low' | 'critical';
  storeId: string;
  storeName: string;
}

interface StockAlertsProps {
  products: Product[];
  stores: Array<{ id: string; name: string }>;
  userRole?: string;
  userStoreIds?: number[];
  onDismiss?: (alertId: string) => void;
}

export const StockAlerts = ({ products, stores, userRole, userStoreIds, onDismiss }: StockAlertsProps) => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    const generateAlerts = () => {
      const newAlerts: StockAlert[] = [];

      products.forEach(product => {
        const minStock = product.minStock || 5; // Seuil par défaut
        
        Object.entries(product.stock ?? {}).forEach(([storeId, stock]) => {
          const store = stores.find(s => s.id === storeId);
          
          // Filtrer selon les permissions de l'utilisateur
          if (userRole === 'seller' && userStoreIds && !userStoreIds.includes(parseInt(storeId))) {
            return; // Ignorer les magasins non assignés au vendeur
          }
          
          if (userRole === 'manager' && userStoreIds && !userStoreIds.includes(parseInt(storeId))) {
            return; // Ignorer les magasins non assignés au manager
          }
          
          // Admin voit tous les magasins (pas de filtre)
          
          if (stock <= minStock) {
            newAlerts.push({
              id: `${product.id}-${storeId}`,
              productId: product.id,
              productName: product.name,
              currentStock: stock,
              minStock,
              severity: stock === 0 ? 'critical' : 'low',
              storeId,
              storeName: store?.name || 'Magasin inconnu'
            });
          }
        });
      });

      setAlerts(newAlerts);
    };

    generateAlerts();
  }, [products, stores, userRole, userStoreIds]);

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    onDismiss?.(alertId);
  };

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const lowStockAlerts = alerts.filter(alert => alert.severity === 'low');

  // Obtenir le message selon le rôle
  const getEmptyStateMessage = () => {
    if (userRole === 'admin') {
      return {
        title: "Stock optimal",
        description: "Tous vos produits ont un stock suffisant"
      };
    } else if (userRole === 'manager') {
      return {
        title: "Stock optimal dans vos magasins",
        description: `Tous les produits dans vos ${stores.length} magasin(s) ont un stock suffisant`
      };
    } else {
      return {
        title: "Stock optimal dans votre magasin",
        description: "Tous les produits dans votre magasin ont un stock suffisant"
      };
    }
  };

  // Obtenir le titre des alertes selon le rôle
  const getAlertTitle = (type: 'critical' | 'low', count: number) => {
    const baseTitle = type === 'critical' ? 'Alertes Critiques' : 'Stock Faible';
    
    if (userRole === 'admin') {
      return `${baseTitle} (${count})`;
    } else if (userRole === 'manager') {
      return `${baseTitle} - Vos magasins (${count})`;
    } else {
      return `${baseTitle} - Votre magasin (${count})`;
    }
  };

  if (alerts.length === 0) {
    const emptyState = getEmptyStateMessage();
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
          <p className="text-gray-600">{emptyState.description}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              {getAlertTitle('critical', criticalAlerts.length)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">RUPTURE</Badge>
                    <span className="font-medium">{alert.productName}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.storeName} - Stock: {alert.currentStock} / Min: {alert.minStock}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismissAlert(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {lowStockAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bell className="h-5 w-5" />
              {getAlertTitle('low', lowStockAlerts.length)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800">STOCK FAIBLE</Badge>
                    <span className="font-medium">{alert.productName}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.storeName} - Stock: {alert.currentStock} / Min: {alert.minStock}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismissAlert(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
