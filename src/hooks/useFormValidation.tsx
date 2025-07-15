
import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

interface UseFormValidationProps<T> {
  initialData: T;
  validationSchema: ValidationSchema;
  onSubmit: (data: T) => Promise<void>;
}

export const useFormValidation = <T extends Record<string, any>>({
  initialData,
  validationSchema,
  onSubmit
}: UseFormValidationProps<T>) => {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback((key: string, value: any): string | null => {
    const rules = validationSchema[key];
    if (!rules) return null;

    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'Ce champ est obligatoire';
    }

    if (value && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `Minimum ${rules.minLength} caractères requis`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `Maximum ${rules.maxLength} caractères autorisés`;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Format invalide';
      }
    }

    if (value && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return `Valeur minimum : ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        return `Valeur maximum : ${rules.max}`;
      }
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [validationSchema]);

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(key => {
      const error = validateField(key, data[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [data, validateField, validationSchema]);

  const updateField = useCallback((key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    
    // Validation en temps réel
    const error = validateField(key, value);
    setErrors(prev => ({
      ...prev,
      [key]: error || ''
    }));
  }, [validateField]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      setIsDirty(false);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, onSubmit, validateAll]);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialData]);

  const isValid = Object.values(errors).every(error => !error);

  return {
    data,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    updateField,
    handleSubmit,
    resetForm,
    validateAll
  };
};
