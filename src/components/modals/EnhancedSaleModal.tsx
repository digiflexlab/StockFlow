import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnhancedSaleForm } from '@/components/forms/EnhancedSaleForm';

interface EnhancedSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId?: number;
  initialItems?: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name?: string;
  }>;
}

export const EnhancedSaleModal = ({ 
  isOpen, 
  onClose, 
  storeId, 
  initialItems = [] 
}: EnhancedSaleModalProps) => {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle Vente - Mode Avancé</DialogTitle>
          <DialogDescription>
            Créez une vente complète avec gestion avancée du stock, calculs automatiques et validation en temps réel.
          </DialogDescription>
        </DialogHeader>
        <EnhancedSaleForm 
          onSuccess={handleSuccess} 
          defaultStoreId={storeId}
          initialItems={initialItems}
        />
      </DialogContent>
    </Dialog>
  );
}; 