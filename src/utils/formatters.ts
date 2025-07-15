import { APP_CONFIG, CURRENCY_OPTIONS } from './constants';

/**
 * Formate un prix avec la devise appropriée
 */
export const formatPrice = (price: number, currency: string = APP_CONFIG.defaultCurrency): string => {
  const currencyConfig = CURRENCY_OPTIONS.find(c => c.value === currency);
  const symbol = currencyConfig?.symbol || 'FCFA';
  
  return `${price.toFixed(2)} ${symbol}`;
};

/**
 * Formate une date au format français
 */
export const formatDate = (date: string | Date, includeTime: boolean = false): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('fr-FR', options);
};

/**
 * Formate un numéro de téléphone
 */
export const formatPhoneNumber = (phone: string): string => {
  // Supprime tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  
  // Format français : 01 23 45 67 89
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  return phone;
};

/**
 * Formate un nom complet
 */
export const formatName = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return '';
  if (!firstName) return lastName || '';
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`;
};

/**
 * Génère les initiales d'un nom
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Formate un pourcentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formate un nombre avec des séparateurs de milliers
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('fr-FR');
};

/**
 * Tronque un texte à une longueur donnée
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};