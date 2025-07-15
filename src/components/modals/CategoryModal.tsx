
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useCategories, Category } from '@/hooks/useCategories';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

const initialCategoryData = {
  name: '',
  description: ''
};

const categoryValidationSchema = {
  name: { 
    required: true, 
    minLength: 1, 
    maxLength: 100 
  }
};

export const CategoryModal = ({ isOpen, onClose, category }: CategoryModalProps) => {
  const { createCategory, updateCategory, isCreating, isUpdating } = useCategories();
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
    initialData: initialCategoryData,
    validationSchema: categoryValidationSchema,
    onSubmit: async (categoryData) => {
      setServerError(null);
      try {
        if (category) {
          await updateCategory({ id: category.id, categoryData });
        } else {
          await createCategory(categoryData);
        }
        onClose();
      } catch (error: any) {
        setServerError(error?.message || "Une erreur est survenue lors de l'enregistrement.");
      }
    }
  });

  // Charger les données de la catégorie à éditer
  useEffect(() => {
    if (category && isOpen) {
      updateField('name', category.name);
      updateField('description', category.description || '');
    } else if (!category && isOpen) {
      resetForm();
    }
  }, [category, isOpen, updateField, resetForm]);

  const isProcessing = isSubmitting || isCreating || isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </DialogTitle>
        </DialogHeader>
        {serverError && (
          <div className="mb-4 text-red-600" role="alert" aria-live="assertive">{serverError}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="name"
            label="Nom de la catégorie"
            value={data.name}
            onChange={(value) => updateField('name', value)}
            error={errors.name}
            placeholder="Nom de la catégorie"
            required
            disabled={isProcessing}
          />

          <FormField
            id="description"
            label="Description"
            type="textarea"
            value={data.description}
            onChange={(value) => updateField('description', value)}
            error={errors.description}
            placeholder="Description de la catégorie (optionnel)"
            rows={3}
            disabled={isProcessing}
          />

          <FormActions
            onCancel={onClose}
            isSubmitting={isProcessing}
            isValid={isValid}
            isDirty={isDirty}
            submitLabel={category ? 'Modifier' : 'Créer'}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
