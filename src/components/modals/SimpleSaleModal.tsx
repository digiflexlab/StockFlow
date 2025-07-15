import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SimpleSaleForm } from '@/components/forms/SimpleSaleForm';

interface SimpleSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId?: number;
}

export const SimpleSaleModal = ({ 
  isOpen, 
  onClose, 
  storeId 
}: SimpleSaleModalProps) => {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle Vente</DialogTitle>
          <DialogDescription>
            Ajoutez des produits au panier, renseignez les informations client et finalisez la vente.
          </DialogDescription>
        </DialogHeader>
        <SimpleSaleForm onSuccess={handleSuccess} defaultStoreId={storeId} />
      </DialogContent>
    </Dialog>
  );
}; 