
import type { ProductFormData } from '@/types/products';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateProduct = (productData: ProductFormData): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validation du nom
  if (!productData.name || productData.name.trim().length === 0) {
    errors.name = 'Le nom du produit est requis';
  } else if (productData.name.trim().length > 255) {
    errors.name = 'Le nom ne peut pas dépasser 255 caractères';
  }

  // Validation du SKU
  if (!productData.sku || productData.sku.trim().length === 0) {
    errors.sku = 'Le SKU est requis';
  } else if (!/^[A-Za-z0-9_-]+$/.test(productData.sku)) {
    errors.sku = 'Le SKU ne peut contenir que des lettres, chiffres, tirets et underscores';
  } else if (productData.sku.length > 100) {
    errors.sku = 'Le SKU ne peut pas dépasser 100 caractères';
  }

  // Validation du code barre
  if (productData.barcode && !/^[0-9]{8,13}$/.test(productData.barcode)) {
    errors.barcode = 'Le code barre doit contenir 8 à 13 chiffres';
  }

  // Validation de la catégorie
  if (!productData.category_id || productData.category_id <= 0) {
    errors.category_id = 'Veuillez sélectionner une catégorie';
  }

  // Validation du fournisseur
  if (!productData.supplier_id || productData.supplier_id <= 0) {
    errors.supplier_id = 'Veuillez sélectionner un fournisseur';
  }

  // Validation de l'unité
  if (!productData.unit_id || productData.unit_id <= 0) {
    errors.unit_id = 'Veuillez sélectionner une unité de vente';
  }

  // Validation des prix
  if (!productData.purchase_price || productData.purchase_price <= 0) {
    errors.purchase_price = 'Le prix d\'achat doit être supérieur à 0';
  }

  if (!productData.min_sale_price || productData.min_sale_price <= 0) {
    errors.min_sale_price = 'Le prix de vente minimum doit être supérieur à 0';
  } else if (productData.purchase_price && productData.min_sale_price < productData.purchase_price) {
    errors.min_sale_price = 'Le prix de vente minimum doit être supérieur au prix d\'achat';
  }

  if (!productData.current_price || productData.current_price <= 0) {
    errors.current_price = 'Le prix actuel doit être supérieur à 0';
  } else if (productData.min_sale_price && productData.current_price < productData.min_sale_price) {
    errors.current_price = 'Le prix actuel doit être supérieur au prix de vente minimum';
  }

  // Validation du taux de taxe
  if (productData.tax_rate !== undefined && (productData.tax_rate < 0 || productData.tax_rate > 100)) {
    errors.tax_rate = 'Le taux de taxe doit être entre 0 et 100%';
  }

  // Validation du seuil d'alerte
  if (productData.min_stock_threshold !== undefined && productData.min_stock_threshold < 0) {
    errors.min_stock_threshold = 'Le seuil d\'alerte ne peut pas être négatif';
  }

  // Validation des magasins
  if (productData.store_ids && productData.store_ids.length === 0) {
    errors.store_ids = 'Veuillez sélectionner au moins un magasin';
  }

  // Validation de la description
  if (productData.description && productData.description.length > 1000) {
    errors.description = 'La description ne peut pas dépasser 1000 caractères';
  }

  // Validation de la date d'expiration
  if (productData.expiration_date) {
    const expirationDate = new Date(productData.expiration_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expirationDate < today) {
      errors.expiration_date = 'La date d\'expiration ne peut pas être dans le passé';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
