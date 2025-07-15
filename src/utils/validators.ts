/**
 * Valide une adresse email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone français
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Valide un SKU (Stock Keeping Unit)
 */
export const isValidSKU = (sku: string): boolean => {
  // SKU doit contenir 3-20 caractères alphanumériques et tirets
  const skuRegex = /^[A-Za-z0-9-]{3,20}$/;
  return skuRegex.test(sku);
};

/**
 * Valide un prix
 */
export const isValidPrice = (price: number): boolean => {
  return price > 0 && Number.isFinite(price);
};

/**
 * Valide une quantité
 */
export const isValidQuantity = (quantity: number): boolean => {
  return Number.isInteger(quantity) && quantity >= 0;
};

/**
 * Valide une date d'expiration
 */
export const isValidExpirationDate = (date: string): boolean => {
  const expirationDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return expirationDate >= today;
};

/**
 * Valide un nom (2-50 caractères)
 */
export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

/**
 * Valide un mot de passe (8+ caractères avec au moins une lettre et un chiffre)
 */
export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Valide un pourcentage (0-100)
 */
export const isValidPercentage = (percentage: number): boolean => {
  return percentage >= 0 && percentage <= 100;
};

/**
 * Messages d'erreur de validation
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Ce champ est requis',
  INVALID_EMAIL: 'Adresse email invalide',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  INVALID_SKU: 'SKU invalide (3-20 caractères alphanumériques)',
  INVALID_PRICE: 'Le prix doit être supérieur à 0',
  INVALID_QUANTITY: 'La quantité doit être un nombre entier positif',
  INVALID_DATE: 'Date invalide',
  INVALID_EXPIRATION_DATE: 'La date d\'expiration ne peut pas être dans le passé',
  INVALID_NAME: 'Le nom doit contenir entre 2 et 50 caractères',
  INVALID_PASSWORD: 'Le mot de passe doit contenir au moins 8 caractères avec une lettre et un chiffre',
  INVALID_PERCENTAGE: 'Le pourcentage doit être entre 0 et 100',
  MIN_LENGTH: (min: number) => `Minimum ${min} caractères requis`,
  MAX_LENGTH: (max: number) => `Maximum ${max} caractères autorisés`,
  MIN_VALUE: (min: number) => `Valeur minimum: ${min}`,
  MAX_VALUE: (max: number) => `Valeur maximum: ${max}`,
} as const;