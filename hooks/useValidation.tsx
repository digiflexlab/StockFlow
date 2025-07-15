
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

export const useValidation = () => {
  const validateField = (value: any, rules: ValidationRule): string | null => {
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'Ce champ est requis';
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
        return `Valeur minimum: ${rules.min}`;
      }
      
      if (rules.max !== undefined && value > rules.max) {
        return `Valeur maximum: ${rules.max}`;
      }
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  };

  const validateObject = (data: Record<string, any>, schema: ValidationSchema) => {
    const errors: Record<string, string> = {};
    
    Object.keys(schema).forEach(key => {
      const error = validateField(data[key], schema[key]);
      if (error) {
        errors[key] = error;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Schémas de validation prédéfinis
  const schemas = {
    product: {
      name: { required: true, minLength: 1, maxLength: 255 },
      sku: { 
        required: true, 
        pattern: /^[A-Za-z0-9_-]+$/,
        maxLength: 100
      },
      purchase_price: { required: true, min: 0.01 },
      min_sale_price: { required: true, min: 0.01 },
      current_price: { required: true, min: 0.01 },
      category_id: { required: true },
      supplier_id: { required: true }
    },
    supplier: {
      name: { required: true, minLength: 1, maxLength: 255 },
      email: { 
        pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      },
      phone: {
        pattern: /^\+?[0-9\s\-\(\)]+$/
      }
    },
    store: {
      name: { required: true, minLength: 1, maxLength: 255 },
      email: { 
        pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      },
      phone: {
        pattern: /^\+?[0-9\s\-\(\)]+$/
      }
    },
    category: {
      name: { required: true, minLength: 1, maxLength: 100 }
    }
  };

  return { validateField, validateObject, schemas };
};
