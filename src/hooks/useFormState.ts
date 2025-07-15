
import { useState } from 'react';

export const useFormState = <T extends Record<string, any>>(initialState: T) => {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const setError = (field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const reset = () => {
    setFormData(initialState);
    setErrors({});
  };

  const hasErrors = () => {
    return Object.values(errors).some(error => error !== undefined);
  };

  const getValue = <K extends keyof T>(field: K): T[K] => {
    return formData[field];
  };

  const getError = (field: keyof T) => {
    return errors[field];
  };

  return {
    formData,
    errors,
    updateField,
    setError,
    reset,
    setFormData,
    hasErrors,
    getValue,
    getError
  };
};
