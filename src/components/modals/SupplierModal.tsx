
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useSuppliers, Supplier } from '@/hooks/useSuppliers';
import { toast } from '@/hooks/use-toast';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

const initialSupplierData = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
};

const supplierValidationSchema = {
  name: { 
    required: true, 
    minLength: 1, 
    maxLength: 255 
  },
  email: { 
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    custom: (value: string) => {
      if (value && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
        return 'Format d\'email invalide';
      }
      return null;
    }
  },
  phone: {
    pattern: /^\+?[0-9\s\-\(\)]+$/,
    custom: (value: string) => {
      if (value && !/^\+?[0-9\s\-\(\)]+$/.test(value)) {
        return 'Format de téléphone invalide';
      }
      return null;
    }
  }
};

export const SupplierModal = ({ isOpen, onClose, supplier }: SupplierModalProps) => {
  const { createSupplier, updateSupplier } = useSuppliers();
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
    initialData: initialSupplierData,
    validationSchema: supplierValidationSchema,
    onSubmit: async (supplierData) => {
      setServerError(null);
      try {
        if (supplier) {
          await updateSupplier({ id: supplier.id, supplierData });
          toast({
            title: "Fournisseur modifié",
            description: "Le fournisseur a été modifié avec succès.",
          });
        } else {
          await createSupplier(supplierData);
          toast({
            title: "Fournisseur créé",
            description: "Le fournisseur a été créé avec succès.",
          });
        }
        onClose();
      } catch (error: any) {
        setServerError(error?.message || "Une erreur est survenue lors de l'enregistrement.");
      }
    }
  });

  // Charger les données du fournisseur à éditer
  useEffect(() => {
    if (supplier && isOpen) {
      Object.keys(initialSupplierData).forEach(key => {
        const value = supplier[key as keyof Supplier];
        updateField(key, value || initialSupplierData[key as keyof typeof initialSupplierData]);
      });
    } else if (!supplier && isOpen) {
      resetForm();
    }
  }, [supplier, isOpen, updateField, resetForm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {supplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </DialogTitle>
        </DialogHeader>
        {serverError && (
          <div className="mb-4 text-red-600" role="alert" aria-live="assertive">{serverError}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="name"
            label="Nom du fournisseur"
            value={data.name}
            onChange={(value) => updateField('name', value)}
            error={errors.name}
            placeholder="Nom du fournisseur"
            required
            disabled={isSubmitting}
          />

          <FormField
            id="contact_person"
            label="Personne de contact"
            value={data.contact_person}
            onChange={(value) => updateField('contact_person', value)}
            error={errors.contact_person}
            placeholder="Nom du contact"
            disabled={isSubmitting}
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            value={data.email}
            onChange={(value) => updateField('email', value)}
            error={errors.email}
            placeholder="email@exemple.com"
            disabled={isSubmitting}
          />

          <FormField
            id="phone"
            label="Téléphone"
            value={data.phone}
            onChange={(value) => updateField('phone', value)}
            error={errors.phone}
            placeholder="+221 77 123 4567"
            disabled={isSubmitting}
          />

          <FormField
            id="address"
            label="Adresse"
            type="textarea"
            value={data.address}
            onChange={(value) => updateField('address', value)}
            error={errors.address}
            placeholder="Adresse complète"
            rows={3}
            disabled={isSubmitting}
          />

          <FormActions
            onCancel={onClose}
            isSubmitting={isSubmitting}
            isValid={isValid}
            isDirty={isDirty}
            submitLabel={supplier ? 'Modifier' : 'Créer'}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
