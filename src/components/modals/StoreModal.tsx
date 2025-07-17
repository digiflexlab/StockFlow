
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useStores, Store } from '@/hooks/useStores';
import { toast } from '@/hooks/use-toast';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store?: Store | null;
}

const initialStoreData = {
  name: '',
  address: '',
  phone: '',
  email: '',
};

const storeValidationSchema = {
  name: { 
    required: true, 
    minLength: 1, 
    maxLength: 255 
  },
  address: { 
    required: true,
    minLength: 5,
    maxLength: 500
  },
  phone: { 
    required: true,
    pattern: /^\+?[0-9\s\-\(\)]+$/,
    custom: (value: string) => {
      if (value && !/^\+?[0-9\s\-\(\)]+$/.test(value)) {
        return 'Format de téléphone invalide';
      }
      return null;
    }
  },
  email: { 
    required: true,
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    custom: (value: string) => {
      if (value && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
        return 'Format d\'email invalide';
      }
      return null;
    }
  }
};

export const StoreModal = ({ isOpen, onClose, store }: StoreModalProps) => {
  const { createStore, updateStore } = useStores();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    data,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    updateField,
    handleSubmit,
    resetForm
  } = useFormValidation({
    initialData: initialStoreData,
    validationSchema: storeValidationSchema,
    onSubmit: async (storeData) => {
      setServerError(null);
      try {
        if (store) {
          await updateStore({ id: store.id, storeData });
          toast({
            title: "Magasin modifié",
            description: "Le magasin a été modifié avec succès.",
          });
        } else {
          await createStore(storeData);
          toast({
            title: "Magasin créé",
            description: "Le magasin a été créé avec succès.",
          });
        }
        onClose();
      } catch (error: any) {
        setServerError(error?.message || "Une erreur est survenue lors de l'enregistrement.");
      }
    }
  });

  // Charger les données du magasin à éditer
  useEffect(() => {
    if (store && isOpen) {
      Object.keys(initialStoreData).forEach(key => {
        const value = store[key as keyof Store];
        updateField(key, value || initialStoreData[key as keyof typeof initialStoreData]);
      });
    } else if (!store && isOpen) {
      resetForm();
    }
  }, [store, isOpen, updateField, resetForm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {store ? 'Modifier le magasin' : 'Nouveau magasin'}
          </DialogTitle>
          <DialogDescription>
            Saisissez les informations du magasin (nom, adresse, téléphone, email).
          </DialogDescription>
        </DialogHeader>
        {serverError && (
          <div className="mb-4 text-red-600" role="alert" aria-live="assertive">{serverError}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="name"
            label="Nom du magasin"
            value={data.name}
            onChange={(value) => updateField('name', value)}
            error={errors.name}
            placeholder="Nom du magasin"
            required
            disabled={isSubmitting}
            autoComplete="organization"
          />

          <FormField
            id="address"
            label="Adresse"
            type="textarea"
            value={data.address}
            onChange={(value) => updateField('address', value)}
            error={errors.address}
            placeholder="Adresse complète du magasin"
            required
            disabled={isSubmitting}
            rows={2}
            autoComplete="street-address"
          />

          <FormField
            id="phone"
            label="Téléphone"
            value={data.phone}
            onChange={(value) => updateField('phone', value)}
            error={errors.phone}
            placeholder="+221 77 123 4567"
            required
            disabled={isSubmitting}
            autoComplete="tel"
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            value={data.email}
            onChange={(value) => updateField('email', value)}
            error={errors.email}
            placeholder="email@magasin.com"
            required
            disabled={isSubmitting}
            autoComplete="email"
          />

          <FormActions
            onCancel={onClose}
            isSubmitting={isSubmitting}
            isValid={isValid}
            isDirty={isDirty}
            submitLabel={store ? 'Modifier' : 'Créer'}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
