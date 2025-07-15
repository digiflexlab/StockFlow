
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SaleForm } from '@/components/forms/SaleForm';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId?: number;
}

export const SaleModal = ({ isOpen, onClose, storeId }: SaleModalProps) => {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle vente</DialogTitle>
          <DialogDescription>
            Créer une nouvelle vente en sélectionnant les produits et en renseignant les informations client.
          </DialogDescription>
        </DialogHeader>
        <SaleForm onSuccess={handleSuccess} defaultStoreId={storeId} />
      </DialogContent>
    </Dialog>
  );
};
