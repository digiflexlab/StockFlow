
// Utilitaires de sécurité et validation
export const validateUserPermissions = (userRole: string, requiredRole: string[]): boolean => {
  const roleHierarchy = {
    admin: 3,
    manager: 2,
    seller: 1
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevels = requiredRole.map(role => roleHierarchy[role as keyof typeof roleHierarchy] || 0);
  
  return requiredLevels.some(level => userLevel >= level);
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '').trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
  return phoneRegex.test(phone);
};

export const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const calculateTaxAmount = (baseAmount: number, taxRate: number): number => {
  return Math.round((baseAmount * taxRate / 100) * 100) / 100;
};
